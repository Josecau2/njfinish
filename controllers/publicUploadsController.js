const fs = require('fs');
const path = require('path');
const env = require('../config/env');

// Root uploads directory (same as secure one)
const UPLOAD_ROOT = path.resolve(__dirname, '..', env.UPLOAD_PATH || 'uploads');

// Whitelist of allowed relative directory prefixes that are safe for unauthenticated access.
// Adjust as needed – purposely narrow to branding / catalog imagery used in PDFs.
const ALLOWED_PREFIXES = [
  '/uploads/branding/',
  '/uploads/manufacturer_catalogs/',
  '/uploads/images/',
];

// Allowed file extensions for public serving
const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);

function isAllowedPath(requestPath) {
  if (!requestPath) return false;
  const lower = requestPath.toLowerCase();
  return ALLOWED_PREFIXES.some((p) => lower.startsWith(p));
}

function resolveSafePath(requestPath) {
  const normalized = path.normalize(requestPath || '').replace(/^\\+/, '/').replace(/^\/+/, '/');
  if (!normalized) return null;
  if (!isAllowedPath(normalized)) return null;
  const relative = normalized.replace(/^\//, '');
  const absolute = path.resolve(UPLOAD_ROOT, relative.replace(/^uploads[\/]/, ''));
  if (!absolute.startsWith(UPLOAD_ROOT)) return null;
  return absolute;
}

function contentTypeFor(ext) {
  switch (ext) {
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.gif': return 'image/gif';
    case '.webp': return 'image/webp';
    case '.svg': return 'image/svg+xml';
    default: return 'application/octet-stream';
  }
}

function servePublicUpload(req, res, next) {
  try {
    const originalPath = `${req.baseUrl}${req.path}`; // e.g. /public-uploads/uploads/branding/logo.png
    // We want the portion beginning with /uploads/...
    const uploadsIndex = originalPath.indexOf('/uploads/');
    if (uploadsIndex === -1) {
      res.type('text/plain');
      return res.status(404).send('Not found');
    }
    const requestPath = originalPath.substring(uploadsIndex); // /uploads/branding/logo.png
    const ext = path.extname(requestPath).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      res.type('text/plain');
      return res.status(415).send('Unsupported media type');
    }

    const absolute = resolveSafePath(requestPath);
    if (!absolute) {
      res.type('text/plain');
      return res.status(404).send('Not found');
    }

    fs.stat(absolute, (err, stats) => {
      if (err || !stats.isFile()) {
        res.type('text/plain');
        return res.status(404).send('Not found');
      }
      res.setHeader('Content-Type', contentTypeFor(ext));
      // Public caching; adjust max-age as desired
      res.setHeader('Cache-Control', 'public, max-age=3600');
      fs.createReadStream(absolute)
        .on('error', () => {
          res.type('text/plain');
          res.status(500).send('Read error');
        })
        .pipe(res);
    });
  } catch (e) {
    next(e);
  }
}

module.exports = { servePublicUpload };
