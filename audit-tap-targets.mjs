#!/usr/bin/env node
/**
 * Audit Tap Targets - WCAG 2.1 Level AA Compliance
 * Finds all IconButtons and interactive elements that may not meet 44×44px minimum
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const FRONTEND_DIR = 'frontend/src'
const MIN_TAP_SIZE = 44 // pixels

console.log('🎯 Tap Target Audit - WCAG 2.1 Level AA (44×44px minimum)\n')

// Chakra UI size mappings (approximate rendered sizes)
const CHAKRA_SIZES = {
  xs: 24,    // Too small
  sm: 32,    // Too small
  md: 40,    // Too small (default for IconButton)
  lg: 48,    // ✅ Meets requirement (44px+)
  xl: 56,    // ✅ Exceeds requirement
}

const issues = []
let totalIconButtons = 0
let totalButtons = 0
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

// Analyze a file for tap target issues
const analyzeFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  lines.forEach((line, index) => {
    const lineNum = index + 1

    // Check IconButton usage
    if (/<IconButton/.test(line)) {
      totalIconButtons++

      // Check if size is specified
      const sizeMatch = line.match(/size=["'](\w+)["']/)
      const size = sizeMatch ? sizeMatch[1] : 'md' // default is md

      // Check if minW/minH is specified (overrides size)
      const hasMinW = /minW=|min-width:/.test(line)
      const hasMinH = /minH=|min-height:/.test(line)

      if (!hasMinW && !hasMinH) {
        const renderedSize = CHAKRA_SIZES[size] || 40

        if (renderedSize < MIN_TAP_SIZE) {
          issues.push({
            file: filePath.replace(/\\/g, '/'),
            line: lineNum,
            type: 'IconButton',
            size: size,
            renderedSize: renderedSize,
            severity: renderedSize < 32 ? 'high' : 'medium',
            suggestion: `Change to size="lg" or add minW="44px" minH="44px"`,
            code: line.trim(),
          })
        }
      }
    }

    // Check regular Button with icon only (no children text)
    if (/<Button\s/.test(line) && !/<Button[^>]*>.*<\/Button>/.test(line)) {
      // Multi-line button, hard to detect icon-only automatically
      // Flag for manual review if size is xs or sm
      const sizeMatch = line.match(/size=["'](\w+)["']/)
      const size = sizeMatch ? sizeMatch[1] : 'md'

      if (size === 'xs' || size === 'sm') {
        totalButtons++
        // Don't flag automatically - might have text children
      }
    }

    // Check for clickable icons without buttons
    if (/<Icon\s/.test(line) && /onClick=/.test(line)) {
      issues.push({
        file: filePath.replace(/\\/g, '/'),
        line: lineNum,
        type: 'Icon with onClick',
        size: 'unknown',
        renderedSize: 24, // typical icon size
        severity: 'high',
        suggestion: 'Wrap in IconButton with size="lg" for proper tap target',
        code: line.trim(),
      })
    }
  })
}

// Scan all files
console.log(`📂 Scanning ${FRONTEND_DIR}...\n`)
const files = findFiles(FRONTEND_DIR)
filesScanned = files.length

files.forEach(analyzeFile)

// Group issues by severity
const highSeverity = issues.filter(i => i.severity === 'high')
const mediumSeverity = issues.filter(i => i.severity === 'medium')

// Report results
console.log('📊 SUMMARY\n')
console.log(`Files scanned: ${filesScanned}`)
console.log(`Total IconButtons found: ${totalIconButtons}`)
console.log(`Total issues found: ${issues.length}`)
console.log(`  - High severity (≤32px): ${highSeverity.length}`)
console.log(`  - Medium severity (33-43px): ${mediumSeverity.length}\n`)

if (issues.length === 0) {
  console.log('✅ No tap target issues found!\n')
  process.exit(0)
}

console.log('🔴 HIGH SEVERITY ISSUES (≤32px)\n')
highSeverity.slice(0, 20).forEach((issue, idx) => {
  console.log(`${idx + 1}. ${issue.file}:${issue.line}`)
  console.log(`   Type: ${issue.type}`)
  console.log(`   Size: ${issue.size} (${issue.renderedSize}px)`)
  console.log(`   Fix: ${issue.suggestion}`)
  console.log(`   Code: ${issue.code.substring(0, 80)}...\n`)
})

if (highSeverity.length > 20) {
  console.log(`   ... and ${highSeverity.length - 20} more high severity issues\n`)
}

console.log('🟡 MEDIUM SEVERITY ISSUES (33-43px)\n')
mediumSeverity.slice(0, 10).forEach((issue, idx) => {
  console.log(`${idx + 1}. ${issue.file}:${issue.line}`)
  console.log(`   Size: ${issue.size} (${issue.renderedSize}px)`)
  console.log(`   Fix: ${issue.suggestion}\n`)
})

if (mediumSeverity.length > 10) {
  console.log(`   ... and ${mediumSeverity.length - 10} more medium severity issues\n`)
}

// Group by file for easier fixing
const byFile = {}
issues.forEach(issue => {
  if (!byFile[issue.file]) byFile[issue.file] = []
  byFile[issue.file].push(issue)
})

console.log('📝 ISSUES BY FILE (Top 15)\n')
const sortedFiles = Object.entries(byFile)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 15)

sortedFiles.forEach(([file, fileIssues]) => {
  console.log(`${file}: ${fileIssues.length} issues`)
})

console.log('\n💡 RECOMMENDED FIX PATTERN:\n')
console.log('Change all IconButton instances from:')
console.log('  <IconButton size="sm" ... />')
console.log('To:')
console.log('  <IconButton size="lg" ... />')
console.log('\nOr add explicit minimum dimensions:')
console.log('  <IconButton minW="44px" minH="44px" ... />\n')

// Save detailed report
const reportPath = 'tap-targets-report.json'
fs.writeFileSync(reportPath, JSON.stringify({
  summary: {
    filesScanned,
    totalIconButtons,
    totalIssues: issues.length,
    highSeverity: highSeverity.length,
    mediumSeverity: mediumSeverity.length,
  },
  issues,
  byFile,
}, null, 2))

console.log(`📄 Detailed report saved to: ${reportPath}\n`)

process.exit(issues.length > 0 ? 1 : 0)
