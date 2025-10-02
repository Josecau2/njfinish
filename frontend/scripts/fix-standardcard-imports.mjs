#!/usr/bin/env node
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const root = path.resolve(__dirname, '..')
const srcDir = path.join(root, 'src')

// Heuristics:
// 1) Find files that import StandardCard from @chakra-ui/react and rewrite
//    to import StandardCard from components/StandardCard with the correct relative path.
// 2) Preserve other Chakra imports.
// 3) If a file already imports from components/StandardCard, ensure it includes StandardCard default import.

/**
 * Compute relative import path to components/StandardCard from a file
 */
function getStandardCardImport(fromFile) {
  const rel = path.relative(path.dirname(fromFile), path.join(srcDir, 'components', 'StandardCard'))
  let relPath = rel.replace(/\\/g, '/')
  if (!relPath.startsWith('.')) relPath = './' + relPath
  return relPath
}

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* walk(full)
    } else if (entry.isFile() && (full.endsWith('.jsx') || full.endsWith('.tsx') || full.endsWith('.js') || full.endsWith('.ts'))) {
      yield full
    }
  }
}

function rewriteChakraImport(line) {
  // Matches: import { ..., StandardCard, ... } from '@chakra-ui/react'
  // Captures the full import list before and after StandardCard to reconstruct.
  const chakraRe = /import\s*\{([^}]*)\}\s*from\s*['"]@chakra-ui\/react['"]/g
  let m
  let replaced = line
  while ((m = chakraRe.exec(line))) {
    const list = m[1]
    if (!/\bStandardCard\b/.test(list)) continue
    // Remove StandardCard from list, also clean redundant commas and spaces
    let newList = list
      .replace(/\bStandardCard\b\s*,?/g, '')     // remove with trailing comma
      .replace(/,\s*,/g, ', ')                    // collapse double commas
      .replace(/^\s*,\s*/g, '')                  // leading comma
      .replace(/\s*,\s*$/g, '')                  // trailing comma
      .replace(/\s{2,}/g, ' ')                    // extra spaces
    if (newList.trim().length === 0) {
      // If nothing left, drop the entire import
      replaced = replaced.replace(m[0], '')
    } else {
      const newImport = `import { ${newList.trim()} } from '@chakra-ui/react'`
      replaced = replaced.replace(m[0], newImport)
    }
  }
  return replaced
}

function ensureStandardCardLocalImport(contents, filePath) {
  const stdPath = getStandardCardImport(filePath)
  const hasLocal = /(from\s*['"])\.?\.\/.*components\/StandardCard(\1|['"])|from\s*['"][^'"]*components\/StandardCard['"]/g.test(contents)
  const hasDefaultStd = /import\s+StandardCard\s*(,|from)/.test(contents)
  if (hasLocal && hasDefaultStd) return contents // already good

  if (hasLocal && !hasDefaultStd) {
    // Convert existing named import to default, or add a new default import line
    // Easiest: append a default import
    return `import StandardCard from '${stdPath}'\n` + contents
  }

  // No local import at all: add one at top, after any "use client" or comment header
  const lines = contents.split(/\r?\n/)
  let insertIdx = 0
  while (insertIdx < lines.length) {
    const l = lines[insertIdx]
    if (/^\s*['\"]use client['\"];?\s*$/.test(l) || /^\s*\/\//.test(l) || /^\s*\/\*/.test(l)) {
      insertIdx++
    } else {
      break
    }
  }
  lines.splice(insertIdx, 0, `import StandardCard from '${stdPath}'`)
  return lines.join('\n')
}

async function processFile(file) {
  let contents = await fs.readFile(file, 'utf8')
  if (!/StandardCard/.test(contents)) return null

  const before = contents
  // 1) Remove StandardCard from Chakra import braces
  contents = contents.split('\n').map((line) => rewriteChakraImport(line)).join('\n')
  // 2) Ensure local import exists
  contents = ensureStandardCardLocalImport(contents, file)

  if (contents !== before) {
    await fs.writeFile(file, contents, 'utf8')
    return true
  }
  return false
}

async function main() {
  const changed = []
  for await (const file of walk(srcDir)) {
    try {
      const did = await processFile(file)
      if (did) changed.push(file)
    } catch (e) {
      console.error('Error processing', file, e.message)
    }
  }
  console.log(`Updated ${changed.length} files.`)
  changed.forEach((f) => console.log(' -', path.relative(root, f)))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
