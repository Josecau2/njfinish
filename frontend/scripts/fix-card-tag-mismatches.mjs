#!/usr/bin/env node
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')
const srcDir = path.join(root, 'src')

// This script scans JSX files and fixes cases where a closing </Card> appears
// but the most recent unmatched opener was <StandardCard>, and vice versa.
// It does a simple stack-based tag alignment for Card|StandardCard only.

const OPEN_TAG_RE = /<(StandardCard|Card)(\s+[^>]*)?>/g
const CLOSE_TAG_RE = /<\/(StandardCard|Card)\s*>/g

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* walk(full)
    } else if (entry.isFile() && (full.endsWith('.jsx') || full.endsWith('.tsx'))) {
      yield full
    }
  }
}

function fixTags(content) {
  // Tokenize by tags and text
  const tokens = []
  let idx = 0
  const TAG_RE = /<\/?(?:StandardCard|Card)(?:\s+[^>]*)?>/g
  let m
  while ((m = TAG_RE.exec(content))) {
    if (m.index > idx) tokens.push({ type: 'text', value: content.slice(idx, m.index) })
    const tag = m[0]
    const isClose = tag.startsWith('</')
    const name = tag.replace(/[<>/\s].*$/g, '').replace(/^</, '').replace(/>$/, '')
    const tagName = isClose ? tag.match(/<\/(StandardCard|Card)/)[1] : tag.match(/<(StandardCard|Card)/)[1]
    tokens.push({ type: 'tag', close: isClose, name: tagName, raw: tag })
    idx = TAG_RE.lastIndex
  }
  if (idx < content.length) tokens.push({ type: 'text', value: content.slice(idx) })

  // Align tags
  const stack = [] // holds names of open tags
  const out = []
  for (const t of tokens) {
    if (t.type === 'text') {
      out.push(t.value)
      continue
    }
    if (!t.close) {
      stack.push(t.name) // push opener
      out.push(t.raw)
    } else {
      const last = stack.pop()
      if (!last) {
        // no opener; keep as-is
        out.push(t.raw)
      } else if (last !== t.name) {
        // mismatch -> replace closing tag to match last opener
        out.push(`</${last}>`)
      } else {
        out.push(t.raw)
      }
    }
  }
  return out.join('')
}

async function processFile(file) {
  const before = await fs.readFile(file, 'utf8')
  if (!/(<\/?StandardCard|<\/?Card)/.test(before)) return false
  const after = fixTags(before)
  if (after !== before) {
    await fs.writeFile(file, after, 'utf8')
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
      console.error('Error processing', file, e)
    }
  }
  console.log(`Tag fixer updated ${changed.length} files.`)
  changed.forEach((f) => console.log(' -', path.relative(root, f)))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
