#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Validates the generated manifest.json against current codebase
 * Returns exit code 0 for success, 1 for validation errors
 */
async function checkManifest() {
  const manifestPath = path.join(__dirname, '../AUDIT/manifest.json')

  try {
    // Check if manifest exists
    const manifestContent = await fs.readFile(manifestPath, 'utf8')
    const manifest = JSON.parse(manifestContent)

    console.log('✓ Manifest file exists and is valid JSON')

    // Validation checks
    const errors = []
    const warnings = []

    // Check required structure
    if (!manifest.generated) errors.push('Missing "generated" timestamp')
    if (!manifest.routes || !Array.isArray(manifest.routes)) errors.push('Missing or invalid "routes" array')
    if (!manifest.modals || !Array.isArray(manifest.modals)) errors.push('Missing or invalid "modals" array')
    if (!manifest.components || !Array.isArray(manifest.components)) errors.push('Missing or invalid "components" array')

    // Check minimum expected counts (based on current codebase)
    if (manifest.routes && manifest.routes.length < 20) {
      warnings.push(`Low route count: ${manifest.routes.length} (expected 20+)`)
    }

    if (manifest.modals && manifest.modals.length < 10) {
      warnings.push(`Low modal count: ${manifest.modals.length} (expected 10+)`)
    }

    if (manifest.components && manifest.components.length < 50) {
      warnings.push(`Low component count: ${manifest.components.length} (expected 50+)`)
    }

    // Check for duplicate entries
    const routePaths = manifest.routes?.map(r => r.path) || []
    const duplicateRoutes = routePaths.filter((path, index) => routePaths.indexOf(path) !== index)
    if (duplicateRoutes.length > 0) {
      errors.push(`Duplicate routes found: ${duplicateRoutes.join(', ')}`)
    }

    // Check timestamp freshness (should be within last hour for CI)
    if (manifest.generated) {
      const generated = new Date(manifest.generated)
      const now = new Date()
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      if (generated < hourAgo) {
        warnings.push(`Manifest may be stale (generated: ${generated.toISOString()})`)
      }
    }

    // Report results
    console.log(`\n📊 Manifest Summary:`)
    console.log(`   Routes: ${manifest.routes?.length || 0}`)
    console.log(`   Modals: ${manifest.modals?.length || 0}`)
    console.log(`   Components: ${manifest.components?.length || 0}`)
    console.log(`   Generated: ${manifest.generated || 'unknown'}`)

    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings:')
      warnings.forEach(warning => console.log(`   ${warning}`))
    }

    if (errors.length > 0) {
      console.log('\n❌ Validation Errors:')
      errors.forEach(error => console.log(`   ${error}`))
      console.log('\n💡 Run "npm run audit:gen-manifest" to regenerate')
      process.exit(1)
    }

    console.log('\n✅ Manifest validation passed')
    process.exit(0)

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('❌ Manifest file not found at:', manifestPath)
      console.log('💡 Run "npm run audit:gen-manifest" to generate')
    } else if (error instanceof SyntaxError) {
      console.error('❌ Manifest contains invalid JSON:', error.message)
    } else {
      console.error('❌ Unexpected error:', error.message)
    }
    process.exit(1)
  }
}

checkManifest()