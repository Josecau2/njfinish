// ESM-friendly fallback loader for customization config.
// Prefer a generated customization.js if it exists; otherwise fall back to template.
// Uses Vite's import.meta.globEager to avoid CommonJS require (which breaks in browser bundle).
// This executes at build time so both files can tree-shake appropriately.

// Glob both potential sources (only those that actually exist will be included)
const modules = import.meta.globEager('./customization{.js,.template.js}');

// Priority: real customization.js first, else template.
let EMBEDDED_CUSTOMIZATION;
if (modules['./customization.js']?.EMBEDDED_CUSTOMIZATION) {
  EMBEDDED_CUSTOMIZATION = modules['./customization.js'].EMBEDDED_CUSTOMIZATION;
  // eslint-disable-next-line no-console
  console.log('[Customization] Loaded generated customization.js');
} else if (modules['./customization.template.js']?.EMBEDDED_CUSTOMIZATION) {
  EMBEDDED_CUSTOMIZATION = modules['./customization.template.js'].EMBEDDED_CUSTOMIZATION;
  // eslint-disable-next-line no-console
  console.warn('[Customization] Using template customization (generated file missing).');
} else {
  // Final hard fallback
  EMBEDDED_CUSTOMIZATION = { logoText: 'App', lastUpdated: new Date().toISOString() };
  // eslint-disable-next-line no-console
  console.warn('[Customization] No customization sources found. Using minimal fallback.');
}

export { EMBEDDED_CUSTOMIZATION };
export default EMBEDDED_CUSTOMIZATION;
