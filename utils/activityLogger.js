const { ActivityLog } = require('../models');

// Lightweight logger helper; swallows errors to avoid breaking main flows
async function logActivity({ actorId, actorLabel, action, targetType, targetId, diff }) {
  try {
    const actor = actorId ? `user:${actorId}` : (actorLabel ? `external:${actorLabel}` : null);
    await ActivityLog.create({
      actor,
      action,
      target_type: targetType,
      target_id: targetId || null,
      diff: diff ? sanitize(diff) : null,
    });
  } catch (err) {
    console.error('ActivityLog error:', err.message);
  }
}

function sanitize(obj) {
  try {
    // Remove large fields/credentials
    const json = JSON.parse(JSON.stringify(obj));
    const redactKeys = ['password', 'token', 'resetToken', 'resetTokenExpiry'];
    function walk(o) {
      if (!o || typeof o !== 'object') return;
      for (const k of Object.keys(o)) {
        if (redactKeys.includes(k)) o[k] = '[REDACTED]';
        else walk(o[k]);
      }
    }
    walk(json);
    return json;
  } catch {
    return null;
  }
}

module.exports = { logActivity };
