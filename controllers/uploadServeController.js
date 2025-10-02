const fs = require('fs');
const path = require('path');
const env = require('../config/env');

const UPLOAD_ROOT = path.resolve(__dirname, '..', env.UPLOAD_PATH || 'uploads');

function resolveSafePath(requestPath) {
  const normalized = path.normalize(requestPath || '').replace(/^\/+/, '');
  if (!normalized || normalized === '..') {
    return null;
  }
  const absolute = path.resolve(UPLOAD_ROOT, normalized);
  if (!absolute.startsWith(UPLOAD_ROOT)) {
    return null;
  }
  return absolute;
}

function serveUpload(req, res, next) {
  try {
    // Derive relative path from router mount point and request path
    // req.baseUrl is '/uploads', req.path starts with '/...'
    let relativePath = (req.path || '').replace(/^\//, '');
    const absolutePath = resolveSafePath(relativePath);

    if (!absolutePath) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    fs.stat(absolutePath, (err, stats) => {
      if (err) {
        if (err.code === 'ENOENT') {
          // Return a minimal 404 with text/plain to avoid CORB blocking JSON
          res.type('text/plain');
          return res.status(404).send('Not found');
        }
        return next(err);
      }

      if (!stats.isFile()) {
        res.type('text/plain');
        return res.status(404).send('Not found');
      }

      // Best-effort content type to satisfy CORB sniffing rules
      const ext = path.extname(absolutePath).toLowerCase();
      const ctype = (
        ext === '.png' ? 'image/png' :
        ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
        ext === '.svg' ? 'image/svg+xml' :
        ext === '.webp' ? 'image/webp' :
        ext === '.gif' ? 'image/gif' : 'application/octet-stream'
      );
      res.set('Content-Type', ctype);
      res.set('Cache-Control', 'public, max-age=300, immutable');
      res.sendFile(absolutePath, (sendErr) => {
        if (sendErr) {
          if (sendErr.code === 'ENOENT') {
            res.type('text/plain');
            return res.status(404).send('Not found');
          }
          return next(sendErr);
        }
        return undefined;
      });
      return undefined;
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  serveUpload,
};
