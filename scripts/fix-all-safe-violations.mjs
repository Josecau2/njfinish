#!/usr/bin/env node
/**
 * Master Safe Violations Fix Script
 * Applies all safe automated fixes from playbook audit
 */

import fg from 'fast-glob';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

let fixCount = 0;
const fixes = {
  colors: 0,
  spacing: 0,
  inlineStyles: 0,
};

// Expanded color mapping
const colorMap = {
  '#f8f9fa': 'gray.50',
  '#f1f3f5': 'gray.50',
  '#e9ecef': 'gray.100',
  '#ede9fe': 'purple.50',
  '#dee2e6': 'gray.200',
  '#ced4da': 'gray.300',
  '#c4b5fd': 'purple.300',
  '#ccc': 'gray.300',
  '#cccccc': 'gray.300',
  '#adb5bd': 'gray.400',
  '#6c757d': 'gray.500',
  '#495057': 'gray.600',
  '#343a40': 'gray.700',
  '#3730a3': 'purple.700',
  '#212529': 'gray.800',
  '#ffffff': 'white',
  '#fff': 'white',
  '#000000': 'black',
  '#000': 'black',
  '#0d6efd': 'blue.500',
  '#0b5ed7': 'blue.600',
  '#1a73e8': 'blue.500',
  '#4f46e5': 'indigo.600',
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

console.log(`🔧 Applying safe fixes to ${filesToFix.length} files...\n`);

for (const filePath of filesToFix) {
  const fullPath = path.join(root, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  const originalContent = content;

  // Fix 1: Replace hex colors (in props and ternaries)
  for (const [hex, token] of Object.entries(colorMap)) {
    // Match prop="#hexcolor" or prop='#hexcolor'
    const propRegex = new RegExp(`(\\s+[a-zA-Z]+)(=)(["'])${hex}\\3`, 'gi');
    if (propRegex.test(content)) {
      content = content.replace(propRegex, `$1$2$3${token}$3`);
      modified = true;
      fixes.colors++;
    }

    // Match ? "#hexcolor" : in ternary expressions
    const ternaryRegex = new RegExp(`\\?\\s*["']${hex}["']\\s*:`, 'gi');
    if (ternaryRegex.test(content)) {
      content = content.replace(ternaryRegex, `? "${token}" :`);
      modified = true;
      fixes.colors++;
    }

    // Match : "#hexcolor" in ternary expressions
    const ternaryRegex2 = new RegExp(`:\\s*["']${hex}["']`, 'gi');
    if (ternaryRegex2.test(content)) {
      content = content.replace(ternaryRegex2, `: "${token}"`);
      modified = true;
      fixes.colors++;
    }

    // Match || "#hexcolor" (fallback values)
    const fallbackRegex = new RegExp(`\\|\\|\\s*["']${hex}["']`, 'gi');
    if (fallbackRegex.test(content)) {
      content = content.replace(fallbackRegex, `|| "${token}"`);
      modified = true;
      fixes.colors++;
    }

    // Match return "#hexcolor"
    const returnRegex = new RegExp(`return\\s+["']${hex}["']`, 'gi');
    if (returnRegex.test(content)) {
      content = content.replace(returnRegex, `return "${token}"`);
      modified = true;
      fixes.colors++;
    }
  }

  // Fix 2: Spacing standardization
  // spacing={1|2|3} -> spacing={4}
  content = content.replace(
    /(\s+spacing)=\{([123])\}/g,
    (match, prop, value) => {
      modified = true;
      fixes.spacing++;
      return `${prop}={4}`;
    }
  );

  // gap={1|2|3} -> gap={4}
  content = content.replace(
    /(\s+gap)=\{([123])\}/g,
    (match, prop, value) => {
      modified = true;
      fixes.spacing++;
      return `${prop}={4}`;
    }
  );

  // Fix 3: Simple inline styles to Chakra props
  // style={{ width: 'XXX' }} -> w="XXX"
  content = content.replace(
    /\s+style\s*=\s*{{\s*width:\s*['"]([^'"]+)['"]\s*}}/g,
    (match, value) => {
      modified = true;
      fixes.inlineStyles++;
      return ` w="${value}"`;
    }
  );

  // style={{ height: 'XXX' }} -> h="XXX"
  content = content.replace(
    /\s+style\s*=\s*{{\s*height:\s*['"]([^'"]+)['"]\s*}}/g,
    (match, value) => {
      modified = true;
      fixes.inlineStyles++;
      return ` h="${value}"`;
    }
  );

  // style={{ minHeight: 'XXX' }} -> minH="XXX"
  content = content.replace(
    /\s+style\s*=\s*{{\s*minHeight:\s*['"]([^'"]+)['"]\s*}}/g,
    (match, value) => {
      modified = true;
      fixes.inlineStyles++;
      return ` minH="${value}"`;
    }
  );

  // style={{ minWidth: 'XXX' }} -> minW="XXX"
  content = content.replace(
    /\s+style\s*=\s*{{\s*minWidth:\s*['"]([^'"]+)['"]\s*}}/g,
    (match, value) => {
      modified = true;
      fixes.inlineStyles++;
      return ` minW="${value}"`;
    }
  );

  // style={{ maxWidth: 'XXX' }} -> maxW="XXX"
  content = content.replace(
    /\s+style\s*=\s*{{\s*maxWidth:\s*['"]([^'"]+)['"]\s*}}/g,
    (match, value) => {
      modified = true;
      fixes.inlineStyles++;
      return ` maxW="${value}"`;
    }
  );

  // Only write if modified
  if (modified && content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed: ${filePath}`);
    fixCount++;
  }
}

console.log(`\n✅ Completed!\n`);
console.log(`📊 Summary:`);
console.log(`   Colors fixed: ${fixes.colors}`);
console.log(`   Spacing fixed: ${fixes.spacing}`);
console.log(`   Inline styles fixed: ${fixes.inlineStyles}`);
console.log(`   Files modified: ${fixCount}`);
console.log(`   Total fixes: ${fixes.colors + fixes.spacing + fixes.inlineStyles}\n`);
