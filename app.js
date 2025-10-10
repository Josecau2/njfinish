const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');
const paymentsRoutes = require('./routes/payments');
const paymentConfigRoutes = require('./routes/paymentConfig');
const sequelize = require('./config/db');
const path = require('path');
const env = require('./config/env');
const startupHandler = require('./startup-handler');
const { withBrandInline } = require('./server/middleware/withBrandInline');
const { regenerateBrandSnapshot } = require('./server/branding/regenerateBrandSnapshot');
const { serveUpload } = require('./controllers/uploadServeController');
const { servePublicUpload } = require('./controllers/publicUploadsController');
const { attachTokenFromQuery, verifyTokenWithGroup } = require('./middleware/auth');

// Initialize event manager for domain events
require('./utils/eventManager');

const app = express();

app.set('trust proxy', 1);

// Security headers middleware
app.use((req, res, next) => {
  const cspNonce = crypto.randomBytes(16).toString('base64');
  res.locals.cspNonce = cspNonce;

  // Remove server signature
  res.removeHeader('X-Powered-By');

  // Security headers to prevent information disclosure
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Content Security Policy (allow listed origins for images and API/connect)
  const originList = (env.CORS_ALLOWED_ORIGINS || []).join(' ');
  const stripeImgSrc = 'https://q.stripe.com';
  const imgSrc = `img-src 'self' data: blob: ${originList} ${stripeImgSrc}`.trim();
  // Allow Cloudflare Web Analytics beacons
  const cfScriptSrc = 'https://static.cloudflareinsights.com';
  // Allow Stripe JS for payment processing
  const stripeScriptSrc = 'https://js.stripe.com';
  const cfConnectSrc = 'https://cloudflareinsights.com https://*.cloudflareinsights.com';
  const stripeConnectSrc = 'https://api.stripe.com';
  const connectSrc = `connect-src 'self' ${originList} ws: wss: ${cfConnectSrc} ${cfScriptSrc} ${stripeConnectSrc}`.trim();
  const frameSrc = `frame-src ${stripeScriptSrc} https://hooks.stripe.com`;
  // Some libraries (e.g., pdf.js/react-pdf) use Web Workers via blob: URLs and may import small
  // chunks via data: or blob: URLs. Our hardened CSP needs to explicitly allow those in a
  // controlled manner. We do NOT enable general inline scripts; we keep nonce for inlined brand payloads.
  const scriptSrc = `script-src 'self' 'nonce-${cspNonce}' ${cfScriptSrc} ${stripeScriptSrc} blob: data:`.trim();
  const scriptSrcElem = `script-src-elem 'self' 'nonce-${cspNonce}' ${cfScriptSrc} ${stripeScriptSrc} blob: data:`.trim();
  const workerSrc = "worker-src 'self' blob: data:";
  const childSrc = "child-src 'self' blob: data:"; // legacy fallback for some UAs
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      scriptSrc,
      scriptSrcElem,
      `style-src 'self' 'unsafe-inline'`,
      imgSrc,
      "font-src 'self' data:",
      "object-src 'none'",
      connectSrc,
      frameSrc,
      workerSrc,
      childSrc,
      "frame-ancestors 'none'",
    ].join('; ') + ';'
  );

  next();
});

// Resolve allowed origins from env or fallback defaults
const allowedOrigins = env.CORS_ALLOWED_ORIGINS;

// Configure CORS based on environment
const corsOptions = {
  origin: function (origin, callback) {
    // Allow no-origin requests (same-origin requests, Postman, server-to-server)
    // Browsers don't send Origin header for same-origin requests
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// app.use(cors());
// Stripe webhook must be mounted before body parsers so we can access the raw payload
app.post('/api/payments/stripe/webhook', paymentsRoutes.stripeWebhookRaw, paymentsRoutes.handleStripeWebhook);
app.post('/api/payments/stripe/webhook/:token', paymentsRoutes.stripeWebhookRaw, paymentsRoutes.handleStripeWebhook);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/payment-config', paymentConfigRoutes);
app.use('/api', apiRoutes);

// Public readonly image route (whitelisted subpaths) to avoid CORB for assets used in PDFs/emails.
// Example: <img src="/public-uploads/uploads/branding/logo.png"> (preferred) OR existing absolute URL.
// Keeps original /uploads secured while offering safe access for non-auth contexts (PDF renderer, email clients, etc.)
app.use('/public-uploads', servePublicUpload);

// Auth-protected uploads router (legacy / internal usage requiring token)
const uploadsRouter = express.Router();
uploadsRouter.use(attachTokenFromQuery({ extraParams: ['access_token', 'authToken'] }));
uploadsRouter.use(verifyTokenWithGroup);
uploadsRouter.use('/', serveUpload);
app.use('/uploads', uploadsRouter);

// Serve SPA static assets from configurable directory (defaults to /app/build)
const STATIC_DIR = process.env.STATIC_DIR || path.join(__dirname, 'build');
const BRAND_ASSET_DIR = path.join(process.cwd(), 'public', 'brand');
const INDEX_HTML_PATH = path.resolve(STATIC_DIR, 'index.html');
app.use('/brand', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, must-revalidate');
  next();
}, express.static(BRAND_ASSET_DIR));

// Serve static assets but exclude index.html so we can handle it with brand injection
app.use(express.static(STATIC_DIR, {
  index: false  // Prevent serving index.html automatically
}));

function serveSpaWithBrand(req, res) {
  try {
    // Ensure the SPA shell is never cached so brand/customization updates are reflected immediately
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    const html = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
    const nonce = res.locals.cspNonce;
    res.send(withBrandInline(html, { nonce }));
  } catch (err) {
    console.error('Failed to serve SPA shell:', err);
    res.status(500).send('Unable to load application shell');
  }
}

// Fallback route to serve index.html for non-API requests (React Router)
app.get('/', serveSpaWithBrand);

app.get(/^(?!\/api).*$/, serveSpaWithBrand);

// Guarded sync: default none in production. 'create' creates missing tables; 'alter' only in dev.
const syncMode = env.DB_SYNC_MODE; // none|create|alter
const syncOptions = syncMode === 'alter' ? { alter: true } : syncMode === 'create' ? {} : null;

const syncPromise = syncOptions ? sequelize.sync(syncOptions) : Promise.resolve();

syncPromise.then(async () => {
  console.log('Database synced');

  // On startup, persist latest customization + login customization to frontend static config
  try {
    const { writeFrontendCustomization } = require('./utils/frontendConfigWriter');
    const { writeFrontendLoginCustomization } = require('./utils/frontendLoginConfigWriter');
    const Customization = require('./models/Customization');
    const LoginCustomization = require('./models/LoginCustomization');

    const latestApp = await Customization.findOne({ order: [['updatedAt', 'DESC']] });
    if (latestApp) {
      await writeFrontendCustomization(latestApp.toJSON());
      console.log('[Startup] Persisted app customization to static config');
    }
    const latestLogin = await LoginCustomization.findOne({ order: [['updatedAt', 'DESC']] });
    if (latestLogin) {
      const loginConfig = latestLogin.toJSON();
      await writeFrontendLoginCustomization(loginConfig);
      console.log('[Startup] Persisted login customization to static config');
      try {
        const { extractEmailSettings } = require('./services/loginCustomizationCache');
        const { applyTransportConfig } = require('./utils/mail');
        const emailSettings = extractEmailSettings(loginConfig);
        const result = applyTransportConfig(emailSettings);
        if (!result.success) {
          console.warn('[Startup] SMTP settings incomplete; email sending remains disabled.');
        }
      } catch (smtpError) {
        console.warn('[Startup] Failed to apply SMTP settings:', smtpError?.message || smtpError);
      }
    }
    try {
      await regenerateBrandSnapshot();
      console.log('[Startup] Regenerated brand snapshot inline assets');
    } catch (brandErr) {
      console.warn('Startup brand snapshot regeneration failed:', brandErr?.message || brandErr);
    }

  } catch (e) {
    console.warn('Startup customization persistence failed:', e?.message);
  }

  // Run production setup automatically if needed
  if (process.env.NODE_ENV === 'production') {
    await startupHandler.checkAndRunSetup();
  }
}).catch(error => {
  console.error('Database sync failed:', error);
});

module.exports = app;



