#!/usr/bin/env node
/**
 * Audit Modals - Check for mobile-responsive modal patterns
 * Finds all Modal usage and checks for mobile-specific props
 */

import fs from 'fs'
import path from 'path'

const FRONTEND_DIR = 'frontend/src'

console.log('📱 Modal Audit - Mobile Responsiveness\n')

const modals = []
let filesScanned = 0

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

// Analyze a file for modal patterns
const analyzeFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  lines.forEach((line, index) => {
    const lineNum = index + 1

    // Find Modal components (Chakra or custom)
    if (/<Modal\s/.test(line) || /<AlertDialog\s/.test(line)) {
      // Get the next 10 lines for context
      const modalBlock = lines.slice(index, index + 15).join('\n')

      const modal = {
        file: filePath.replace(/\\/g, '/'),
        line: lineNum,
        type: /<AlertDialog/.test(line) ? 'AlertDialog' : 'Modal',
        hasSize: /size=/.test(modalBlock),
        size: (modalBlock.match(/size=["'](\w+)["']/) || [])[1],
        hasResponsiveSize: /size={{/.test(modalBlock),
        hasScrollBehavior: /scrollBehavior=/.test(modalBlock),
        hasIsCentered: /isCentered/.test(modalBlock),
        hasMotion: /motionPreset=/.test(modalBlock),
        code: line.trim().substring(0, 80),
      }

      modals.push(modal)
    }
  })
}

// Process all files
const files = findFiles(FRONTEND_DIR)
filesScanned = files.length
files.forEach(analyzeFile)

// Categorize modals
const needsMobileSize = modals.filter(m => !m.hasResponsiveSize && (!m.size || m.size !== 'full'))
const hasFullSize = modals.filter(m => m.size === 'full')
const hasResponsiveSize = modals.filter(m => m.hasResponsiveSize)
const alertDialogs = modals.filter(m => m.type === 'AlertDialog')

// Report results
console.log('📊 SUMMARY\n')
console.log(`Files scanned: ${filesScanned}`)
console.log(`Total Modals/AlertDialogs found: ${modals.length}`)
console.log(`  - Regular Modals: ${modals.filter(m => m.type === 'Modal').length}`)
console.log(`  - AlertDialogs: ${alertDialogs.length}`)
console.log(`  - With responsive size: ${hasResponsiveSize.length}`)
console.log(`  - With size="full": ${hasFullSize.length}`)
console.log(`  - Need mobile improvements: ${needsMobileSize.length}\n`)

if (needsMobileSize.length === 0) {
  console.log('✅ All modals are mobile-responsive!\n')
  process.exit(0)
}

console.log('🔴 MODALS NEEDING MOBILE IMPROVEMENTS\n')
console.log('These modals should use responsive size for better mobile UX:\n')

// Group by file
const byFile = {}
needsMobileSize.forEach(modal => {
  if (!byFile[modal.file]) byFile[modal.file] = []
  byFile[modal.file].push(modal)
})

const sortedFiles = Object.entries(byFile).sort((a, b) => b[1].length - a[1].length)

sortedFiles.slice(0, 20).forEach(([file, fileModals], idx) => {
  console.log(`${idx + 1}. ${file} (${fileModals.length} modals)`)
  fileModals.forEach((modal, i) => {
    console.log(`   ${String.fromCharCode(97 + i)}. Line ${modal.line}: ${modal.type} ${modal.size ? `size="${modal.size}"` : '(no size)'}`)
  })
  console.log()
})

if (sortedFiles.length > 20) {
  console.log(`... and ${sortedFiles.length - 20} more files\n`)
}

console.log('\n💡 RECOMMENDED FIX PATTERN:\n')
console.log('Change from:')
console.log('  <Modal size="xl" ...>')
console.log('\nTo:')
console.log('  <Modal size={{ base: "full", lg: "xl" }} ...>')
console.log('\nFor full-height on mobile:')
console.log('  <Modal')
console.log('    size={{ base: "full", lg: "2xl" }}')
console.log('    scrollBehavior="inside"')
console.log('    motionPreset="slideInBottom"')
console.log('  >\n')

console.log('Benefits:')
console.log('- Mobile: Full-screen modal with slide-up animation')
console.log('- Desktop: Centered modal with appropriate size')
console.log('- Better touch targets (modal fills screen)')
console.log('- Consistent with mobile app patterns\n')

// Save report
const reportPath = 'modal-audit-report.json'
fs.writeFileSync(reportPath, JSON.stringify({
  summary: {
    filesScanned,
    totalModals: modals.length,
    needsMobileSize: needsMobileSize.length,
    hasResponsiveSize: hasResponsiveSize.length,
    hasFullSize: hasFullSize.length,
  },
  modals: needsMobileSize,
  byFile,
}, null, 2))

console.log(`📄 Detailed report saved to: ${reportPath}\n`)

process.exit(needsMobileSize.length > 0 ? 1 : 0)
