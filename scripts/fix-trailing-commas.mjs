#!/usr/bin/env node

/**
 * Fix Trailing Comma Issues Script
 * Fixes malformed imports with trailing commas from Card migration
 */

import fs from 'fs'
import path from 'path'
import { glob } from 'glob'

const patterns = [
  'frontend/src/**/*.jsx',
  'frontend/src/**/*.js',
  '!frontend/src/**/node_modules/**'
]

async function fixTrailingCommas() {
  console.log('🔧 Fixing trailing comma issues...')

  const files = await glob(patterns, { cwd: process.cwd() })
  let fixedCount = 0

  for (const file of files) {
    const filePath = path.join(process.cwd(), file)
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false

    // Fix trailing commas in Chakra imports: "useColorModeValue, , StandardCard"
    const chakraImportRegex = /import\s*\{\s*([^}]*?),\s*,\s*StandardCard\s*\}\s*from\s*['"]@chakra-ui\/react['"]/g
    if (chakraImportRegex.test(content)) {
      content = content.replace(chakraImportRegex, (match, imports) => {
        return `import { ${imports}, StandardCard } from '@chakra-ui/react'`
      })
      modified = true
      fixedCount++
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✅ Fixed: ${file}`)
    }
  }

  console.log(`\n🎉 Fixed ${fixedCount} trailing comma issues`)
}

fixTrailingCommas().catch(console.error)