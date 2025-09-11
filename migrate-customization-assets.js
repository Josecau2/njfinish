const fs = require('fs')
const path = require('path')

/**
 * Migration script to copy existing customization assets to build directory
 * This ensures persistence across Docker rebuilds for existing installations
 * Runs automatically during Docker container startup
 */
const migrateCustomizationAssets = () => {
  console.log('🔄 Migrating existing customization assets to build directory (with self-heal)...')

  const frontendAssetsPath = path.join(__dirname, 'frontend/public/assets/customization')
  const buildAssetsPath = path.join(__dirname, 'build/assets/customization')

  // Ensure build assets directory exists
  if (!fs.existsSync(buildAssetsPath)) {
    fs.mkdirSync(buildAssetsPath, { recursive: true })
    console.log('📁 Created build assets directory:', buildAssetsPath)
  }

  // Detect if build assets directory appears to be an empty mounted volume masking baked assets
  const buildFilesInitial = fs.readdirSync(buildAssetsPath).filter(f => !f.startsWith('.'))
  if (buildFilesInitial.length === 0) {
    console.log('ℹ️  Build assets directory is currently empty (possible fresh volume). Attempting to seed...')
  }

  // If frontend assets exist, use them as source of truth
  if (fs.existsSync(frontendAssetsPath)) {
    const sourceFiles = fs.readdirSync(frontendAssetsPath)
    let copiedCount = 0
    sourceFiles.forEach(file => {
      const sourcePath = path.join(frontendAssetsPath, file)
      const targetPath = path.join(buildAssetsPath, file)
      try {
        if (fs.statSync(sourcePath).isFile()) {
          fs.copyFileSync(sourcePath, targetPath)
          copiedCount++
          console.log(`📋 Copied ${file} → build`)
        }
      } catch (e) {
        console.warn(`⚠️  Failed copying ${file}: ${e.message}`)
      }
    })
    if (copiedCount > 0) {
      console.log(`✅ Seeded build customization assets (${copiedCount} files) from frontend/public`)
    } else {
      console.log('ℹ️  No files copied from frontend (none found)')
    }
  } else {
    console.log('ℹ️  Frontend customization directory not found; skipping copy from frontend.')
  }

  // Self-heal: ensure logo.png exists if any customization config references it
  const customizationConfigPath = path.join(__dirname, 'frontend/src/config/customization.js')
  const expectedLogo = path.join(buildAssetsPath, 'logo.png')
  if (!fs.existsSync(expectedLogo)) {
    // Try to locate a logo in frontend assets
    const possibleFrontendLogo = path.join(frontendAssetsPath, 'logo.png')
    if (fs.existsSync(possibleFrontendLogo)) {
      try {
        fs.copyFileSync(possibleFrontendLogo, expectedLogo)
        console.log('🛠️  Restored missing logo.png into build assets from frontend copy')
      } catch (e) {
        console.warn('⚠️  Could not restore logo.png:', e.message)
      }
    } else if (fs.existsSync(customizationConfigPath)) {
      console.log('ℹ️  customization.js present but logo.png missing; you may need to re-upload a logo.')
    }
  }

  const finalFiles = fs.readdirSync(buildAssetsPath).filter(f => !f.startsWith('.'))
  console.log(`📦 Build customization assets now contain: ${finalFiles.length} file(s) [${finalFiles.join(', ')}]`)
  console.log('🎉 Customization assets migration/self-heal complete')
}

// Run if called directly
if (require.main === module) {
  migrateCustomizationAssets()
}

module.exports = { migrateCustomizationAssets }
