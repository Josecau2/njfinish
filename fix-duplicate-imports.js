#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const sourceDir = './frontend/src';

// Function to fix duplicate imports in a file
function fixDuplicateImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    const imports = new Map();
    const otherLines = [];
    let changed = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if line is an import statement
      if (line.startsWith('import ') && line.includes('from ')) {
        const match = line.match(/^import\s+(.+?)\s+from\s+['"](.+?)['"].*$/);
        if (match) {
          const [, importedItems, source] = match;

          // Handle different import formats
          if (importedItems.startsWith('{') && importedItems.endsWith('}')) {
            // Named imports like: import { A, B } from 'source'
            const items = importedItems
              .slice(1, -1) // remove { }
              .split(',')
              .map(item => item.trim())
              .filter(item => item.length > 0);

            if (imports.has(source)) {
              // Merge with existing imports from same source
              const existing = imports.get(source);
              if (existing.type === 'named') {
                // Combine named imports and remove duplicates
                const combined = [...new Set([...existing.items, ...items])];
                imports.set(source, { type: 'named', items: combined });
                changed = true;
              } else {
                // Keep as separate import if types don't match
                otherLines.push(lines[i]);
              }
            } else {
              imports.set(source, { type: 'named', items });
            }
          } else {
            // Default or other imports
            if (imports.has(source) && imports.get(source).type === 'other') {
              // Skip duplicate default/other imports
              changed = true;
            } else if (!imports.has(source)) {
              imports.set(source, { type: 'other', line: lines[i] });
            } else {
              // Keep as separate line if conflict
              otherLines.push(lines[i]);
            }
          }
        } else {
          // Malformed import, keep as is
          otherLines.push(lines[i]);
        }
      } else {
        // Not an import line
        otherLines.push(lines[i]);
      }
    }

    if (!changed) return false;

    // Reconstruct the file
    const newLines = [];

    // Add consolidated imports
    for (const [source, info] of imports) {
      if (info.type === 'named') {
        newLines.push(`import { ${info.items.join(', ')} } from '${source}'`);
      } else {
        newLines.push(info.line);
      }
    }

    // Add other lines (non-imports and malformed imports)
    let foundFirstNonImport = false;
    for (const line of otherLines) {
      if (!foundFirstNonImport && line.trim() && !line.trim().startsWith('import ')) {
        foundFirstNonImport = true;
      }
      if (foundFirstNonImport || !line.trim() || line.trim().startsWith('//') || line.trim().startsWith('/*')) {
        newLines.push(line);
      }
    }

    const newContent = newLines.join('\n');
    fs.writeFileSync(filePath, newContent, 'utf8');
    return true;

  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Function to scan and fix all files
function fixAllFiles() {
  const patterns = [
    `${sourceDir}/**/*.js`,
    `${sourceDir}/**/*.jsx`,
    `${sourceDir}/**/*.ts`,
    `${sourceDir}/**/*.tsx`
  ];

  let totalFixed = 0;

  for (const pattern of patterns) {
    const files = glob.sync(pattern);

    console.log(`Checking ${files.length} files matching ${pattern}...`);

    for (const file of files) {
      const fixed = fixDuplicateImports(file);
      if (fixed) {
        console.log(`Fixed: ${file}`);
        totalFixed++;
      }
    }
  }

  console.log(`\nTotal files fixed: ${totalFixed}`);
}

// Run the script
if (require.main === module) {
  console.log('Fixing duplicate imports...');
  fixAllFiles();
  console.log('Done!');
}

module.exports = { fixDuplicateImports, fixAllFiles };