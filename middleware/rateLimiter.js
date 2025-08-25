// Minimal in-memory rate limiter (per key) for simple abuse protection
// Not for multi-instance production without a shared store.

const buckets = new Map();

function createRateLimiter({ windowMs = 60_000, max = 5, keyGenerator }) {
  return function rateLimiter(req, res, next) {
    try {
      const now = Date.now();
      const key = (typeof keyGenerator === 'function')
        ? keyGenerator(req)
        : req.ip;

      const entry = buckets.get(key) || { count: 0, start: now };
      // Reset window
      if (now - entry.start > windowMs) {
        entry.count = 0;
        entry.start = now;
      }
      entry.count += 1;
      buckets.set(key, entry);

      if (entry.count > max) {
        return res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
      }
      next();
    } catch (err) {
      // Fail-open on limiter error
      next();
    }
  };
}

// Specific limiter for proposal acceptance endpoint
const rateLimitAccept = createRateLimiter({
  windowMs: 60_000, // 1 minute
  max: 5,
  keyGenerator: (req) => {
    const userId = req.user && req.user.id ? `user:${req.user.id}` : null;
    return userId || `ip:${req.ip}`;
  },
});

module.exports = { createRateLimiter, rateLimitAccept };
