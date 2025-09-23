const fs = require('fs');
const path = require('path');
const { compileCustomization } = require('../services/loginCustomizationCache');

const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const CONFIG_PATH = path.join(FRONTEND_DIR, 'src', 'config', 'loginCustomization.js');
const ASSETS_DIR = path.join(FRONTEND_DIR, 'public', 'assets', 'customization');
const RAW_JSON_PATH = path.join(ASSETS_DIR, 'login-customization.json');

const SENSITIVE_KEYS = ['smtpHost', 'smtpPort', 'smtpSecure', 'smtpUser', 'smtpPass', 'emailFrom'];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function maybePersistLogo(rawLogo) {
  if (!rawLogo) return '';
  if (rawLogo.startsWith('/assets/')) return rawLogo;
  if (!rawLogo.startsWith('data:')) return rawLogo;
  const match = rawLogo.match(/^data:(image\/(png|jpeg|jpg|svg\+xml));base64,(.+)$/);
  if (!match) return '';
  const extMap = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/svg+xml': '.svg'
  };
  const mime = match[1];
  const ext = extMap[mime] || '.png';
  const buffer = Buffer.from(match[3], 'base64');
  ensureDir(ASSETS_DIR);
  const fileName = `login-logo${ext}`;
  const target = path.join(ASSETS_DIR, fileName);
  try {
    fs.writeFileSync(target, buffer);
    return `/assets/customization/${fileName}`;
  } catch (err) {
    console.error('Failed writing login logo:', err);
    return '';
  }
}

function buildConfig(input = {}) {
  const merged = compileCustomization(input);
  merged.logo = maybePersistLogo(input.logo || merged.logo);
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

module.exports = { writeFrontendLoginCustomization };
