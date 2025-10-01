#!/usr/bin/env node
/**
 * Comprehensive syntax error fix script
 * Fixes all broken JSX syntax from revert script
 */

import fg from 'fast-glob';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const files = await fg(['frontend/src/**/*.{jsx,tsx}'], { cwd: root });

let fixCount = 0;

for (const file of files) {
  const fullPath = path.join(root, file);
  let content = fs.readFileSync(fullPath, 'utf8');
  const original = content;

  // Fix 1: Broken style={{ with missing opening brace
  content = content.replace(/style={{\s*([^{}:]+):\s*([^,}]+),/g, 'style={{ $1: $2,');

  // Fix 2: Broken props with extra closing braces and commas
  content = content.replace(/bg='([^']+)',\s*([^:=]+):\s*'([^']+)'\s*}}/g, "bg='$1' $2='$3'");
  content = content.replace(/bg="([^"]+)",\s*([^:=]+):\s*"([^"]+)"\s*}}/g, 'bg="$1" $2="$3"');

  // Fix 3: Broken JSX attributes with commas instead of spaces
  content = content.replace(/(\w+)=['"]([^'"]+)['"],\s*(\w+):/g, "$1='$2' $3:");

  // Fix 4: Remove orphaned style={{ without proper structure
  content = content.replace(/\s+style={{\s*}}/g, '');

  // Fix 5: Fix broken Container/Box props
  content = content.replace(/\n\s+\n\s+bg=/g, '\n      bg=');

  // Fix 6: Fix broken FormControl props
  content = content.replace(/<FormControl\s+p,\s*/g, '<FormControl ');

  // Fix 7: Fix orphaned closing braces on attribute lines
  content = content.replace(/^\s*}}\s*$/gm, '');

  if (content !== original) {
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed: ${file}`);
    fixCount++;
  }
}

console.log(`\n✅ Fixed ${fixCount} files with syntax errors`);
