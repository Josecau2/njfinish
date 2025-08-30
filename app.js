const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');
const sequelize = require('./config/db');
const path = require('path');
const env = require('./config/env');
const startupHandler = require('./startup-handler');

// Initialize event manager for domain events
require('./utils/eventManager');

const app = express();

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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Serve static uploads
// Serve static uploads using configured path
app.use('/uploads', express.static(path.resolve(__dirname, env.UPLOAD_PATH)));
app.use('/uploads/images', express.static(path.resolve(__dirname, env.UPLOAD_PATH, 'images')));
app.use('/uploads/logos', express.static(path.resolve(__dirname, env.UPLOAD_PATH, 'logos')));
app.use('/uploads/manufacturer_catalogs', express.static(path.resolve(__dirname, env.UPLOAD_PATH, 'manufacturer_catalogs')));

const buildPath = path.join(__dirname, 'frontend', 'build');
app.use(express.static(buildPath));

// Fallback route to serve index.html for non-API requests (React Router)
app.get('/', (req, res) => {
  res.sendFile(path.resolve(buildPath, 'index.html'));
});

app.get(/^(?!\/api).*$/, (req, res) => {
  res.sendFile(path.resolve(buildPath, 'index.html'));
});

// Guarded sync: default none in production. 'create' creates missing tables; 'alter' only in dev.
const syncMode = env.DB_SYNC_MODE; // none|create|alter
const syncOptions = syncMode === 'alter' ? { alter: true } : syncMode === 'create' ? {} : null;

const syncPromise = syncOptions ? sequelize.sync(syncOptions) : Promise.resolve();

syncPromise.then(async () => {
  console.log('Database synced');
  
  // Run production setup automatically if needed
  if (process.env.NODE_ENV === 'production') {
    await startupHandler.checkAndRunSetup();
  }
}).catch(error => {
  console.error('Database sync failed:', error);
});

module.exports = app;
