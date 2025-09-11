const fs = require('fs')
const path = require('path')

/**
 * Frontend Config Writer Utility
 *
 * This utility handles writing customization data to the frontend config file
 * and copying asset files to the frontend public directory.
 *
 * IMPORTANT: This approach embeds customization directly into the frontend build,
 * making it permanent across all computers without requiring API calls.
 *
 * Usage:
 *   const { updateFrontendCustomization } = require('../utils/frontendConfigWriter')
 *   await updateFrontendCustomization(customizationData, logoFiles)
 */

/**
 * 🗑️ Clean up default favicon and update manifest when custom logo is set
 */
const cleanupDefaultFavicon = (customLogoPath) => {
  try {
    const publicDir = path.join(__dirname, '../frontend/public')
    const defaultFaviconPath = path.join(publicDir, 'favicon.ico')
    const manifestPath = path.join(publicDir, 'manifest.json')

    // Remove default favicon if it exists
    if (fs.existsSync(defaultFaviconPath)) {
      fs.unlinkSync(defaultFaviconPath)
      console.log('🗑️ Removed default favicon.ico')
    }

    // Create custom favicon from the uploaded logo
    const customFaviconPath = path.join(publicDir, 'favicon.ico')
    fs.copyFileSync(customLogoPath, customFaviconPath)
    console.log('🔄 Custom logo set as favicon.ico')

    // Update manifest.json to reference the custom logo with SVG fallback
    if (fs.existsSync(manifestPath)) {
      const manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
      manifestData.icons = [
        {
          "src": "./favicon.ico",
          "sizes": "64x64 32x32 24x24 16x16",
          "type": "image/x-icon"
        },
        {
          "src": "./assets/customization/logo.png",
          "sizes": "192x192",
          "type": "image/png"
        },
        {
          "src": "./assets/fallback-icon.svg",
          "sizes": "192x192",
          "type": "image/svg+xml",
          "purpose": "any"
        }
      ]
      fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2))
      console.log('📱 Updated manifest.json with custom logo and SVG fallback')
    }

  } catch (error) {
    console.warn('⚠️ Could not cleanup default favicon:', error.message)
  }
}

// Paths configuration
const FRONTEND_CONFIG_PATH = path.join(__dirname, '../frontend/src/config/customization.js')
const FRONTEND_ASSETS_PATH = path.join(__dirname, '../frontend/public/assets/customization')
const BUILD_ASSETS_PATH = path.join(__dirname, '../build/assets/customization')
const RUNTIME_FILE_PUBLIC = path.join(FRONTEND_ASSETS_PATH, 'runtime-customization.js')
const RUNTIME_FILE_BUILD = path.join(BUILD_ASSETS_PATH, 'runtime-customization.js')
const FALLBACK_ICON_PUBLIC = path.join(__dirname, '../frontend/public/assets/fallback-icon.svg')
const FALLBACK_ICON_BUILD = path.join(__dirname, '../build/assets/fallback-icon.svg')

/**
 * Ensures the assets directories exist
 */
const ensureAssetsDirectory = () => {
  if (!fs.existsSync(FRONTEND_ASSETS_PATH)) {
    fs.mkdirSync(FRONTEND_ASSETS_PATH, { recursive: true })
    console.log('📁 Created frontend assets directory:', FRONTEND_ASSETS_PATH)
  }
  if (!fs.existsSync(BUILD_ASSETS_PATH)) {
    fs.mkdirSync(BUILD_ASSETS_PATH, { recursive: true })
    console.log('📁 Created build assets directory:', BUILD_ASSETS_PATH)
  }
  // Ensure fallback icon exists (lightweight inline SVG)
  const fallbackSvg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg width="192" height="192" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">\n  <rect width="192" height="192" rx="24" fill="#0e1446"/>\n  <path d="M52 128L76 64H92L116 128H100L94 112H74L68 128H52ZM78.6 100H89.4L84 84.2L78.6 100Z" fill="#0dcaf0"/>\n  <circle cx="148" cy="44" r="20" fill="#0dcaf0" stroke="white" stroke-width="4"/>\n</svg>`
  try {
    if (!fs.existsSync(FALLBACK_ICON_PUBLIC)) {
      fs.writeFileSync(FALLBACK_ICON_PUBLIC, fallbackSvg, 'utf8')
      console.log('🛡️  Created fallback icon (public)')
    }
    if (!fs.existsSync(FALLBACK_ICON_BUILD)) {
      // copy or write
      fs.mkdirSync(path.dirname(FALLBACK_ICON_BUILD), { recursive: true })
      fs.writeFileSync(FALLBACK_ICON_BUILD, fallbackSvg, 'utf8')
      console.log('🛡️  Created fallback icon (build)')
    }
  } catch (e) {
    console.warn('⚠️  Could not ensure fallback icon:', e.message)
  }
}

/**
 * Copies a logo file to both frontend and build assets directories
 * @param {string} sourcePath - Path to the source logo file
 * @param {string} targetFilename - Target filename (e.g., 'logo.png', 'login-logo.png')
 * @returns {string} - Relative path for frontend use
 */
const copyLogoAsset = (sourcePath, targetFilename) => {
  try {
    ensureAssetsDirectory()

    const frontendTargetPath = path.join(FRONTEND_ASSETS_PATH, targetFilename)
    const buildTargetPath = path.join(BUILD_ASSETS_PATH, targetFilename)

    if (fs.existsSync(sourcePath)) {
      // Copy to frontend/public/assets/customization (for development)
      fs.copyFileSync(sourcePath, frontendTargetPath)
      console.log(`📋 Copied logo asset to frontend: ${sourcePath} → ${frontendTargetPath}`)

      // Copy to build/assets/customization (for production/Docker persistence)
      fs.copyFileSync(sourcePath, buildTargetPath)
      console.log(`📋 Copied logo asset to build: ${sourcePath} → ${buildTargetPath}`)

      // 🗑️ Clean up default favicon when custom logo is uploaded
      if (targetFilename === 'logo.png') {
        cleanupDefaultFavicon(sourcePath)
      }

      return `/assets/customization/${targetFilename}`
    } else {
      console.warn(`⚠️  Logo file not found: ${sourcePath}`)
      return null
    }
  } catch (error) {
    console.error(`❌ Error copying logo asset:`, error)
    return null
  }
}

/**
 * Generates the frontend customization config file
 * @param {Object} customizationData - Combined customization data
 */
const generateConfigFile = (customizationData) => {
  const timestamp = new Date().toISOString()

  const configContent = `// Auto-generated customization config - DO NOT EDIT MANUALLY
// This file is automatically generated when customization settings are saved
// Last generated: ${timestamp}

export const EMBEDDED_CUSTOMIZATION = ${JSON.stringify(customizationData, null, 2)}

export default EMBEDDED_CUSTOMIZATION`

  try {
    fs.writeFileSync(FRONTEND_CONFIG_PATH, configContent, 'utf8')
    console.log('✅ Frontend customization config updated:', FRONTEND_CONFIG_PATH)
  } catch (error) {
    console.error('❌ Error writing frontend config:', error)
    throw error
  }
}

/**
 * Generates an out-of-bundle runtime customization JS file so production
 * can update branding instantly without a full frontend rebuild.
 */
const generateRuntimeFile = (customizationData) => {
  try {
    const content = `// Auto-generated at ${new Date().toISOString()}\nwindow.RUNTIME_CUSTOMIZATION = ${JSON.stringify(customizationData)};\nwindow.RUNTIME_CUSTOMIZATION_VERSION = '${Date.now()}';\n`;
    fs.writeFileSync(RUNTIME_FILE_PUBLIC, content, 'utf8')
    fs.writeFileSync(RUNTIME_FILE_BUILD, content, 'utf8')
    console.log('⚡ runtime-customization.js updated (public & build)')
  } catch (e) {
    console.warn('⚠️  Failed writing runtime customization file:', e.message)
  }
}

/**
 * Main function to update frontend customization
 * @param {Object} uiCustomization - UI customization data (colors, logo, text)
 * @param {Object} loginCustomization - Login page customization data
 * @param {Object} logoFiles - Logo file paths { main: string, login: string }
 */
const updateFrontendCustomization = async (uiCustomization = {}, loginCustomization = {}, logoFiles = {}) => {
  try {
    console.log('🔄 Updating frontend customization...')

    ensureAssetsDirectory()

    // Process logo assets
    let logoImagePath = null
    let loginLogoPath = null

    if (logoFiles.main && fs.existsSync(logoFiles.main)) {
      logoImagePath = copyLogoAsset(logoFiles.main, 'logo.png')
    } else if (uiCustomization.logoImage && !uiCustomization.logoImage.startsWith('/assets/customization/')) {
      // Handle existing logo in uploads directory
      const existingLogoPath = path.join(__dirname, '..', uiCustomization.logoImage)
      if (fs.existsSync(existingLogoPath)) {
        logoImagePath = copyLogoAsset(existingLogoPath, 'logo.png')
      }
    }

    if (logoFiles.login && fs.existsSync(logoFiles.login)) {
      loginLogoPath = copyLogoAsset(logoFiles.login, 'login-logo.png')
    }

    // Combine all customization data
    const combinedCustomization = {
      // UI Customization
      headerBg: uiCustomization.headerBg || '#ffffff',
      headerFontColor: uiCustomization.headerFontColor || '#333333',
      sidebarBg: uiCustomization.sidebarBg || '#212631',
      sidebarFontColor: uiCustomization.sidebarFontColor || '#ffffff',
      logoBg: uiCustomization.logoBg || '#0dcaf0',

      // Branding
      logoText: uiCustomization.logoText || 'NJ Cabinets',
      logoImage: logoImagePath || uiCustomization.logoImage || null,

      // Login Customization
      loginLogo: loginLogoPath || loginCustomization.logo || "",
      loginTitle: loginCustomization.title || 'Sign In',
      loginSubtitle: loginCustomization.subtitle || 'Enter your email and password to sign in!',
      loginBackgroundColor: (loginCustomization.backgroundColor || '#0e1446').trim(),
      showForgotPassword: loginCustomization.showForgotPassword !== false,
      showKeepLoggedIn: loginCustomization.showKeepLoggedIn !== false,
      rightTitle: loginCustomization.rightTitle || 'See Your Cabinet Price in Seconds!',
      rightSubtitle: loginCustomization.rightSubtitle || 'CABINET PORTAL',
      rightTagline: loginCustomization.rightTagline || 'Dealer Portal',
      rightDescription: loginCustomization.rightDescription || 'Manage end-to-end flow, from pricing cabinets to orders and returns with our premium sales automation software tailored to kitchen industry.',

      // Metadata
      lastUpdated: new Date().toISOString(),
      generatedAt: new Date().toISOString()
    }

    // Generate the config file
    generateConfigFile(combinedCustomization)
  // Generate runtime JS (instant update without rebuild)
  generateRuntimeFile(combinedCustomization)

    console.log('🎉 Frontend customization update complete!')
    return combinedCustomization

  } catch (error) {
    console.error('❌ Error updating frontend customization:', error)
    throw error
  }
}

/**
 * Removes a logo asset from both frontend and build directories
 * @param {string} logoType - 'logo' or 'login-logo'
 */
const removeLogoAsset = (logoType) => {
  const filename = logoType === 'login-logo' ? 'login-logo.png' : 'logo.png'
  const frontendTargetPath = path.join(FRONTEND_ASSETS_PATH, filename)
  const buildTargetPath = path.join(BUILD_ASSETS_PATH, filename)

  try {
    if (fs.existsSync(frontendTargetPath)) {
      fs.unlinkSync(frontendTargetPath)
      console.log(`🗑️  Removed logo asset from frontend: ${frontendTargetPath}`)
    }
    if (fs.existsSync(buildTargetPath)) {
      fs.unlinkSync(buildTargetPath)
      console.log(`🗑️  Removed logo asset from build: ${buildTargetPath}`)
    }
  } catch (error) {
    console.error(`❌ Error removing logo asset:`, error)
  }
}

module.exports = {
  updateFrontendCustomization,
  removeLogoAsset,
  FRONTEND_CONFIG_PATH,
  FRONTEND_ASSETS_PATH,
  BUILD_ASSETS_PATH
  , RUNTIME_FILE_PUBLIC, RUNTIME_FILE_BUILD
}
