// Fallback loader for customization config.
// Tries generated customization.js (ignored in VCS) then falls back to template.
let EMBEDDED_CUSTOMIZATION;
try {
  // eslint-disable-next-line import/no-unresolved, global-require
  EMBEDDED_CUSTOMIZATION = require('./customization.js').EMBEDDED_CUSTOMIZATION;
  // eslint-disable-next-line no-console
  console.log('[Customization] Loaded generated customization.js');
} catch (e) {
  // eslint-disable-next-line import/no-unresolved, global-require
  EMBEDDED_CUSTOMIZATION = require('./customization.template.js').EMBEDDED_CUSTOMIZATION;
  // eslint-disable-next-line no-console
  console.warn('[Customization] Using template customization (generated file missing).');
}

module.exports = { EMBEDDED_CUSTOMIZATION };
