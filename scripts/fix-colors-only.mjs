#!/usr/bin/env node
/**
 * Safe Color Replacement Script
 * Only replaces hex colors with Chakra tokens - nothing else
 */

import fg from 'fast-glob';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

let fixCount = 0;

// Color mapping from hex to Chakra tokens
const colorMap = {
  '#f8f9fa': 'gray.50',
  '#f1f3f5': 'gray.50',
  '#e9ecef': 'gray.100',
  '#dee2e6': 'gray.200',
  '#ced4da': 'gray.300',
  '#adb5bd': 'gray.400',
  '#6c757d': 'gray.500',
  '#495057': 'gray.600',
  '#343a40': 'gray.700',
  '#212529': 'gray.800',
  '#ffffff': 'white',
  '#fff': 'white',
  '#000000': 'black',
  '#000': 'black',
  '#0d6efd': 'blue.500',
  '#0b5ed7': 'blue.600',
  '#1a73e8': 'blue.500',
  '#d0e6ff': 'blue.100',
  '#321fdb': 'blue.600',
  '#667eea': 'purple.500',
  '#0e1446': 'gray.900',
  '#0f172a': 'gray.900',
  '#2d3748': 'gray.700',
  '#198754': 'green.500',
  '#dc3545': 'red.500',
  '#bb2d3b': 'red.600',
  '#ef4444': 'red.500',
  '#dc2626': 'red.600',
  '#ffc107': 'yellow.400',
  '#20c997': 'teal.400',
  '#0dcaf0': 'cyan.400',
};

// Files to fix
const filesToFix = await fg([
  'frontend/src/**/*.{jsx,tsx}',
  '!frontend/src/**/*.test.{jsx,tsx}',
  '!frontend/src/**/*.spec.{jsx,tsx}',
], { cwd: root });

console.log(`🔧 Fixing colors in ${filesToFix.length} files...\n`);

for (const filePath of filesToFix) {
  const fullPath = path.join(root, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  const originalContent = content;

  // Only fix hex colors in JSX prop values
  // Match patterns like: bg="#f8f9fa" or borderColor="#1a73e8"
  for (const [hex, token] of Object.entries(colorMap)) {
    // Match prop="#hexcolor"
    const propRegex = new RegExp(`(\\s+[a-zA-Z]+)="${hex}"`, 'gi');
    if (propRegex.test(content)) {
      content = content.replace(propRegex, `$1="${token}"`);
      modified = true;
      fixCount++;
    }

    // Match prop='#hexcolor'
    const propRegex2 = new RegExp(`(\\s+[a-zA-Z]+)='${hex}'`, 'gi');
    if (propRegex2.test(content)) {
      content = content.replace(propRegex2, `$1='${token}'`);
      modified = true;
      fixCount++;
    }

    // Match in template literals within props: bg={`#hexcolor`}
    const templateRegex = new RegExp(`\\\{\`${hex.replace('#', '\\#')}\`\\\}`, 'gi');
    if (templateRegex.test(content)) {
      content = content.replace(templateRegex, `{\`${token}\`}`);
      modified = true;
      fixCount++;
    }
  }

  // Only write if modified
  if (modified && content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed: ${filePath}`);
  }
}

console.log(`\n✅ Completed! Fixed ${fixCount} color instances.\n`);
