#!/usr/bin/env node
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

  // Fix broken arrow functions: () = > to () =>
  content = content.replace(/\(\s*\)\s*=\s*>/g, '() =>');
  content = content.replace(/\(([^)]+)\)\s*=\s*>/g, '($1) =>');

  if (content !== original) {
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed: ${file}`);
    fixCount++;
  }
}

console.log(`\nFixed ${fixCount} files`);
