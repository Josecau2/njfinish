// Simple validators and sanitizers for incoming requests

function validateIdParam(paramName = 'id') {
  return function (req, res, next) {
    const raw = req.params[paramName];
    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: `Invalid ${paramName}` });
    }
    next();
  };
}

// Trim string fields and enforce a max length to reduce abuse
function sanitizeBodyStrings(maxLen = 1000) {
  return function (req, res, next) {
    if (req.body && typeof req.body === 'object') {
      for (const [k, v] of Object.entries(req.body)) {
        if (typeof v === 'string') {
          let val = v.trim();
          if (maxLen && val.length > maxLen) {
            val = val.slice(0, maxLen);
          }
          req.body[k] = val;
        }
      }
    }
    next();
  };
}

module.exports = { validateIdParam, sanitizeBodyStrings };
