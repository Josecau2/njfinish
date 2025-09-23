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

// Initialize event manager for domain events
require('./utils/eventManager');

const app = express();

// Security headers middleware
app.use((req, res, next) => {
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
  const imgSrc = `img-src 'self' data: blob: ${originList}`.trim();
  const connectSrc = `connect-src 'self' ${originList} ws: wss:`.trim();
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      imgSrc,
      "font-src 'self' data:",
      connectSrc,
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
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/payment-config', paymentConfigRoutes);
app.use('/api', apiRoutes);

// Serve static uploads
// Serve static uploads using configured path
app.use('/uploads', express.static(path.resolve(__dirname, env.UPLOAD_PATH)));
app.use('/uploads/images', express.static(path.resolve(__dirname, env.UPLOAD_PATH, 'images')));
app.use('/uploads/logos', express.static(path.resolve(__dirname, env.UPLOAD_PATH, 'logos')));
app.use('/uploads/manufacturer_catalogs', express.static(path.resolve(__dirname, env.UPLOAD_PATH, 'manufacturer_catalogs')));

// Serve SPA static assets from configurable directory (defaults to /app/build)
const STATIC_DIR = process.env.STATIC_DIR || path.join(__dirname, 'build');
app.use(express.static(STATIC_DIR));

// Fallback route to serve index.html for non-API requests (React Router)
app.get('/', (req, res) => {
  res.sendFile(path.resolve(STATIC_DIR, 'index.html'));
});

app.get(/^(?!\/api).*$/, (req, res) => {
  res.sendFile(path.resolve(STATIC_DIR, 'index.html'));
});

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
