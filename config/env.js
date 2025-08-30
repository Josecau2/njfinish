require('dotenv').config();

// Helper: parse comma-separated values into array
function parseList(value, fallback = []) {
  if (!value || typeof value !== 'string') return fallback;
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const defaults = {
  PORT: 8080,
  UPLOAD_PATH: './uploads',
  RESOURCES_UPLOAD_DIR: './uploads/resources',
  CORS_ALLOWED_ORIGINS: [
    'https://app.njcontractors.com',
    'https://app.nj.contractors',
    'http://app.nj.contractors',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8080',
    'http://localhost:5173',
  ],
  PUBLIC_PROPOSAL_TOKEN_TTL_MIN: 60 * 24, // 24 hours
  NOTIFICATIONS_POLL_INTERVAL_MS: 15000,
};

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || defaults.PORT,
  // DB sync control (safety-first)
  // Modes: 'none' (no sync), 'create' (create missing), 'alter' (non-destructive alter)
  DB_SYNC_MODE: (process.env.DB_SYNC_MODE || '').toLowerCase() || ((process.env.NODE_ENV === 'production') ? 'none' : 'create'),
  // Allow models to call sync({alter:true}) at runtime (controllers). Default false.
  DB_RUNTIME_ALTER: String(process.env.DB_RUNTIME_ALTER || '').toLowerCase() === 'true',
  // Run a DB backup before migrations in production by default
  DB_BACKUP_ON_MIGRATE: String(process.env.DB_BACKUP_ON_MIGRATE || ((process.env.NODE_ENV === 'production') ? 'true' : 'false')).toLowerCase() === 'true',

  // Storage directories
  UPLOAD_PATH: process.env.UPLOAD_PATH || defaults.UPLOAD_PATH,
  RESOURCES_UPLOAD_DIR: process.env.RESOURCES_UPLOAD_DIR || defaults.RESOURCES_UPLOAD_DIR,

  // CORS
  CORS_ALLOWED_ORIGINS: parseList(process.env.CORS_ALLOWED_ORIGINS, defaults.CORS_ALLOWED_ORIGINS),

  // Proposal external token TTL (in minutes)
  PUBLIC_PROPOSAL_TOKEN_TTL_MIN: Number(process.env.PUBLIC_PROPOSAL_TOKEN_TTL_MIN) || defaults.PUBLIC_PROPOSAL_TOKEN_TTL_MIN,

  // Notifications poll interval (frontend default if sockets not used)
  NOTIFICATIONS_POLL_INTERVAL_MS: Number(process.env.NOTIFICATIONS_POLL_INTERVAL_MS) || defaults.NOTIFICATIONS_POLL_INTERVAL_MS,
};

module.exports = env;
