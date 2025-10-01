#!/usr/bin/env node

/**
 * Adds loading="lazy" to img tags that don't have it
 * Improves initial page load performance
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const srcDir = join(__dirname, '..', 'frontend', 'src')

let filesModified = 0
let imagesUpdated = 0

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

function addLazyLoading(filePath) {
  let content = readFileSync(filePath, 'utf-8')
  const originalContent = content

  // Match img tags without loading attribute
  // Skip if already has loading="eager" or loading="lazy"
  const imgRegex = /<img\s+(?![^>]*loading=)[^>]*>/gi

  let matches = content.match(imgRegex)
  if (!matches) return false

  matches.forEach(imgTag => {
    // Skip if it's a Chakra <Image> component (capitalized)
    if (imgTag.match(/<Image\s/)) return

    // Add loading="lazy" before the closing >
    const updatedTag = imgTag.replace(/>$/, ' loading="lazy">')
    content = content.replace(imgTag, updatedTag)
    imagesUpdated++
  })

  if (content !== originalContent) {
    writeFileSync(filePath, content, 'utf-8')
    return true
  }

  return false
}

console.log('🖼️  Adding lazy loading to images...\n')

const jsxFiles = findJsxFiles(srcDir)

jsxFiles.forEach(file => {
  if (addLazyLoading(file)) {
    filesModified++
    console.log(`✓ ${file.replace(srcDir, 'src')}`)
  }
})

console.log(`\n📊 Summary:`)
console.log(`  Files modified: ${filesModified}`)
console.log(`  Images updated: ${imagesUpdated}`)

if (imagesUpdated > 0) {
  console.log(`\n✅ Lazy loading added successfully!`)
  console.log(`   This will improve initial page load performance.`)
} else {
  console.log(`\n✅ All images already have lazy loading!`)
}
