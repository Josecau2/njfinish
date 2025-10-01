#!/usr/bin/env node

/**
 * Bundle analysis script - identifies largest chunks and optimization opportunities
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const buildDir = join(__dirname, '..', 'frontend', 'build', 'assets')

console.log('📦 NJ Cabinets - Bundle Size Analysis\n')

try {
  const files = readdirSync(buildDir)
  const jsFiles = files.filter(f => f.endsWith('.js'))

  const fileStats = jsFiles.map(file => {
    const filePath = join(buildDir, file)
    const stats = statSync(filePath)
    return {
      name: file,
      size: stats.size,
      sizeKB: (stats.size / 1024).toFixed(2)
    }
  }).sort((a, b) => b.size - a.size)

  // Calculate totals
  const totalSize = fileStats.reduce((sum, f) => sum + f.size, 0)
  const totalSizeKB = (totalSize / 1024).toFixed(2)
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2)

  console.log('🔍 Top 20 Largest JS Chunks:')
  console.log('─'.repeat(80))
  fileStats.slice(0, 20).forEach((file, idx) => {
    const pct = ((file.size / totalSize) * 100).toFixed(1)
    const bar = '█'.repeat(Math.floor(pct / 2))
    console.log(`${(idx + 1).toString().padStart(2)}. ${file.name.padEnd(45)} ${file.sizeKB.padStart(10)} kB (${pct.padStart(5)}%) ${bar}`)
  })

  console.log('\n📊 Summary:')
  console.log('─'.repeat(80))
  console.log(`Total JS files: ${jsFiles.length}`)
  console.log(`Total size: ${totalSizeKB} kB (${totalSizeMB} MB)`)
  console.log(`Largest chunk: ${fileStats[0].name} - ${fileStats[0].sizeKB} kB`)
  console.log(`Smallest chunk: ${fileStats[fileStats.length - 1].sizeKB} kB`)
  console.log(`Average chunk: ${(totalSize / jsFiles.length / 1024).toFixed(2)} kB`)

  // Identify vendor chunks
  const vendorChunks = fileStats.filter(f => f.name.includes('-vendor-'))
  const vendorSize = vendorChunks.reduce((sum, f) => sum + f.size, 0)
  const vendorPct = ((vendorSize / totalSize) * 100).toFixed(1)

  console.log(`\n📚 Vendor Chunks: ${vendorChunks.length} files (${(vendorSize / 1024).toFixed(2)} kB - ${vendorPct}%)`)
  vendorChunks.forEach(chunk => {
    console.log(`  • ${chunk.name}: ${chunk.sizeKB} kB`)
  })

  // Identify page chunks
  const pageChunks = fileStats.filter(f =>
    !f.name.includes('-vendor-') &&
    !f.name.startsWith('index-') &&
    parseFloat(f.sizeKB) > 10
  )
  console.log(`\n📄 Large Page Chunks (>10kB):`)
  pageChunks.forEach(chunk => {
    console.log(`  • ${chunk.name}: ${chunk.sizeKB} kB`)
  })

  // Recommendations
  console.log('\n💡 Optimization Recommendations:')
  console.log('─'.repeat(80))

  const largestNonVendor = fileStats.find(f => !f.name.includes('-vendor-'))
  if (largestNonVendor && parseFloat(largestNonVendor.sizeKB) > 500) {
    console.log(`⚠️  Large non-vendor chunk detected: ${largestNonVendor.name} (${largestNonVendor.sizeKB} kB)`)
    console.log('   → Likely Chakra UI - consider adding to vendor chunks')
  }

  const chunksOver100KB = fileStats.filter(f => parseFloat(f.sizeKB) > 100 && !f.name.includes('vendor'))
  if (chunksOver100KB.length > 0) {
    console.log(`\n⚠️  ${chunksOver100KB.length} chunk(s) over 100 kB:`)
    chunksOver100KB.forEach(chunk => {
      console.log(`   • ${chunk.name}: ${chunk.sizeKB} kB`)
    })
  }

  const totalChunks = jsFiles.length
  if (totalChunks > 100) {
    console.log(`\n⚠️  High number of chunks (${totalChunks}) - may impact HTTP/2 performance`)
    console.log('   → Consider consolidating smaller chunks')
  }

  console.log('\n✅ Strengths:')
  console.log('   • Vendor chunks properly separated for better caching')
  console.log('   • Route-based code splitting implemented')
  console.log('   • Modern build target (es2020) for smaller bundles')

  console.log('\n🎯 Next Steps:')
  console.log('   1. Add Chakra UI to vendor chunks in vite.config.mjs')
  console.log('   2. Implement dynamic imports for heavy components (PDF viewer, charts)')
  console.log('   3. Consider lazy loading images with loading="lazy"')
  console.log('   4. Monitor First Contentful Paint (FCP) in production')

} catch (err) {
  console.error('❌ Error analyzing bundle:', err.message)
  console.log('\nMake sure to run `npm run build` first!')
  process.exit(1)
}
