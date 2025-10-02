#!/usr/bin/env node

/**
 * Fix Link Tap Targets Script
 *
 * Automatically adds minH prop to Link components that are missing it
 * to ensure they meet the 44px minimum tap target requirement.
 *
 * Usage: node scripts/fix-link-tap-targets.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')
const srcDir = join(rootDir, 'frontend', 'src')

let fixedCount = 0
let skippedCount = 0

/**
 * Recursively find all .jsx/.js files
 */
function findJsxFiles(dir, fileList = []) {
  const files = readdirSync(dir)

  for (const file of files) {
    const filePath = join(dir, file)
    const stat = statSync(filePath)

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        findJsxFiles(filePath, fileList)
      }
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      fileList.push(filePath)
    }
  }

  return fileList
}

/**
 * Fix Link components in a file
 */
function fixLinksInFile(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  const relativePath = relative(rootDir, filePath)

  // Skip files that don't have Link components
  if (!content.includes('<Link')) {
    return
  }

  let modified = false
  const lines = content.split('\n')
  const newLines = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Check if line contains a Link component
    if (line.includes('<Link') && !line.includes('</Link>')) {
      const hasMinH = /minH\s*=/.test(line)
      const hasMinW = /minW\s*=/.test(line)
      const hasPadding = /p[xy]?\s*=/.test(line) || /padding/.test(line)
      const isComment = line.trim().startsWith('//')

      // Skip if already has sizing or is a comment
      if (isComment || hasMinH || hasMinW || hasPadding) {
        newLines.push(line)
        skippedCount++
        continue
      }

      // Check if this is a multi-line Link component
      let fullComponent = line
      let j = i + 1
      while (j < lines.length && !fullComponent.includes('>')) {
        fullComponent += '\n' + lines[j]
        j++
      }

      // Check the full component
      const fullHasMinH = /minH\s*=/.test(fullComponent)
      const fullHasPadding = /p[xy]?\s*=/.test(fullComponent) || /padding/.test(fullComponent)

      if (!fullHasMinH && !fullHasPadding) {
        // Add minH to the Link component on the same line
        const modifiedLine = line.replace('<Link', '<Link minH="44px"')
        newLines.push(modifiedLine)
        modified = true
        fixedCount++
        console.log(`✅ Fixed: ${relativePath}:${i + 1}`)
      } else {
        newLines.push(line)
        skippedCount++
      }
    } else {
      newLines.push(line)
    }
  }

  if (modified) {
    writeFileSync(filePath, newLines.join('\n'), 'utf-8')
  }
}

// Run fixes
console.log('🔧 Fixing Link tap targets...\n')

const jsxFiles = findJsxFiles(srcDir)
for (const file of jsxFiles) {
  fixLinksInFile(file)
}

console.log('\n📊 Summary:')
console.log(`   Fixed: ${fixedCount} Links`)
console.log(`   Skipped: ${skippedCount} Links (already compliant)`)
console.log('\n✅ Done! Run audit script to verify.\n')
