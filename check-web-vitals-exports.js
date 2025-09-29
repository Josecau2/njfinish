const fs = require('fs')
const path = require('path')

// Script to check web-vitals exports and identify missing imports
console.log('🔍 Checking web-vitals exports...\n')

// Check if we're in the right directory
const frontendPath = path.join(__dirname, 'frontend')
const webVitalsPath = path.join(frontendPath, 'node_modules', 'web-vitals')

console.log('Looking for web-vitals in:', webVitalsPath)

// First, let's check if web-vitals is installed
try {
  const webVitals = require(path.join(frontendPath, 'node_modules', 'web-vitals'))
  console.log('✅ web-vitals package found')
  console.log('📦 Available exports:', Object.keys(webVitals).join(', '))
  console.log()

  // Check the specific imports that are failing
  const expectedExports = ['getCLS', 'getFID', 'getLCP', 'getFCP', 'getTTFB']
  const missingExports = []
  const availableExports = []

  expectedExports.forEach(exportName => {
    if (webVitals[exportName]) {
      availableExports.push(exportName)
    } else {
      missingExports.push(exportName)
    }
  })

  console.log('✅ Available expected exports:', availableExports.join(', '))
  if (missingExports.length > 0) {
    console.log('❌ Missing expected exports:', missingExports.join(', '))
  }

  console.log('\n🔧 Alternative export names to check:')
  const allExports = Object.keys(webVitals)
  const possibleAlternatives = allExports.filter(exp =>
    exp.toLowerCase().includes('cls') ||
    exp.toLowerCase().includes('fid') ||
    exp.toLowerCase().includes('lcp') ||
    exp.toLowerCase().includes('fcp') ||
    exp.toLowerCase().includes('ttfb') ||
    exp.toLowerCase().includes('vital') ||
    exp.toLowerCase().includes('on')
  )
  console.log('Possible matches:', possibleAlternatives.join(', '))

} catch (error) {
  console.log('❌ Error loading web-vitals:', error.message)

  // Try alternative approach - check package.json
  try {
    const packageJson = require(path.join(frontendPath, 'package.json'))
    if (packageJson.dependencies && packageJson.dependencies['web-vitals']) {
      console.log('📦 web-vitals found in package.json:', packageJson.dependencies['web-vitals'])
    }
  } catch (e) {
    console.log('❌ Could not read package.json')
  }
}

// Now check the performanceMonitor.js file for the problematic imports
const perfMonitorPath = path.join(frontendPath, 'src', 'utils', 'performanceMonitor.js')

if (fs.existsSync(perfMonitorPath)) {
  console.log('\n📄 Checking performanceMonitor.js imports...')

  const content = fs.readFileSync(perfMonitorPath, 'utf8')
  const importLine = content.split('\n')[0]

  console.log('Current import line:')
  console.log(importLine)

  // Check if the file uses the old API
  if (content.includes('getCLS(') || content.includes('getFID(')) {
    console.log('\n⚠️  File uses old web-vitals API calls')
  }

  // Look for usage patterns
  const lines = content.split('\n')
  console.log('\n🔍 Checking for usage patterns:')
  lines.forEach((line, index) => {
    if (line.includes('getCLS') || line.includes('getFID') || line.includes('getLCP')) {
      console.log(`Line ${index + 1}: ${line.trim()}`)
    }
  })

} else {
  console.log('❌ performanceMonitor.js not found at expected location:', perfMonitorPath)
}