const fs = require('fs')
const path = require('path')

/**
 * Migration script to copy existing customization assets to build directory
 * This ensures persistence across Docker rebuilds for existing installations
 * Runs automatically during Docker container startup
 */
const migrateCustomizationAssets = () => {
  console.log('🔄 Migrating existing customization assets to build directory...')

  const frontendAssetsPath = path.join(__dirname, 'frontend/public/assets/customization')
  const buildAssetsPath = path.join(__dirname, 'build/assets/customization')

  // Ensure build assets directory exists
  if (!fs.existsSync(buildAssetsPath)) {
    fs.mkdirSync(buildAssetsPath, { recursive: true })
    console.log('📁 Created build assets directory:', buildAssetsPath)
  }

  // Check if frontend assets directory exists
  if (!fs.existsSync(frontendAssetsPath)) {
    console.log('ℹ️  No existing customization assets found in frontend directory')
    return
  }

  // Copy all files from frontend assets to build assets
  const files = fs.readdirSync(frontendAssetsPath)
  let copiedCount = 0

  files.forEach(file => {
    const sourcePath = path.join(frontendAssetsPath, file)
    const targetPath = path.join(buildAssetsPath, file)

    if (fs.statSync(sourcePath).isFile()) {
      try {
        fs.copyFileSync(sourcePath, targetPath)
        console.log(`📋 Migrated: ${file}`)
        copiedCount++
      } catch (error) {
        console.error(`❌ Error migrating ${file}:`, error.message)
      }
    }
  })

  console.log(`✅ Migration complete! Copied ${copiedCount} customization assets to build directory`)

  if (copiedCount > 0) {
    console.log('🎉 Your customization assets are now persistent across Docker rebuilds!')
  }
}

// Run if called directly
if (require.main === module) {
  migrateCustomizationAssets()
}

module.exports = { migrateCustomizationAssets }
