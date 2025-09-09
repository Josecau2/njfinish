require('dotenv').config();

// Temporary global console suppression while deploying.
// Set KEEP_LOGS=true to re-enable standard logging without code changes.
if (process.env.KEEP_LOGS !== 'true') {
  const noop = () => {};
  // Preserve errors and warnings, silence noisy info/debug logs.
  console.log = noop;
  console.info = noop;
  console.debug = noop;
  // Optionally silence warns too – comment out if you want warnings.
  console.warn = noop;
}

const app = require('./app');
const http = require('http');

// (If needed later) HTTP → HTTPS redirect logic placeholder left intentionally minimal.
const httpServer = http.createServer(() => {});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  if (process.env.KEEP_LOGS === 'true') {
    console.log(`Server running on port ${PORT}`);
  }
});
