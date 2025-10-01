#!/usr/bin/env node
/**
 * Fix Modal Mobile Responsiveness
 * Changes all Modal size props to be responsive (full on mobile, original size on desktop)
 */

import fs from 'fs'
import path from 'path'

const FRONTEND_DIR = 'frontend/src'

console.log('🔧 Fixing Modal Mobile Responsiveness...\n')

let filesModified = 0
let changesApplied = 0

// Size mappings: desktop size -> mobile pattern
const SIZE_MAP = {
  'sm': '{{ base: "full", lg: "sm" }}',
  'md': '{{ base: "full", lg: "md" }}',
  'lg': '{{ base: "full", lg: "lg" }}',
  'xl': '{{ base: "full", lg: "xl" }}',
  '2xl': '{{ base: "full", lg: "2xl" }}',
  '3xl': '{{ base: "full", lg: "3xl" }}',
  '4xl': '{{ base: "full", lg: "4xl" }}',
  '5xl': '{{ base: "full", lg: "5xl" }}',
  '6xl': '{{ base: "full", lg: "6xl" }}',
}

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
  const original = content
  let fileChanges = 0

  // Fix 1: Modal with explicit size="value" -> size={{ base: "full", lg: "value" }}
  Object.entries(SIZE_MAP).forEach(([size, replacement]) => {
    const pattern = new RegExp(`(<Modal[^>]*\\s)size="${size}"([^>]*>)`, 'g')
    const matches = content.match(pattern)
    if (matches) {
      content = content.replace(pattern, `$1size=${replacement}$2`)
      fileChanges += matches.length
    }
  })

  // Fix 2: AlertDialog with size -> responsive
  Object.entries(SIZE_MAP).forEach(([size, replacement]) => {
    const pattern = new RegExp(`(<AlertDialog[^>]*\\s)size="${size}"([^>]*>)`, 'g')
    const matches = content.match(pattern)
    if (matches) {
      content = content.replace(pattern, `$1size=${replacement}$2`)
      fileChanges += matches.length
    }
  })

  // Save if modified
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8')
    filesModified++
    changesApplied += fileChanges
    console.log(`  ✓ ${filePath.replace(/\\/g, '/')}: ${fileChanges} modals fixed`)
  }
}

// Process all files
const files = findFiles(FRONTEND_DIR)
console.log(`📂 Processing ${files.length} files...\n`)

files.forEach(fixFile)

console.log('\n✅ COMPLETED\n')
console.log(`Files modified: ${filesModified}`)
console.log(`Total modals fixed: ${changesApplied}\n`)

if (filesModified === 0) {
  console.log('ℹ️  No fixes needed - all modals already responsive!\n')
} else {
  console.log('💡 Next steps:')
  console.log('1. Review modals without explicit size (add size prop)')
  console.log('2. Test modals on mobile device (should be full-screen)')
  console.log('3. Consider adding scrollBehavior="inside" for long modals')
  console.log('4. Consider adding motionPreset="slideInBottom" for mobile feel\n')

  console.log('Note: Modals without size prop default to "md" - manually add responsive size:')
  console.log('  <Modal size={{ base: "full", lg: "xl" }} ...>\n')
}
