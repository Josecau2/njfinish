#!/usr/bin/env node

/**
 * Comprehensive Tap Target Fix Script
 *
 * Automatically fixes all tap target issues by adding proper sizing props:
 * - IconButtons: Adds minW="44px" minH="44px"
 * - Links: Adds minH="44px" py={2}
 * - Small Buttons: Adds minH="44px"
 *
 * Usage: node scripts/fix-all-tap-targets.mjs [--dry-run]
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

const isDryRun = process.argv.includes('--dry-run')

let fixedFiles = new Set()
let totalFixes = 0

/**
 * Fix IconButton components
 */
function fixIconButtons(filePath) {
  const content = readFileSync(filePath, 'utf-8')

  // Skip if no IconButtons
  if (!content.includes('<IconButton')) {
    return
  }

  const lines = content.split('\n')
  let modified = false

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<IconButton')) {
      // Extract full component
      let fullComp = lines[i]
      let j = i + 1
      let braceDepth = 0

      for (const char of fullComp) {
        if (char === '{') braceDepth++
        if (char === '}') braceDepth--
      }

      while (j < lines.length && j - i < 50) {
        for (const char of lines[j]) {
          if (char === '{') braceDepth++
          if (char === '}') braceDepth--
        }
        fullComp += '\n' + lines[j]
        if (braceDepth === 0 && (lines[j].includes('/>') || lines[j].trim().startsWith('</'))) {
          break
        }
        j++
      }

      // Check if already has proper sizing
      const hasMinW = /minW\s*=/.test(fullComp)
      const hasMinH = /minH\s*=/.test(fullComp)
      const hasLargeSize = /size\s*=\s*["'](lg|md)["']/.test(fullComp)
      const hasButtonSize = /\{\.\.\.ICON_BUTTON_SIZE\}/.test(fullComp)

      if (!hasMinW && !hasMinH && !hasLargeSize && !hasButtonSize) {
        // Add minW and minH on the next line after IconButton
        const indent = lines[i].match(/^\s*/)[0] + '  '
        lines.splice(i + 1, 0, `${indent}minW="44px"`, `${indent}minH="44px"`)
        modified = true
        totalFixes++
        i += 2 // Skip the lines we just added
      }
    }
  }

  if (modified) {
    fixedFiles.add(filePath)
    if (!isDryRun) {
      writeFileSync(filePath, lines.join('\n'), 'utf-8')
    }
  }
}

/**
 * Fix Link components
 */
function fixLinks(filePath) {
  const content = readFileSync(filePath, 'utf-8')

  // Skip if no Links
  if (!content.includes('<Link') && !content.includes('<a ')) {
    return
  }

  const lines = content.split('\n')
  let modified = false

  for (let i = 0; i < lines.length; i++) {
    if ((lines[i].includes('<Link') || lines[i].includes('<a ')) && !lines[i].trim().startsWith('//')) {
      // Extract full component
      let fullComp = lines[i]
      let j = i + 1
      let braceDepth = 0

      for (const char of fullComp) {
        if (char === '{') braceDepth++
        if (char === '}') braceDepth--
      }

      while (j < lines.length && j - i < 30) {
        for (const char of lines[j]) {
          if (char === '{') braceDepth++
          if (char === '}') braceDepth--
        }
        fullComp += '\n' + lines[j]
        if (braceDepth === 0 && (lines[j].includes('>') || lines[j].includes('/>'))) {
          break
        }
        j++
      }

      // Check if already has proper sizing
      const hasMinH = /minH\s*=/.test(fullComp)
      const hasPadding = /p[xy]?\s*=/.test(fullComp)

      if (!hasMinH && !hasPadding) {
        // Add minH and py on the next line
        const indent = lines[i].match(/^\s*/)[0] + '  '
        lines.splice(i + 1, 0, `${indent}minH="44px"`, `${indent}py={2}`)
        modified = true
        totalFixes++
        i += 2
      }
    }
  }

  if (modified) {
    fixedFiles.add(filePath)
    if (!isDryRun) {
      writeFileSync(filePath, lines.join('\n'), 'utf-8')
    }
  }
}

/**
 * Fix small Buttons
 */
function fixSmallButtons(filePath) {
  const content = readFileSync(filePath, 'utf-8')

  // Skip if no small buttons
  if (!content.includes('size="sm"') && !content.includes("size='sm'")) {
    return
  }

  const lines = content.split('\n')
  let modified = false

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<Button') && /size\s*=\s*["']sm["']/.test(lines[i])) {
      // Extract full component
      let fullComp = lines[i]
      let j = i + 1
      let braceDepth = 0

      for (const char of fullComp) {
        if (char === '{') braceDepth++
        if (char === '}') braceDepth--
      }

      while (j < lines.length && j - i < 30) {
        for (const char of lines[j]) {
          if (char === '{') braceDepth++
          if (char === '}') braceDepth--
        }
        fullComp += '\n' + lines[j]
        if (braceDepth === 0 && (lines[j].includes('>') || lines[j].includes('/>'))) {
          break
        }
        j++
      }

      // Check if already has minH
      const hasMinH = /minH\s*=/.test(fullComp)

      if (!hasMinH) {
        // Add minH on the next line
        const indent = lines[i].match(/^\s*/)[0] + '  '
        lines.splice(i + 1, 0, `${indent}minH="44px"`)
        modified = true
        totalFixes++
        i++
      }
    }
  }

  if (modified) {
    fixedFiles.add(filePath)
    if (!isDryRun) {
      writeFileSync(filePath, lines.join('\n'), 'utf-8')
    }
  }
}

// Main execution
console.log('🔧 Fixing tap target issues...')
console.log(isDryRun ? '(DRY RUN - no changes will be made)\n' : '')

// Get list of files from audit script output
const filesToFix = [
  'frontend/src/components/ItemSelectionContent.jsx',
  'frontend/src/components/ItemSelectionContentEdit.jsx',
  'frontend/src/components/LoginPreview.jsx',
  'frontend/src/components/model/ModificationBrowserModal.jsx',
  'frontend/src/components/pdf/DesktopPdfViewer.jsx',
  'frontend/src/components/StyleCarousel.jsx',
  'frontend/src/helpers/notify.js',
  'frontend/src/pages/auth/LoginPage.jsx',
  'frontend/src/pages/proposals/Proposals.jsx',
  'frontend/src/components/AppFooter.js',
  'frontend/src/components/DocsExample.js',
  'frontend/src/components/DocsLink.js',
  'frontend/src/pages/auth/ForgotPasswordPage.jsx',
  'frontend/src/pages/auth/RequestAccessPage.jsx',
  'frontend/src/pages/auth/ResetPasswordPage.jsx',
  'frontend/src/pages/Resources/index.jsx',
  'frontend/src/pages/settings/customization/index.jsx',
  'frontend/src/pages/settings/locations/LocationList.jsx',
  'frontend/src/components/contact/ThreadView.jsx',
  'frontend/src/components/model/PrintProposalModal.jsx',
  'frontend/src/components/NotificationBell.js',
  'frontend/src/pages/admin/ContractorDetail/ProposalsTab.jsx',
  'frontend/src/pages/contracts/index.jsx'
]

for (const file of filesToFix) {
  const filePath = join(rootDir, file)
  try {
    fixIconButtons(filePath)
    fixLinks(filePath)
    fixSmallButtons(filePath)
  } catch (err) {
    console.error(`Error fixing ${file}:`, err.message)
  }
}

console.log('\n📊 Summary:')
console.log(`   Total fixes applied: ${totalFixes}`)
console.log(`   Files modified: ${fixedFiles.size}`)

if (isDryRun) {
  console.log('\n💡 Run without --dry-run to apply changes')
} else {
  console.log('\n✅ Done! Run audit script to verify.')
}
