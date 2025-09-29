const fs = require('fs')
const path = require('path')

// Script to fix web-vitals imports and usage in performanceMonitor.js
console.log('🔧 Fixing web-vitals imports and usage...\n')

const perfMonitorPath = path.join(__dirname, 'frontend', 'src', 'utils', 'performanceMonitor.js')

if (!fs.existsSync(perfMonitorPath)) {
  console.log('❌ performanceMonitor.js not found')
  process.exit(1)
}

// Read the current file
let content = fs.readFileSync(perfMonitorPath, 'utf8')
console.log('📄 Original import line:')
console.log(content.split('\n')[0])
console.log()

// Step 1: Update the import statement
const oldImport = "import { getLCP, getFID, getCLS, getFCP, getTTFB } from 'web-vitals'"
const newImport = "import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals'"

content = content.replace(oldImport, newImport)
console.log('✅ Updated import to new web-vitals API')
console.log('📦 New import:', newImport)
console.log()

// Step 2: Update function calls
const replacements = [
  { old: 'getLCP(', new: 'onLCP(' },
  { old: 'getCLS(', new: 'onCLS(' },
  { old: 'getFID(', new: 'onINP(' }, // FID replaced with INP
  { old: 'getFCP(', new: 'onFCP(' },
  { old: 'getTTFB(', new: 'onTTFB(' }
]

replacements.forEach(({ old, new: newCall }) => {
  const count = (content.match(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
  if (count > 0) {
    content = content.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newCall)
    console.log(`✅ Replaced ${count} instances of ${old} with ${newCall}`)
  }
})

// Step 3: Update comments and variable names if needed
content = content.replace(/First Input Delay \(FID\)/g, 'Interaction to Next Paint (INP)')
content = content.replace(/FID/g, 'INP') // Update metric name in comments
content = content.replace(/getFID/g, 'onINP') // Any remaining references

// Step 4: Update the INP threshold comment (INP target is typically <200ms instead of <100ms for FID)
content = content.replace(
  '// Monitor First Input Delay (FID) - target < 100ms',
  '// Monitor Interaction to Next Paint (INP) - target < 200ms'
)

content = content.replace(
  'if (metric.value > 100) {',
  'if (metric.value > 200) {'
)

content = content.replace(
  'console.warn(`🚨 PHASE HADES: FID violation on ${currentPath} - ${metric.value}ms (target: <100ms)`)',
  'console.warn(`🚨 PHASE HADES: INP violation on ${currentPath} - ${metric.value}ms (target: <200ms)`)'
)

// Write the updated file
fs.writeFileSync(perfMonitorPath, content)
console.log('\n✅ Successfully updated performanceMonitor.js')
console.log('🔄 Changes made:')
console.log('  - Updated imports: get* → on*')
console.log('  - Replaced FID with INP (newer, more accurate metric)')
console.log('  - Updated thresholds and comments')
console.log('\n🎯 The performance monitor now uses the modern web-vitals API!')

// Verify the changes
console.log('\n🔍 Verification:')
const updatedContent = fs.readFileSync(perfMonitorPath, 'utf8')
const newImportLine = updatedContent.split('\n')[0]
console.log('New import line:', newImportLine)

const hasOldFunctions = /get(LCP|CLS|FID|FCP|TTFB)\(/.test(updatedContent)
const hasNewFunctions = /on(LCP|CLS|INP|FCP|TTFB)\(/.test(updatedContent)

console.log('Old API functions present:', hasOldFunctions ? '❌ Yes' : '✅ No')
console.log('New API functions present:', hasNewFunctions ? '✅ Yes' : '❌ No')