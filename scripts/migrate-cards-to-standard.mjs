#!/usr/bin/env node

/**
 * Card Migration Script
 * Migrates all Chakra Card usages to StandardCard across the entire codebase
 */

import fs from 'fs'
import path from 'path'
import { glob } from 'glob'

// Files to process
const patterns = [
  'frontend/src/**/*.jsx',
  'frontend/src/**/*.js',
  '!frontend/src/components/StandardCard.jsx',
  '!frontend/src/**/node_modules/**'
]

async function migrateCards() {
  console.log('🔄 Starting Card → StandardCard migration...')

  const files = await glob(patterns, { cwd: process.cwd() })
  console.log(`📁 Found ${files.length} files to process`)

  let totalReplacements = 0

  for (const file of files) {
    const filePath = path.join(process.cwd(), file)
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false

    // Skip if already migrated
    if (content.includes('StandardCard') && !content.includes('import.*Card.*from.*@chakra-ui/react')) {
      continue
    }

    // Add StandardCard import if Card is imported from Chakra
    if (content.includes('import') && content.includes('Card') && content.includes('@chakra-ui/react')) {
      // Remove Card, CardBody, CardHeader from Chakra imports
      content = content.replace(
        /import\s*\{\s*([^}]*)\s*\}\s*from\s*['"]@chakra-ui\/react['"]/g,
        (match, imports) => {
          let newImports = imports
            .split(',')
            .map(imp => imp.trim())
            .filter(imp => !['Card', 'CardBody', 'CardHeader'].includes(imp))
            .join(', ')

          if (newImports && !newImports.includes('StandardCard')) {
            newImports += ', StandardCard'
          } else if (!newImports) {
            newImports = 'StandardCard'
          }

          return `import { ${newImports} } from '@chakra-ui/react'`
        }
      )

      // Add StandardCard import if not already present
      if (!content.includes('StandardCard')) {
        const importMatch = content.match(/import\s+.*from\s+['"]\.\.\/components\/StandardCard['"]/m)
        if (!importMatch) {
          // Find a good place to add the import
          const chakraImportMatch = content.match(/import\s+.*from\s+['"]@chakra-ui\/react['"]/m)
          if (chakraImportMatch) {
            content = content.replace(
              chakraImportMatch[0],
              `${chakraImportMatch[0]}\nimport { StandardCard } from '../components/StandardCard'`
            )
          }
        }
      }

      modified = true
    }

    // Replace <Card> with <StandardCard>
    if (content.includes('<Card')) {
      content = content.replace(/<Card(\s[^>]*)?>/g, '<StandardCard$1>')
      content = content.replace(/<\/Card>/g, '</StandardCard>')
      modified = true
      totalReplacements++
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✅ Migrated: ${file}`)
    }
  }

  console.log(`\n🎉 Migration complete! ${totalReplacements} Card components migrated to StandardCard`)
}

migrateCards().catch(console.error)