const fs = require('fs');
const path = require('path');
const { compileCustomization } = require('../services/loginCustomizationCache');

const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const CONFIG_PATH = path.join(FRONTEND_DIR, 'src', 'config', 'loginCustomization.js');
const PUBLIC_DIR = path.join(FRONTEND_DIR, 'public');
const ASSETS_DIR = path.join(PUBLIC_DIR, 'assets', 'customization');
const RAW_JSON_PATH = path.join(ASSETS_DIR, 'login-customization.json');
const DEFAULT_UPLOAD_LOGO_PATH = path.join(__dirname, '..', 'uploads', 'branding', 'login-logo.png');

const SENSITIVE_KEYS = ['smtpHost', 'smtpPort', 'smtpSecure', 'smtpUser', 'smtpPass', 'emailFrom'];

const EXT_MIME_MAP = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.svgz': 'image/svg+xml',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

let defaultAppLogo = '';
let defaultAppLogoDataUri = '';
try {
  const { CUSTOMIZATION_CONFIG } = require('../frontend/src/config/customization');
  defaultAppLogo = CUSTOMIZATION_CONFIG?.logoImage || '';
  defaultAppLogoDataUri = CUSTOMIZATION_CONFIG?.logoDataURI || '';
} catch (err) {
  defaultAppLogo = '';
  defaultAppLogoDataUri = '';
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function resolvePublicAsset(assetPath) {
  if (typeof assetPath !== 'string' || !assetPath.startsWith('/')) {
    return null;
  }
  const safePath = assetPath.replace(/^\//, '').replace(/\.\./g, '');
  return path.join(PUBLIC_DIR, safePath);
}

function buildDataUriFromFile(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) return '';
    const ext = path.extname(filePath).toLowerCase();
    const mime = EXT_MIME_MAP[ext] || 'application/octet-stream';
    const buffer = fs.readFileSync(filePath);
    return `data:${mime};base64,${buffer.toString('base64')}`;
  } catch (err) {
    console.warn('Failed to read login logo for data URI:', err?.message || err);
    return '';
  }
}

function useDefaultLogo() {
  if (!defaultAppLogo) {
    return { path: '', dataUri: defaultAppLogoDataUri || '' };
  }
  if (defaultAppLogo.startsWith('data:')) {
    return { path: '', dataUri: defaultAppLogo };
  }
  const resolved = resolvePublicAsset(defaultAppLogo);
  return {
    path: defaultAppLogo,
    dataUri: resolved ? buildDataUriFromFile(resolved) : defaultAppLogoDataUri,
  };
}

function persistUploadsLogo(uploadRelativePath) {
  const uploadSource = path.join(__dirname, '..', uploadRelativePath.replace(/^\//, ''));
  const ext = path.extname(uploadSource) || '.png';
  ensureDir(ASSETS_DIR);
  const target = path.join(ASSETS_DIR, `login-logo${ext}`);
  try {
    if (!fs.existsSync(uploadSource)) {
      console.warn('Login logo source not found:', uploadSource);
      return useDefaultLogo();
    }
    fs.copyFileSync(uploadSource, target);
    return {
      path: `/assets/customization/login-logo${ext}`,
      dataUri: buildDataUriFromFile(target),
    };
  } catch (err) {
    console.warn('Could not copy login logo from uploads:', err?.message);
    return useDefaultLogo();
  }
}

function persistDataUri(rawLogo) {
  const match = rawLogo.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) {
    console.warn('Invalid data URI provided for login logo.');
    return { path: '', dataUri: '' };
  }
  const mime = match[1];
  const ext =
    Object.keys(EXT_MIME_MAP).find((key) => EXT_MIME_MAP[key] === mime) ||
    (mime === 'image/svg+xml' ? '.svg' : '.png');
  const buffer = Buffer.from(match[2], 'base64');
  ensureDir(ASSETS_DIR);
  const fileName = `login-logo${ext}`;
  const target = path.join(ASSETS_DIR, fileName);
  try {
    fs.writeFileSync(target, buffer);
    return { path: `/assets/customization/${fileName}`, dataUri: rawLogo };
  } catch (err) {
    console.error('Failed writing login logo from data URI:', err);
    return { path: '', dataUri: '' };
  }
}

function maybePersistLogo(rawLogo) {
  if (!rawLogo) {
    return useDefaultLogo();
  }

  if (typeof rawLogo === 'string' && rawLogo.startsWith('data:')) {
    return persistDataUri(rawLogo);
  }

  if (typeof rawLogo === 'string' && rawLogo.startsWith('/uploads/')) {
    return persistUploadsLogo(rawLogo);
  }

  if (typeof rawLogo === 'string' && rawLogo.startsWith('/assets/')) {
    const resolved = resolvePublicAsset(rawLogo);
    return {
      path: rawLogo,
      dataUri: resolved ? buildDataUriFromFile(resolved) : '',
    };
  }

  if (typeof rawLogo === 'string' && /^https?:\/\//i.test(rawLogo)) {
    console.warn('External URLs are not embedded for login logos for security reasons.');
    return useDefaultLogo();
  }

  return useDefaultLogo();
}

function buildConfig(input = {}) {
  const merged = compileCustomization(input);
  const logoSource = input.logo || merged.logo || defaultAppLogo;
  const { path: processedPath, dataUri } = maybePersistLogo(logoSource);
  merged.logo = processedPath || defaultAppLogo || logoSource || '';
  if (dataUri) {
    merged.logoDataURI = dataUri;
  } else if (defaultAppLogo && defaultAppLogo.startsWith('data:')) {
    merged.logoDataURI = defaultAppLogo;
  } else if (processedPath) {
    const resolved = resolvePublicAsset(processedPath);
    const computed = buildDataUriFromFile(resolved);
    if (computed) merged.logoDataURI = computed;
  }
  return { ...merged, _generated: new Date().toISOString(), _version: '1.0.0' };
}

function sanitizeForStaticConfig(config) {
  const copy = { ...config };
  for (const key of SENSITIVE_KEYS) {
    if (key in copy) {
      delete copy[key];
    }
  }
  return copy;
}

function fileContents(cfg) {
  return `// Login page customization (generated)
// DO NOT EDIT MANUALLY

export const LOGIN_CUSTOMIZATION = ${JSON.stringify(cfg, null, 2)}

export default LOGIN_CUSTOMIZATION
`;
}

async function writeFrontendLoginCustomization(input) {
  const cfg = buildConfig(input);
  const staticCfg = sanitizeForStaticConfig(cfg);
  ensureDir(path.dirname(CONFIG_PATH));
  fs.writeFileSync(CONFIG_PATH, fileContents(staticCfg), 'utf8');
  try {
    ensureDir(ASSETS_DIR);
    fs.writeFileSync(RAW_JSON_PATH, JSON.stringify(staticCfg, null, 2), 'utf8');
  } catch (err) {
    console.warn('Could not write raw login customization JSON:', err?.message);
  }
  return cfg;
}

module.exports = { writeFrontendLoginCustomization, _getDefaultAppLogo: () => defaultAppLogo };
