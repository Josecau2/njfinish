const path = require('path');
const fs = require('fs');
const { materializeBranding } = require('./materializeBranding');
const env = require('../../config/env');
const Customization = require('../../models/Customization');
const LoginCustomization = require('../../models/LoginCustomization');

const uploadEnvPath = env.UPLOAD_PATH || './uploads';
const UPLOAD_ROOT = path.isAbsolute(uploadEnvPath)
  ? uploadEnvPath
  : path.resolve(process.cwd(), uploadEnvPath);

function inferMimeFromPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.svg':
      return 'image/svg+xml';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    default:
      return 'image/png';
  }
}

function normalizeBenefits(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter(Boolean).map((item) => String(item));
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean).map((item) => String(item));
      }
    } catch (_) {
      // Not JSON, fall through to newline split
    }
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }
  return [];
}

function resolveUploadPath(relativePath) {
  if (!relativePath) return null;
  if (path.isAbsolute(relativePath)) {
    return relativePath;
  }
  return path.resolve(UPLOAD_ROOT, relativePath);
}

async function readLogoAsset(logoField) {
  if (!logoField) return null;

  if (Buffer.isBuffer(logoField)) {
    return { buffer: logoField, mime: 'image/png' };
  }

  if (typeof logoField === 'object' && logoField.buffer && logoField.mime) {
    return { buffer: logoField.buffer, mime: logoField.mime };
  }

  if (typeof logoField === 'string') {
    if (logoField.startsWith('data:')) {
      const match = logoField.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!match) return null;
      const mime = match[1];
      try {
        const buffer = Buffer.from(match[2], 'base64');
        return { buffer, mime };
      } catch (err) {
        console.warn('[branding] Invalid data URI logo:', err?.message || err);
        return null;
      }
    }

    const trimmed = logoField.replace(/^\//, '');
    const absolute = logoField.startsWith('/uploads/')
      ? path.resolve(process.cwd(), trimmed)
      : resolveUploadPath(trimmed);

    if (!absolute || !fs.existsSync(absolute)) {
      return null;
    }
    try {
      const buffer = fs.readFileSync(absolute);
      const mime = inferMimeFromPath(absolute);
      return { buffer, mime };
    } catch (err) {
      console.warn('[branding] Failed reading logo asset:', err?.message || err);
      return null;
    }
  }
  return null;
}

async function regenerateBrandSnapshot() {
  const [customization, loginCustomization] = await Promise.all([
    Customization.findOne({ order: [['updatedAt', 'DESC']] }),
    LoginCustomization.findOne({ where: { id: 1 } }),
  ]);

  const customizationData = customization ? customization.toJSON() : {};
  const loginData = loginCustomization ? loginCustomization.toJSON() : {};

  const colors = {
    headerBg: customizationData.headerBg,
    headerText: customizationData.headerFontColor,
    sidebarBg: customizationData.sidebarBg,
    sidebarText: customizationData.sidebarFontColor,
    text: customizationData.bodyText,
    accent: customizationData.primaryColor,
    logoBg: customizationData.logoBg,
  };

  let logo = null;
  if (customizationData.logoImage) {
    logo = await readLogoAsset(customizationData.logoImage);
  }
  if (!logo && loginData.logo) {
    logo = await readLogoAsset(loginData.logo);
  }

  const brand = {
    logoAlt: customizationData.logoText || customizationData.companyName || 'NJ Cabinets',
    logo,
    colors,
    app: {
      logoText: customizationData.logoText || '',
      logoImage: customizationData.logoImage || '',
      logoBg: customizationData.logoBg || '',
      companyName: customizationData.companyName || '',
    },
    login: {
      title: loginData.title || '',
      subtitle: loginData.subtitle || '',
      backgroundColor: loginData.backgroundColor || '',
      leftTitle: loginData.rightTitle || '',
      leftSubtitle: loginData.rightSubtitle || '',
      rightTitle: loginData.rightTitle || '',
      rightSubtitle: loginData.rightSubtitle || '',
      rightDescription: loginData.rightDescription || loginData.rightTagline || '',
      logoHeight: Number(loginData.logoHeight) || 60,
      requestAccessTitle: loginData.requestAccessTitle || '',
      requestAccessSubtitle: loginData.requestAccessSubtitle || '',
      requestAccessDescription: loginData.requestAccessDescription || '',
      requestAccessBenefits: normalizeBenefits(loginData.requestAccessBenefits),
      requestAccessSuccessMessage: loginData.requestAccessSuccessMessage || '',
    },
  };

  return materializeBranding(brand);
}

module.exports = { regenerateBrandSnapshot };
