#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const sourceDir = './frontend/src';

// Function to fix malformed import statements in a file
function fixImportSyntax(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let changed = false;
    let newLines = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Check if this line looks like a malformed import continuation
      if (line.trim() && !line.trim().startsWith('import ') &&
          !line.trim().startsWith('//') && !line.trim().startsWith('/*') &&
          !line.trim().startsWith('*') && !line.trim().startsWith('export') &&
          i > 0 && lines[i-1].trim().endsWith("'") &&
          line.includes(',') &&
          (line.includes('{') || /^\s*[A-Za-z]/.test(line))) {

        // Look back to find the previous import line
        let importStartIdx = i - 1;
        while (importStartIdx >= 0 && !lines[importStartIdx].trim().startsWith('import ')) {
          importStartIdx--;
        }

        if (importStartIdx >= 0) {
          // Check if we have orphaned named imports
          let endIdx = i;
          let braceCount = 0;
          let hasOpenBrace = false;

          // Count braces to find the end of the import
          for (let j = i; j < lines.length; j++) {
            const checkLine = lines[j];
            if (checkLine.includes('{')) {
              hasOpenBrace = true;
              braceCount += (checkLine.match(/\{/g) || []).length;
            }
            braceCount -= (checkLine.match(/\}/g) || []).length;

            if (braceCount <= 0 && hasOpenBrace && checkLine.includes('from ')) {
              endIdx = j;
              break;
            }
          }

          // Extract the import source
          let fromMatch = null;
          for (let j = endIdx; j >= i; j--) {
            const match = lines[j].match(/from\s+['"](.*?)['"].*$/);
            if (match) {
              fromMatch = match[1];
              break;
            }
          }

          if (fromMatch) {
            // Collect all import items
            let importItems = [];
            for (let j = i; j <= endIdx; j++) {
              const itemLine = lines[j].replace(/from\s+['"].*?['"].*$/, '').replace(/[{}]/g, '');
              if (itemLine.trim()) {
                importItems.push(...itemLine.split(',').map(item => item.trim()).filter(item => item));
              }
            }

            if (importItems.length > 0) {
              // Create proper import statement
              const newImport = `import {\n  ${importItems.join(',\n  ')}\n} from '${fromMatch}'`;
              newLines.push(newImport);
              changed = true;

              // Skip the processed lines
              i = endIdx + 1;
              continue;
            }
          }
        }
      }

      newLines.push(line);
      i++;
    }

    if (changed) {
      const newContent = newLines.join('\n');
      fs.writeFileSync(filePath, newContent, 'utf8');
      return true;
    }

    return false;

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
      const fixed = fixImportSyntax(file);
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
  console.log('Fixing import syntax issues...');
  fixAllFiles();
  console.log('Done!');
}

module.exports = { fixImportSyntax, fixAllFiles };