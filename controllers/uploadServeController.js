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
    const relativePath = req.params[0] || '';
    const absolutePath = resolveSafePath(relativePath);

    if (!absolutePath) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    fs.stat(absolutePath, (err, stats) => {
      if (err) {
        if (err.code === 'ENOENT') {
          return res.status(404).json({ success: false, message: 'File not found' });
        }
        return next(err);
      }

      if (!stats.isFile()) {
        return res.status(404).json({ success: false, message: 'File not found' });
      }

      res.set('Cache-Control', 'private, max-age=300');
      res.sendFile(absolutePath, (sendErr) => {
        if (sendErr) {
          if (sendErr.code === 'ENOENT') {
            return res.status(404).json({ success: false, message: 'File not found' });
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
