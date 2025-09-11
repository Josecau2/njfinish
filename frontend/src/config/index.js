// Fallback loader for customization config (Vite-friendly ESM exports)
// Attempts to load generated customization.js (git-ignored historically) and falls back to template.
/* eslint-disable */
let EMBEDDED_CUSTOMIZATION;
try {
  EMBEDDED_CUSTOMIZATION = require('./customization.js').EMBEDDED_CUSTOMIZATION;
  console.log('[Customization] Loaded generated customization.js');
} catch (e) {
  EMBEDDED_CUSTOMIZATION = require('./customization.template.js').EMBEDDED_CUSTOMIZATION;
  console.warn('[Customization] Using template customization (generated file missing).');
}
export { EMBEDDED_CUSTOMIZATION };
export default EMBEDDED_CUSTOMIZATION;
