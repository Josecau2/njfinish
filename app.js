const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');
const sequelize = require('./config/db');
const path = require('path');

const app = express();

const allowedOrigins = [
  'https://app.njcontractors.com',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost:5173'
];

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
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/uploads/manufacturer_catalogs', express.static(path.join(__dirname, 'uploads/manufacturer_catalogs')));

const buildPath = path.join(__dirname, 'frontend', 'build');
app.use(express.static(buildPath));

// Fallback route to serve index.html for non-API requests (React Router)
app.get('/', (req, res) => {
  res.sendFile(path.resolve(buildPath, 'index.html'));
});

app.get(/^(?!\/api).*$/, (req, res) => {
  res.sendFile(path.resolve(buildPath, 'index.html'));
});

app.use((req, res, next) => {
  console.log(`Request method: ${req.method}, URL: ${req.url}`);
  next();
});


sequelize.sync().then(() => {
  console.log('Database synced');
});

module.exports = app;
