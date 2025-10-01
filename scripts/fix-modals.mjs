#!/usr/bin/env node
/**
 * Safe Modal Fix Script
 * Adds scrollBehavior="inside" to Modal components that don't have it
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

console.log(`🔧 Fixing modals in ${filesToFix.length} files...\n`);

for (const filePath of filesToFix) {
  const fullPath = path.join(root, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  const originalContent = content;

  // Fix: Add scrollBehavior="inside" to Modal components that don't have it
  // Only match modals on a single line
  const modalSingleLineRegex = /<Modal\s+([^>]*?)>/g;

  content = content.replace(modalSingleLineRegex, (match, props) => {
    // Skip if already has scrollBehavior
    if (props.includes('scrollBehavior')) {
      return match;
    }
    // Skip if it's likely multiline (has newline)
    if (match.includes('\n')) {
      return match;
    }
    modified = true;
    fixCount++;
    return `<Modal ${props} scrollBehavior="inside">`;
  });

  // Only write if modified
  if (modified && content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed: ${filePath}`);
  }
}

console.log(`\n✅ Completed! Fixed ${fixCount} modal instances.\n`);
