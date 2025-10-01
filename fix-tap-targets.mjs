#!/usr/bin/env node
/**
 * Fix Tap Targets - WCAG 2.1 Level AA Compliance
 * Changes all IconButton size="md" to size="lg" (40px → 48px)
 */

import fs from 'fs'
import path from 'path'

const FRONTEND_DIR = 'frontend/src'

console.log('🔧 Fixing Tap Targets...\n')

let filesModified = 0
let changesApplied = 0

// Find all JSX/JS files
const findFiles = (dir) => {
  const files = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      files.push(...findFiles(fullPath))
    } else if (entry.isFile() && /\.(jsx?|tsx?)$/.test(entry.name)) {
      files.push(fullPath)
    }
  }
  return files
}

// Fix a single file
const fixFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8')
  let modified = false
  let fileChanges = 0

  // Fix 1: IconButton with size="md" → size="lg"
  const iconButtonMdPattern = /(<IconButton[^>]*\s)size="md"([^>]*>)/g
  if (iconButtonMdPattern.test(content)) {
    const before = content
    content = content.replace(iconButtonMdPattern, '$1size="lg"$2')
    if (content !== before) {
      const count = (before.match(iconButtonMdPattern) || []).length
      fileChanges += count
      modified = true
      console.log(`  ✓ ${filePath}: Changed ${count} IconButton(s) from md to lg`)
    }
  }

  // Fix 2: IconButton without size prop → add size="lg"
  // Match IconButton that doesn't already have size= prop
  const iconButtonNoSizePattern = /<IconButton\s+(?![^>]*size=)([^>]*>)/g
  const matches = [...content.matchAll(iconButtonNoSizePattern)]

  if (matches.length > 0) {
    // Replace backwards to maintain string positions
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i]
      const fullMatch = match[0]
      const props = match[1]

      // Don't add if already has minW/minH (those override size)
      if (!/minW=/.test(fullMatch) && !/minH=/.test(fullMatch)) {
        const replacement = `<IconButton size="lg" ${props}`
        content = content.substring(0, match.index) + replacement + content.substring(match.index + fullMatch.length)
        fileChanges++
        modified = true
      }
    }
    if (fileChanges > 0) {
      console.log(`  ✓ ${filePath}: Added size="lg" to ${matches.length} IconButton(s)`)
    }
  }

  // Save if modified
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8')
    filesModified++
    changesApplied += fileChanges
  }
}

// Process all files
const files = findFiles(FRONTEND_DIR)
console.log(`📂 Processing ${files.length} files...\n`)

files.forEach(fixFile)

console.log('\n✅ COMPLETED\n')
console.log(`Files modified: ${filesModified}`)
console.log(`Total changes: ${changesApplied}\n`)

if (filesModified === 0) {
  console.log('ℹ️  No fixes needed - all IconButtons already compliant!\n')
} else {
  console.log('💡 Next steps:')
  console.log('1. Run build to verify no errors')
  console.log('2. Test interactive elements on mobile device')
  console.log('3. Verify all buttons are easily tappable (44×44px minimum)\n')
}
