#!/usr/bin/env node
/**
 * Safe Spacing Standardization Script
 * Standardizes spacing values to playbook standards
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

console.log(`🔧 Fixing spacing in ${filesToFix.length} files...\n`);

for (const filePath of filesToFix) {
  const fullPath = path.join(root, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  const originalContent = content;

  // Fix spacing={1} or spacing={2} or spacing={3} -> spacing={4}
  // Avoid spacing={10} or higher as those might be intentional
  content = content.replace(
    /(\s+spacing)=\{([123])\}/g,
    (match, prop, value) => {
      modified = true;
      fixCount++;
      return `${prop}={4}`;
    }
  );

  // Fix gap={1} or gap={2} or gap={3} -> gap={4}
  content = content.replace(
    /(\s+gap)=\{([123])\}/g,
    (match, prop, value) => {
      modified = true;
      fixCount++;
      return `${prop}={4}`;
    }
  );

  // Fix gap={5} -> gap={6} (for grids)
  // Only do this for SimpleGrid components
  content = content.replace(
    /(<SimpleGrid[^>]*\s+)gap=\{5\}/g,
    (match, before) => {
      modified = true;
      fixCount++;
      return `${before}gap={6}`;
    }
  );

  // Fix spacing={5} -> spacing={6} (for grids)
  // Only do this for SimpleGrid components
  content = content.replace(
    /(<SimpleGrid[^>]*\s+)spacing=\{5\}/g,
    (match, before) => {
      modified = true;
      fixCount++;
      return `${before}spacing={6}`;
    }
  );

  // Only write if modified
  if (modified && content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed: ${filePath}`);
  }
}

console.log(`\n✅ Completed! Fixed ${fixCount} spacing instances.\n`);
