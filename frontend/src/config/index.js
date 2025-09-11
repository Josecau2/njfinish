// ESM-friendly fallback loader for customization config.
// Prefer a generated customization.js if it exists; otherwise fall back to template.
// Uses Vite's import.meta.globEager to avoid CommonJS require (which breaks in browser bundle).
// This executes at build time so both files can tree-shake appropriately.

let EMBEDDED_CUSTOMIZATION;
// Strategy: try to synchronously reference modules via static imports guarded in try blocks.
// Vite will error if we reference a missing static import directly, so we use a safe dynamic accessor.
// We avoid top-level await and glob APIs.
const dynamicImport = (path) => {
  try {
    // Use new Function to defer resolution until runtime; Vite will still bundle if file exists.
    // eslint-disable-next-line no-new-func
    return new Function(`return import('${path}')`)();
  } catch (_) { return null; }
};

// We will attempt customization.js then fallback; since dynamicImport returns a promise, we can't await here.
// Instead, we set a provisional minimal config; consumer components can overwrite on microtask flush.
EMBEDDED_CUSTOMIZATION = { logoText: 'App', lastUpdated: new Date().toISOString() };

Promise.resolve()
  .then(() => dynamicImport('./customization.js'))
  .catch(() => null)
  .then(mod => mod && mod.EMBEDDED_CUSTOMIZATION ? mod : dynamicImport('./customization.template.js'))
  .then(mod => {
    if (mod && mod.EMBEDDED_CUSTOMIZATION) {
      EMBEDDED_CUSTOMIZATION = mod.EMBEDDED_CUSTOMIZATION;
      // eslint-disable-next-line no-console
      console.log('[Customization] Loaded customization config');
    } else {
      // eslint-disable-next-line no-console
      console.warn('[Customization] Using minimal fallback configuration');
    }
  });

export { EMBEDDED_CUSTOMIZATION };
export default EMBEDDED_CUSTOMIZATION;
