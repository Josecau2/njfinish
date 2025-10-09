const fs = require('fs')
const path = require('path')

const FRONTEND_DIR = path.join(__dirname, '..', 'frontend')
const CONFIG_PATH = path.join(FRONTEND_DIR, 'src', 'config', 'customization.js')
const PUBLIC_DIR = path.join(FRONTEND_DIR, 'public')
const ASSETS_DIR = path.join(PUBLIC_DIR, 'assets', 'customization')
const RAW_JSON_PATH = path.join(ASSETS_DIR, 'app-customization.json')
const DEFAULT_UPLOAD_LOGO_PATH = path.join(__dirname, '..', 'uploads', 'branding', 'login-logo.png')

const EXT_MIME_MAP = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.svgz': 'image/svg+xml',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
}

let FALLBACK_LOGO_PATH = '/assets/customization/login-logo.png'
let FALLBACK_LOGO_DATA_URI = ''

function ensureDefaultLogoAsset() {
  try {
    if (fs.existsSync(DEFAULT_UPLOAD_LOGO_PATH)) {
      ensureDir(ASSETS_DIR)
      const target = path.join(ASSETS_DIR, 'login-logo.png')
      fs.copyFileSync(DEFAULT_UPLOAD_LOGO_PATH, target)
      FALLBACK_LOGO_PATH = '/assets/customization/login-logo.png'
      FALLBACK_LOGO_DATA_URI = buildDataUriFromFile(target)
      return
    }
  } catch (error) {
    console.warn('Unable to copy default app logo:', error?.message || error)
  }

  const fallbackResolved = resolvePublicAsset(FALLBACK_LOGO_PATH)
  FALLBACK_LOGO_DATA_URI = fallbackResolved ? buildDataUriFromFile(fallbackResolved) : ''
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function resolvePublicAsset(assetPath) {
  if (typeof assetPath !== 'string' || !assetPath.startsWith('/')) {
    return null
  }
  const safePath = assetPath.replace(/^\//, '').replace(/\.\./g, '')
  return path.join(PUBLIC_DIR, safePath)
}

function buildDataUriFromFile(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) return ''
    const ext = path.extname(filePath).toLowerCase()
    const mime = EXT_MIME_MAP[ext] || 'application/octet-stream'
    const buffer = fs.readFileSync(filePath)
    return `data:${mime};base64,${buffer.toString('base64')}`
  } catch (err) {
    console.warn('Failed to build data URI for logo:', err?.message || err)
    return ''
  }
}

function persistDataUri(rawLogo) {
  const match = rawLogo.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/)
  if (!match) {
    console.warn('Invalid data URI provided for app logo.')
    return { path: '', dataUri: '' }
  }
  const mime = match[1]
  const ext =
    Object.keys(EXT_MIME_MAP).find((key) => EXT_MIME_MAP[key] === mime) ||
    (mime === 'image/svg+xml' ? '.svg' : '.png')
  const buffer = Buffer.from(match[2], 'base64')
  ensureDir(ASSETS_DIR)
  const fileName = `logo${ext}`
  const target = path.join(ASSETS_DIR, fileName)
  try {
    fs.writeFileSync(target, buffer)
    return { path: `/assets/customization/${fileName}`, dataUri: rawLogo }
  } catch (err) {
    console.error('Failed writing app logo from data URI:', err?.message || err)
    return { path: '', dataUri: '' }
  }
}

ensureDefaultLogoAsset()

const FALLBACK = {
  logoText: 'Cabinets',
  logoImage: FALLBACK_LOGO_PATH,
  headerBg: '#000000',
  headerFontColor: '#ffffff',
  sidebarBg: '#0f0f0f',
  sidebarFontColor: '#ffffff',
  logoBg: '#000000',
  companyName: '',
  logoDataURI: FALLBACK_LOGO_DATA_URI,
}

function persistUploadsLogo(uploadRelativePath) {
  const uploadSource = path.join(__dirname, '..', uploadRelativePath.replace(/^\//, ''))
  const ext = path.extname(uploadSource) || '.png'
  ensureDir(ASSETS_DIR)
  const target = path.join(ASSETS_DIR, `logo${ext}`)
  try {
    if (!fs.existsSync(uploadSource)) {
      console.warn('App logo source not found:', uploadSource)
      return null
    }
    fs.copyFileSync(uploadSource, target)
    return {
      path: `/assets/customization/logo${ext}`,
      dataUri: buildDataUriFromFile(target),
    }
  } catch (err) {
    console.warn('Could not copy app logo from uploads:', err?.message || err)
    return null
  }
}

function resolveLogo(rawLogo) {
  if (!rawLogo) {
    const fallbackResolved = resolvePublicAsset(FALLBACK_LOGO_PATH)
    return {
      path: FALLBACK_LOGO_PATH,
      dataUri: fallbackResolved ? buildDataUriFromFile(fallbackResolved) : FALLBACK_LOGO_DATA_URI,
    }
  }

  if (typeof rawLogo === 'string' && rawLogo.startsWith('data:')) {
    return persistDataUri(rawLogo)
  }

  if (typeof rawLogo === 'string' && rawLogo.startsWith('/uploads/')) {
    const persisted = persistUploadsLogo(rawLogo)
    if (persisted) return persisted
  }

  if (typeof rawLogo === 'string' && rawLogo.startsWith('/assets/')) {
    const resolved = resolvePublicAsset(rawLogo)
    return {
      path: rawLogo,
      dataUri: buildDataUriFromFile(resolved),
    }
  }

  if (typeof rawLogo === 'string' && /^https?:\/\//i.test(rawLogo)) {
    console.warn('External URLs are not embedded for app logos for security reasons.')
    const fallbackResolved = resolvePublicAsset(FALLBACK_LOGO_PATH)
    return {
      path: FALLBACK_LOGO_PATH,
      dataUri: fallbackResolved ? buildDataUriFromFile(fallbackResolved) : FALLBACK_LOGO_DATA_URI,
    }
  }

  // Unknown format - fall back
  const fallbackResolved = resolvePublicAsset(FALLBACK_LOGO_PATH)
  return {
    path: FALLBACK_LOGO_PATH,
    dataUri: fallbackResolved ? buildDataUriFromFile(fallbackResolved) : FALLBACK_LOGO_DATA_URI,
  }
}

function buildConfigObject(input = {}) {
  const merged = { ...FALLBACK, ...input }
  const { path: logoPath, dataUri } = resolveLogo(input.logoImage || merged.logoImage)
  merged.logoImage = logoPath || FALLBACK.logoImage
  if (dataUri) {
    merged.logoDataURI = dataUri
  } else if (merged.logoDataURI && typeof merged.logoDataURI !== 'string') {
    delete merged.logoDataURI
  }
  return {
    ...merged,
    _generated: new Date().toISOString(),
    _version: '1.0.0',
  }
}

function generateFileContents(configObj) {
  return `// Frontend customization configuration
// This file is automatically generated when customizations are saved
// DO NOT edit manually - changes will be overwritten

export const CUSTOMIZATION_CONFIG = ${JSON.stringify(configObj, null, 2)}

export default CUSTOMIZATION_CONFIG
`
}

async function writeFrontendCustomization(input) {
  const cfg = buildConfigObject(input)
  ensureDir(path.dirname(CONFIG_PATH))
  fs.writeFileSync(CONFIG_PATH, generateFileContents(cfg), 'utf-8')
  try {
    ensureDir(ASSETS_DIR)
    fs.writeFileSync(RAW_JSON_PATH, JSON.stringify(cfg, null, 2), 'utf-8')
  } catch (err) {
    console.warn('Could not write raw app customization JSON:', err?.message || err)
  }
  return cfg
}

module.exports = { writeFrontendCustomization }
