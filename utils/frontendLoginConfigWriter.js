const fs = require('fs')
const path = require('path')

const FRONTEND_DIR = path.join(__dirname, '..', 'frontend')
const CONFIG_PATH = path.join(FRONTEND_DIR, 'src', 'config', 'loginCustomization.js')
const ASSETS_DIR = path.join(FRONTEND_DIR, 'public', 'assets', 'customization')
const RAW_JSON_PATH = path.join(ASSETS_DIR, 'login-customization.json')

const FALLBACK = {
  logo: '',
  title: 'Sign In',
  subtitle: 'Enter your credentials',
  backgroundColor: '#0e1446',
  showForgotPassword: true,
  showKeepLoggedIn: true,
  rightTitle: 'NJ Cabinets',
  rightSubtitle: 'Dealer Portal',
  rightTagline: 'Powering your workflow',
  rightDescription: 'Manage proposals, customers and resources in one place.'
}

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }) }

function maybePersistLogo(rawLogo) {
  if (!rawLogo) return ''
  if (rawLogo.startsWith('/assets/')) return rawLogo // already static
  if (!rawLogo.startsWith('data:')) return rawLogo   // assume URL from API
  // data URI -> write file
  const match = rawLogo.match(/^data:(image\/(png|jpeg|jpg|svg\+xml));base64,(.+)$/)
  if (!match) return ''
  const extMap = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/svg+xml': '.svg' }
  const mime = match[1]
  const ext = extMap[mime] || '.png'
  const b64 = match[3]
  ensureDir(ASSETS_DIR)
  const fileName = 'login-logo' + ext
  const target = path.join(ASSETS_DIR, fileName)
  try {
    fs.writeFileSync(target, Buffer.from(b64, 'base64'))
    return `/assets/customization/${fileName}`
  } catch (e) {
    console.error('Failed writing login logo:', e)
    return ''
  }
}

function buildConfig(input = {}) {
  const merged = { ...FALLBACK, ...input }
  merged.logo = maybePersistLogo(input.logo || merged.logo)
  return { ...merged, _generated: new Date().toISOString(), _version: '1.0.0' }
}

function fileContents(cfg) {
  return `// Login page customization (generated)\n// DO NOT EDIT MANUALLY\n\nexport const LOGIN_CUSTOMIZATION = ${JSON.stringify(cfg, null, 2)}\n\nexport default LOGIN_CUSTOMIZATION\n`
}

async function writeFrontendLoginCustomization(input) {
  const cfg = buildConfig(input)
  ensureDir(path.dirname(CONFIG_PATH))
  fs.writeFileSync(CONFIG_PATH, fileContents(cfg), 'utf-8')
  try {
    ensureDir(ASSETS_DIR)
    fs.writeFileSync(RAW_JSON_PATH, JSON.stringify(cfg), 'utf-8')
  } catch (e) {
    console.warn('Could not write raw login customization JSON:', e?.message)
  }
  return cfg
}

module.exports = { writeFrontendLoginCustomization }
