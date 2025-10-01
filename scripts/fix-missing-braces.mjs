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

  // Fix missing closing braces in style objects
  // Pattern: style={{ ... \n      > should be style={{ ... }} \n      >
  content = content.replace(/style=\{\{([^}]+)\n\s+>/g, (match, styleContent) => {
    return `style={{ ${styleContent.trim()} }}\n      >`;
  });

  // Fix missing closing braces in sx objects
  content = content.replace(/sx=\{\{([^}]+)\n\s+>/g, (match, sxContent) => {
    return `sx={{ ${sxContent.trim()} }}\n      >`;
  });

  // Fix double closing braces: }} }} -> }}
  content = content.replace(/}}\s*}}\s*$/gm, '}}');

  // Fix orphaned >  after incomplete objects
  content = content.replace(/,\s*\n\s+>\s*$/gm, '\n        }}\n      >');

  if (content !== original) {
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed: ${file}`);
    fixCount++;
  }
}

console.log(`\n✅ Fixed ${fixCount} files with missing braces`);
