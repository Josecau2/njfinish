const fs = require('fs');
const path = require('path');
const { stringifyForInlineScript } = require('../../utils/htmlSanitizer');

const BRAND_DIR = path.join(process.cwd(), 'public', 'brand');
const INLINE_PATH = path.join(BRAND_DIR, 'inline.html');
const JSON_PATH = path.join(BRAND_DIR, 'brand.json');
const CSS_PATH = path.join(BRAND_DIR, 'brand.css');
const LOGO_BASENAME = path.join(BRAND_DIR, 'logo');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function toBase64DataURI(buffer, mime) {
  if (!buffer || !buffer.length || !mime) return '';
  return `data:${mime};base64,${Buffer.from(buffer).toString('base64')}`;
}

function sanitizeSvgBuffer(buffer) {
  if (!buffer || !buffer.length) return null;
  const svgText = buffer.toString('utf8');
  const unsafePattern = /(\bon[a-z]+\s*=|<\s*script|javascript:|data:text\/html)/i;
  if (unsafePattern.test(svgText)) {
    return null;
  }
  return Buffer.from(svgText.replace(/\uFEFF/g, ''), 'utf8');
}

function normalizeColors(input = {}) {
  const fallback = {
    headerBg: '#0f172a',
    headerText: '#ffffff',
    sidebarBg: '#0f172a',
    sidebarText: '#ffffff',
    text: '#0f172a',
    accent: '#2563eb',
    surface: '#f8fafc',
  };

  return {
    headerBg: input.headerBg || input.headerBackground || fallback.headerBg,
    headerText: input.headerText || input.headerFontColor || fallback.headerText,
    sidebarBg: input.sidebarBg || fallback.sidebarBg,
    sidebarText: input.sidebarText || input.sidebarFontColor || fallback.sidebarText,
    text: input.text || input.bodyText || fallback.text,
    accent: input.accent || input.primary || fallback.accent,
    surface: input.surface || input.bodyBg || fallback.surface,
    logoBg: input.logoBg || fallback.headerBg,
  };
}

function buildCssVariables(colors) {
  return [
    `--brand-header-bg: ${colors.headerBg};`,
    `--brand-header-text: ${colors.headerText};`,
    `--brand-sidebar-bg: ${colors.sidebarBg};`,
    `--brand-sidebar-text: ${colors.sidebarText};`,
    `--brand-text: ${colors.text};`,
    `--brand-accent: ${colors.accent};`,
    `--brand-surface: ${colors.surface};`,
    `--brand-logo-bg: ${colors.logoBg};`,
  ].join('\n');
}

function safeAssign(target, source) {
  return Object.assign({}, target, source);
}

async function materializeBranding(brand = {}) {
  ensureDir(BRAND_DIR);

  const timestamp = Date.now();
  const colors = normalizeColors(brand.colors || {});
  const cssVars = buildCssVariables(colors);

  const snapshot = safeAssign({
    version: timestamp,
    colors,
    logoAlt: brand.logoAlt || '',
    login: brand.login || {},
    app: brand.app || {},
  }, {});

  let logoDataURI = '';
  let logoExt = 'png';
  if (brand.logo && brand.logo.buffer && brand.logo.mime) {
    let { buffer, mime } = brand.logo;
    if (mime === 'image/svg+xml') {
      buffer = sanitizeSvgBuffer(buffer);
      if (!buffer) {
        console.warn('[branding] Unsafe SVG rejected; omitting logo from snapshot');
        buffer = null;
        mime = null;
      }
    }

    if (buffer && mime) {
      logoDataURI = toBase64DataURI(buffer, mime);
      logoExt = mime === 'image/svg+xml' ? 'svg' : 'png';
      try {
        fs.writeFileSync(`${LOGO_BASENAME}.${logoExt}`, buffer);
      } catch (err) {
        console.warn('[branding] Failed to write logo asset:', err?.message || err);
      }
    }
  }

  snapshot.logo = {
    dataURI: logoDataURI,
    path: logoDataURI ? `/brand/logo.${logoExt}` : '',
    mime: brand.logo?.mime || '',
  };

  // Persist JSON snapshot
  try {
    fs.writeFileSync(JSON_PATH, JSON.stringify(snapshot, null, 2));
  } catch (err) {
    console.warn('[branding] Failed writing JSON snapshot:', err?.message || err);
  }

  // Persist CSS variables file
  try {
    fs.writeFileSync(CSS_PATH, `:root{\n${cssVars}\n}\n`);
  } catch (err) {
    console.warn('[branding] Failed writing CSS snapshot:', err?.message || err);
  }

  const inlineScript = {
    brand: snapshot,
    appCustomization: safeAssign({
      headerBg: colors.headerBg,
      headerFontColor: colors.headerText,
      sidebarBg: colors.sidebarBg,
      sidebarFontColor: colors.sidebarText,
      logoText: brand.app?.logoText || brand.logoAlt || '',
      logoImage: logoDataURI,
      logoBg: colors.logoBg,
      companyName: brand.app?.companyName || '',
    }, {}),
    loginCustomization: safeAssign({
      backgroundColor: brand.login?.backgroundColor || colors.surface,
      title: brand.login?.title || '',
      subtitle: brand.login?.subtitle || '',
      rightTitle: brand.login?.rightTitle || brand.login?.leftTitle || '',
      rightSubtitle: brand.login?.rightSubtitle || brand.login?.leftSubtitle || '',
      rightDescription: brand.login?.rightDescription || '',
      showForgotPassword: typeof brand.login?.showForgotPassword === 'boolean' ? brand.login.showForgotPassword : true,
      showKeepLoggedIn: typeof brand.login?.showKeepLoggedIn === 'boolean' ? brand.login.showKeepLoggedIn : true,
      logo: logoDataURI,
      logoHeight: brand.login?.logoHeight || 60,
      requestAccessTitle: brand.login?.requestAccessTitle || '',
      requestAccessSubtitle: brand.login?.requestAccessSubtitle || '',
      requestAccessDescription: brand.login?.requestAccessDescription || '',
      requestAccessBenefits: brand.login?.requestAccessBenefits || [],
      requestAccessSuccessMessage: brand.login?.requestAccessSuccessMessage || '',
    }, {}),
  };

  const brandPayload = {
    version: timestamp,
    logoAlt: snapshot.logoAlt,
    logoDataURI,
    colors,
    login: snapshot.login,
    app: snapshot.app,
  };
  const inlineHtml = `<!-- GENERATED: DO NOT EDIT -->\n<style nonce="__CSP_NONCE__">\n:root{\n${cssVars}\n}\n.brand-logo{\n  display:inline-flex;\n  align-items:center;\n  justify-content:center;\n  width:48px;\n  height:48px;\n  background-image:url("${logoDataURI}");\n  background-size:contain;\n  background-repeat:no-repeat;\n  background-position:center;\n}\n.brand-logo-img{\n  width:48px;\n  height:48px;\n  object-fit:contain;\n  display:block;\n}\n</style>\n<script nonce="__CSP_NONCE__">\nwindow.__BRAND__ = ${stringifyForInlineScript(brandPayload)};\nwindow.__APP_CUSTOMIZATION__ = ${stringifyForInlineScript(inlineScript.appCustomization)};\nwindow.__LOGIN_CUSTOMIZATION__ = ${stringifyForInlineScript(inlineScript.loginCustomization)};\n</script>`;


  try {
    fs.writeFileSync(INLINE_PATH, inlineHtml);
  } catch (err) {
    console.warn('[branding] Failed writing inline snippet:', err?.message || err);
  }

  return {
    inlinePath: INLINE_PATH,
    cssPath: CSS_PATH,
    jsonPath: JSON_PATH,
    version: timestamp,
    logoWritten: Boolean(logoDataURI),
  };
}

module.exports = { materializeBranding, BRAND_DIR, INLINE_PATH, JSON_PATH, CSS_PATH };
