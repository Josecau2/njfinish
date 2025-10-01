#!/usr/bin/env node
/**
 * Audit Loading States
 * Finds all Spinner usage and identifies opportunities to use Skeleton instead
 */

import fs from 'fs'
import path from 'path'

const FRONTEND_DIR = 'frontend/src'

console.log('🔄 Loading States Audit\n')

const issues = {
  spinnerWithText: [],
  spinnerInList: [],
  spinnerInCard: [],
  spinnerInTable: [],
  spinnerGood: [], // Appropriate uses (buttons, inline actions)
}

let filesScanned = 0
let totalSpinners = 0

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

// Analyze a file for loading patterns
const analyzeFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  lines.forEach((line, index) => {
    const lineNum = index + 1

    // Find Spinner usage
    if (/<Spinner/.test(line)) {
      totalSpinners++

      // Context: next 3 lines
      const context = lines.slice(index, index + 4).join('\n')

      const issue = {
        file: filePath.replace(/\\/g, '/'),
        line: lineNum,
        code: line.trim().substring(0, 80),
        context: context.substring(0, 200),
      }

      // Categorize by context
      if (/Loading|loading|Fetching|fetching/.test(context)) {
        // Spinner with loading text - good candidate for Skeleton
        issues.spinnerWithText.push(issue)
      } else if (/(Table|Tbody|Tr|Td)/.test(context) || /map\(/.test(context)) {
        // Spinner in table/list - should use Skeleton
        issues.spinnerInList.push(issue)
      } else if (/Card|CardBody/.test(context)) {
        // Spinner in card - should use Skeleton
        issues.spinnerInCard.push(issue)
      } else if (/Button|isSubmitting|isLoading/.test(context)) {
        // Spinner in button - this is appropriate
        issues.spinnerGood.push(issue)
      } else {
        // Unknown context - likely needs Skeleton
        issues.spinnerWithText.push(issue)
      }
    }
  })
}

// Process all files
const files = findFiles(FRONTEND_DIR)
filesScanned = files.length
files.forEach(analyzeFile)

// Report results
console.log('📊 SUMMARY\n')
console.log(`Files scanned: ${filesScanned}`)
console.log(`Total Spinners found: ${totalSpinners}`)
console.log(`  - With loading text (use Skeleton): ${issues.spinnerWithText.length}`)
console.log(`  - In lists/tables (use Skeleton): ${issues.spinnerInList.length}`)
console.log(`  - In cards (use Skeleton): ${issues.spinnerInCard.length}`)
console.log(`  - Appropriate uses (buttons): ${issues.spinnerGood.length}\n`)

const needsSkeleton = issues.spinnerWithText.length + issues.spinnerInList.length + issues.spinnerInCard.length

if (needsSkeleton === 0) {
  console.log('✅ All loading states are appropriate!\n')
  process.exit(0)
}

console.log('🔴 SHOULD USE SKELETON (Page/Content Loading)\n')
console.log('These Spinners should be replaced with Skeleton for better UX:\n')

const allIssues = [
  ...issues.spinnerWithText,
  ...issues.spinnerInList,
  ...issues.spinnerInCard,
]

// Group by file
const byFile = {}
allIssues.forEach(issue => {
  if (!byFile[issue.file]) byFile[issue.file] = []
  byFile[issue.file].push(issue)
})

const sortedFiles = Object.entries(byFile).sort((a, b) => b[1].length - a[1].length)

sortedFiles.slice(0, 20).forEach(([file, fileIssues]) => {
  console.log(`\n📄 ${file} (${fileIssues.length} issues)`)
  fileIssues.slice(0, 3).forEach((issue, idx) => {
    console.log(`   ${idx + 1}. Line ${issue.line}: ${issue.code}`)
  })
  if (fileIssues.length > 3) {
    console.log(`   ... and ${fileIssues.length - 3} more`)
  }
})

console.log('\n\n✅ APPROPRIATE SPINNER USAGE (Keep as is)\n')
issues.spinnerGood.slice(0, 5).forEach((issue, idx) => {
  console.log(`${idx + 1}. ${issue.file}:${issue.line}`)
  console.log(`   ${issue.code}\n`)
})

if (issues.spinnerGood.length > 5) {
  console.log(`... and ${issues.spinnerGood.length - 5} more appropriate uses\n`)
}

console.log('\n💡 SKELETON PATTERN:\n')
console.log('// List loading')
console.log('<VStack spacing={4}>')
console.log('  {[1,2,3].map(i => (')
console.log('    <Card key={i} w="full">')
console.log('      <CardBody>')
console.log('        <Skeleton height="20px" mb={2} />')
console.log('        <Skeleton height="16px" width="80%" />')
console.log('      </CardBody>')
console.log('    </Card>')
console.log('  ))}</VStack>')
console.log('\n// Table loading')
console.log('<Tbody>')
console.log('  {[1,2,3].map(i => (')
console.log('    <Tr key={i}>')
console.log('      <Td><Skeleton height="16px" /></Td>')
console.log('      <Td><Skeleton height="16px" /></Td>')
console.log('    </Tr>')
console.log('  ))}</Tbody>\n')

// Save report
const reportPath = 'loading-states-report.json'
fs.writeFileSync(reportPath, JSON.stringify({
  summary: {
    filesScanned,
    totalSpinners,
    needsSkeleton,
    appropriateSpinners: issues.spinnerGood.length,
  },
  issues: {
    spinnerWithText: issues.spinnerWithText,
    spinnerInList: issues.spinnerInList,
    spinnerInCard: issues.spinnerInCard,
  },
  byFile,
}, null, 2))

console.log(`📄 Detailed report saved to: ${reportPath}\n`)

process.exit(needsSkeleton > 0 ? 1 : 0)
