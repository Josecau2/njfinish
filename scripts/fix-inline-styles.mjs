#!/usr/bin/env node
/**
 * Safe Inline Style Converter
 * Converts simple inline styles to Chakra props
 */

import fg from 'fast-glob';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

let fixCount = 0;

// Files to fix
const filesToFix = await fg([
  'frontend/src/**/*.{jsx,tsx}',
  '!frontend/src/**/*.test.{jsx,tsx}',
  '!frontend/src/**/*.spec.{jsx,tsx}',
], { cwd: root });

console.log(`🔧 Fixing inline styles in ${filesToFix.length} files...\n`);

for (const filePath of filesToFix) {
  const fullPath = path.join(root, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  const originalContent = content;

  // Fix 1: style={{ width: 'XXX' }} -> w="XXX"
  content = content.replace(
    /\s+style\s*=\s*{{\s*width:\s*['"]([^'"]+)['"]\s*}}/g,
    (match, value) => {
      modified = true;
      fixCount++;
      return ` w="${value}"`;
    }
  );

  // Fix 2: style={{ height: 'XXX' }} -> h="XXX"
  content = content.replace(
    /\s+style\s*=\s*{{\s*height:\s*['"]([^'"]+)['"]\s*}}/g,
    (match, value) => {
      modified = true;
      fixCount++;
      return ` h="${value}"`;
    }
  );

  // Fix 3: style={{ minHeight: 'XXX' }} -> minH="XXX"
  content = content.replace(
    /\s+style\s*=\s*{{\s*minHeight:\s*['"]([^'"]+)['"]\s*}}/g,
    (match, value) => {
      modified = true;
      fixCount++;
      return ` minH="${value}"`;
    }
  );

  // Fix 4: style={{ minWidth: 'XXX' }} -> minW="XXX"
  content = content.replace(
    /\s+style\s*=\s*{{\s*minWidth:\s*['"]([^'"]+)['"]\s*}}/g,
    (match, value) => {
      modified = true;
      fixCount++;
      return ` minW="${value}"`;
    }
  );

  // Fix 5: style={{ maxWidth: 'XXX' }} -> maxW="XXX"
  content = content.replace(
    /\s+style\s*=\s*{{\s*maxWidth:\s*['"]([^'"]+)['"]\s*}}/g,
    (match, value) => {
      modified = true;
      fixCount++;
      return ` maxW="${value}"`;
    }
  );

  // Only write if modified
  if (modified && content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed: ${filePath}`);
  }
}

console.log(`\n✅ Completed! Fixed ${fixCount} inline style instances.\n`);
