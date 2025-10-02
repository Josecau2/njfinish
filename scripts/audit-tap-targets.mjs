#!/usr/bin/env node

/**
 * Audit script to find IconButton and Button components that may not meet
 * WCAG 2.1 Level AA tap target size requirements (44×44px minimum)
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')
const srcDir = join(rootDir, 'frontend', 'src')

const issues = []

/**
 * Recursively find all .jsx files
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
 * Extract full component from starting line
 */
function extractFullComponent(lines, startIndex) {
  let component = lines[startIndex]
  let i = startIndex + 1
  let braceDepth = 0

  // Count braces in the starting line
  for (const char of component) {
    if (char === '{') braceDepth++
    if (char === '}') braceDepth--
  }

  // Keep adding lines until we find the self-closing tag or closing tag
  // Make sure we're not inside a JSX expression
  while (i < lines.length) {
    const line = lines[i]

    // Count braces in this line
    for (const char of line) {
      if (char === '{') braceDepth++
      if (char === '}') braceDepth--
    }

    component += '\n' + line

    // Check if we've reached the end of the component
    // Only stop if braces are balanced and we have a closing tag
    if (braceDepth === 0 && (line.includes('/>') || line.trim().startsWith('</'))) {
      break
    }

    i++
    // Safety limit
    if (i - startIndex > 50) break
  }

  return component
}

/**
 * Check if a component has proper tap target sizing
 */
function checkTapTargets(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const relativePath = relative(rootDir, filePath)

  lines.forEach((line, index) => {
    const lineNum = index + 1

    // Check for IconButton without size prop or with size="sm"
    if (line.includes('<IconButton')) {
      const fullComponent = extractFullComponent(lines, index)

      const hasMinW = /minW\s*=/.test(fullComponent)
      const hasMinH = /minH\s*=/.test(fullComponent)
      const hasSize = /size\s*=\s*["'](lg|md)["']/.test(fullComponent)
      const hasSmallSize = /size\s*=\s*["']sm["']/.test(fullComponent)
      const hasButtonSize = /\{\.\.\.ICON_BUTTON_SIZE\}/.test(fullComponent)

      if (hasSmallSize || (!hasMinW && !hasMinH && !hasSize && !hasButtonSize)) {
        issues.push({
          file: relativePath,
          line: lineNum,
          type: 'IconButton',
          issue: hasSmallSize
            ? 'Uses size="sm" - may be too small (32px)'
            : 'Missing size prop or minW/minH - check if ≥44px',
          code: line.trim()
        })
      }
    }

    // Check for Button with size="sm"
    if (line.includes('<Button') && /size\s*=\s*["']sm["']/.test(line)) {
      const fullComponent = extractFullComponent(lines, index)
      const hasMinH = /minH\s*=/.test(fullComponent)

      if (!hasMinH) {
        issues.push({
          file: relativePath,
          line: lineNum,
          type: 'Button',
          issue: 'Uses size="sm" without minH override - may be too small',
          code: line.trim()
        })
      }
    }

    // Check for Link components that might be interactive
    if (line.includes('<Link') || line.includes('<a ')) {
      const fullComponent = extractFullComponent(lines, index)

      const hasMinH = /minH\s*=/.test(fullComponent)
      const hasMinW = /minW\s*=/.test(fullComponent)
      const hasPadding = /p[xy]?\s*=/.test(fullComponent) || /padding/.test(fullComponent)

      if (!hasMinH && !hasMinW && !hasPadding) {
        issues.push({
          file: relativePath,
          line: lineNum,
          type: 'Link/Anchor',
          issue: 'Missing minimum size props - verify tap target',
          code: line.trim()
        })
      }
    }
  })
}

// Run audit
console.log('🔍 Auditing tap target sizes...\n')

const jsxFiles = findJsxFiles(srcDir)
jsxFiles.forEach(checkTapTargets)

// Report findings
if (issues.length === 0) {
  console.log('✅ No tap target issues found!\n')
} else {
  console.log(`⚠️  Found ${issues.length} potential tap target issues:\n`)

  // Group by type
  const byType = {}
  issues.forEach(issue => {
    if (!byType[issue.type]) byType[issue.type] = []
    byType[issue.type].push(issue)
  })

  Object.entries(byType).forEach(([type, typeIssues]) => {
    console.log(`\n📱 ${type} (${typeIssues.length} issues)`)
    console.log('─'.repeat(80))

    typeIssues.slice(0, 20).forEach(issue => {
      console.log(`\n${issue.file}:${issue.line}`)
      console.log(`  Issue: ${issue.issue}`)
      console.log(`  Code:  ${issue.code}`)
    })

    if (typeIssues.length > 20) {
      console.log(`\n  ... and ${typeIssues.length - 20} more`)
    }
  })

  console.log('\n\n📊 Summary:')
  console.log('─'.repeat(80))
  Object.entries(byType).forEach(([type, typeIssues]) => {
    console.log(`  ${type}: ${typeIssues.length}`)
  })

  console.log('\n💡 Recommendations:')
  console.log('  - IconButton: Use size="lg" (48px) or add minW="44px" minH="44px"')
  console.log('  - Button: Avoid size="sm" on mobile or add minH="44px"')
  console.log('  - Links: Add py={2} px={3} minimum or minH="44px"')
  console.log('')
}

// Exit with error code if issues found
process.exit(issues.length > 0 ? 1 : 0)
