#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const sourceDir = './frontend/src';

// Function to fix all JSX issues in a file
function fixAllJSXIssues(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    let originalContent = content;

    // 1. Fix duplicate imports
    const lines = content.split('\n');
    const imports = new Map();
    const otherLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('import ') && line.includes('from ')) {
        const match = line.match(/^import\s+(.+?)\s+from\s+['"](.+?)['"].*$/);
        if (match) {
          const [, importedItems, source] = match;

          if (importedItems.startsWith('{') && importedItems.endsWith('}')) {
            const items = importedItems
              .slice(1, -1)
              .split(',')
              .map(item => item.trim())
              .filter(item => item.length > 0);

            if (imports.has(source)) {
              const existing = imports.get(source);
              if (existing.type === 'named') {
                const combined = [...new Set([...existing.items, ...items])];
                imports.set(source, { type: 'named', items: combined });
                changed = true;
              } else {
                otherLines.push(lines[i]);
              }
            } else {
              imports.set(source, { type: 'named', items });
            }
          } else {
            if (imports.has(source) && imports.get(source).type === 'other') {
              changed = true;
            } else if (!imports.has(source)) {
              imports.set(source, { type: 'other', line: lines[i] });
            } else {
              otherLines.push(lines[i]);
            }
          }
        } else {
          otherLines.push(lines[i]);
        }
      } else {
        otherLines.push(lines[i]);
      }
    }

    if (changed) {
      const newLines = [];
      for (const [source, info] of imports) {
        if (info.type === 'named') {
          newLines.push(`import { ${info.items.join(', ')} } from '${source}'`);
        } else {
          newLines.push(info.line);
        }
      }

      let foundFirstNonImport = false;
      for (const line of otherLines) {
        if (!foundFirstNonImport && line.trim() && !line.trim().startsWith('import ')) {
          foundFirstNonImport = true;
        }
        if (foundFirstNonImport || !line.trim() || line.trim().startsWith('//') || line.trim().startsWith('/*')) {
          newLines.push(line);
        }
      }

      content = newLines.join('\n');
    }

    // 2. Fix malformed import statements (missing import keyword)
    content = content.replace(/^(\s*)([\w,\s{}]+)\s*\}\s*from\s+['"][^'"]*['"].*$/gm, (match, indent, items) => {
      if (!match.includes('import')) {
        return `${indent}import {\n${indent}  ${items.split(',').map(item => item.trim()).join(',\n' + indent + '  ')}\n${indent}} from`;
      }
      return match;
    });

    // 3. Fix Modal structures
    // Fix patterns like: <Modal ...> content </Modal> to include ModalOverlay/ModalContent
    content = content.replace(
      /<Modal([^>]*)>\s*(?!<ModalOverlay)([^]*?)<\/Modal>/g,
      (match, modalAttrs, modalContent) => {
        if (!modalContent.includes('<ModalOverlay') || !modalContent.includes('<ModalContent>')) {
          changed = true;
          return `<Modal${modalAttrs}>
        <ModalOverlay />
        <ModalContent>
${modalContent.trim()}
        </ModalContent>
      </Modal>`;
        }
        return match;
      }
    );

    // 4. Fix corrupted Modal headers and bodies
    content = content.replace(
      /(<ModalHeader[^>]*>)\s*<ModalOverlay\s*\/>\s*<ModalContent[^>]*>([^<]*)<\/ModalHeader>/g,
      '$1$2</ModalHeader>'
    );

    content = content.replace(
      /(<ModalBody[^>]*>)\s*<ModalOverlay\s*\/>\s*<ModalContent[^>]*>([^<]*)<\/ModalBody>/g,
      '$1$2</ModalBody>'
    );

    // 5. Remove orphaned ModalOverlay/ModalContent pairs
    content = content.replace(/\s*<ModalOverlay\s*\/>\s*<ModalContent[^>]*>/g, '');

    // 6. Remove duplicate ModalContent closing tags
    content = content.replace(/(<\/ModalContent>\s*)<\/ModalContent>/g, '$1');

    // 7. Fix broken onClose handlers in Modals
    content = content.replace(
      /(<Modal[^>]*onClose=\{[^}]*)\s*<ModalOverlay\s*\/>\s*<ModalContent[^>]*>([^}]*)\}/g,
      '$1$2}'
    );

    // 8. Fix visible prop to isOpen prop in Modals
    content = content.replace(/(<Modal[^>]*)\bvisible=/g, '$1isOpen=');

    // 9. Fix duplicate closing tags
    content = content.replace(/(<\/\w+>)\s*\1/g, '$1');

    // 10. Fix broken JSX attributes
    content = content.replace(/(\w+)=\{([^}]*)\s*<ModalOverlay[^>]*>[^}]*\}/g, '$1={$2}');

    // 11. Clean up any remaining malformed JSX
    content = content.replace(/\s*<ModalOverlay\s*\/>\s*<ModalContent[^>]*>\s*(?=[A-Z])/g, '');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
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
      const fixed = fixAllJSXIssues(file);
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
  console.log('Fixing all JSX issues...');
  fixAllFiles();
  console.log('Done!');
}

module.exports = { fixAllJSXIssues, fixAllFiles };