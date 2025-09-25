const DEFAULT_BRAND = {
  version: 0,
  logoAlt: '',
  logoDataURI: '',
  colors: {},
  login: {},
  app: {},
};

// Build a BRAND-compatible object from legacy runtime JSON the dev server already loads.
// This ensures the Vite dev server (port 3000) renders the same customization as production
// even when server-side brand injection isn't present.
function buildBrandFromLegacy() {
  try {
    if (typeof window === 'undefined') return null;
    const appCfg = window.__APP_CUSTOMIZATION__ || {};
    const loginCfg = window.__LOGIN_CUSTOMIZATION__ || {};

    // If neither exists, nothing to synthesize
    if (!appCfg && !loginCfg) return null;

    // Map app colors to the brand color keys used by components
    const colors = {
      headerBg: appCfg.headerBg || '#0f172a',
      headerText: appCfg.headerFontColor || '#ffffff',
      sidebarBg: appCfg.sidebarBg || '#0f0f0f',
      sidebarText: appCfg.sidebarFontColor || '#ffffff',
      // Reasonable fallbacks to avoid undefined access
      text: '#0f172a',
      accent: '#2563eb',
      surface: '#f8fafc',
      logoBg: appCfg.logoBg || '#000000',
    };

    // Prefer login logo; fall back to app logo image
    let logoDataURI = '';
    if (typeof loginCfg.logo === 'string' && loginCfg.logo) {
      logoDataURI = loginCfg.logo; // can be /assets/... or data: URI
    } else if (typeof appCfg.logoImage === 'string' && appCfg.logoImage) {
      logoDataURI = appCfg.logoImage;
    }

    const brand = {
      version: Date.now(),
      logoAlt: appCfg.logoText || 'Logo',
      logoDataURI,
      colors,
      // Pass through the login object as-is (already normalized by writer)
      login: { ...(loginCfg || {}) },
      app: {
        logoText: appCfg.logoText,
        logoImage: appCfg.logoImage,
        logoBg: appCfg.logoBg,
        companyName: appCfg.companyName,
      },
    };

    return brand;
  } catch (_) {
    return null;
  }
}

export function getBrand() {
  // Primary: server-injected brand
  if (typeof window !== 'undefined' && window.__BRAND__) {
    return window.__BRAND__;
  }

  // Dev fallback: synthesize from legacy customization JSON loaded in index.html
  const synthesized = buildBrandFromLegacy();
  if (synthesized) return synthesized;

  return DEFAULT_BRAND;
}

export function useBrand() {
  return getBrand();
}

export function getBrandColors() {
  const brand = getBrand();
  const colors = brand.colors && Object.keys(brand.colors).length ? brand.colors : null;
  if (colors) return colors;
  // Dev fallback from legacy app customization
  try {
    if (typeof window !== 'undefined') {
      const appCfg = window.__APP_CUSTOMIZATION__ || {};
      return {
        headerBg: appCfg.headerBg || '#0f172a',
        headerText: appCfg.headerFontColor || '#ffffff',
        sidebarBg: appCfg.sidebarBg || '#0f0f0f',
        sidebarText: appCfg.sidebarFontColor || '#ffffff',
        text: '#0f172a',
        accent: '#2563eb',
        surface: '#f8fafc',
        logoBg: appCfg.logoBg || '#000000',
      };
    }
  } catch {}
  return {};
}

export function getLoginBrand() {
  const brand = getBrand();
  if (brand.login && Object.keys(brand.login).length) return brand.login;
  // Dev fallback: use legacy login customization JSON
  try {
    if (typeof window !== 'undefined' && window.__LOGIN_CUSTOMIZATION__) {
      return window.__LOGIN_CUSTOMIZATION__;
    }
  } catch {}
  return {};
}
