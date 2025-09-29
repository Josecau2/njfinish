#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const sourceDir = './frontend/src';

// Function to fix final JSX structural issues
function fixFinalJSXStructures(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    const originalContent = content;

    // 1. Fix duplicate return statements and extra closing parentheses
    content = content.replace(/(\s*\)\s*\n\s*\)\s*\n)/gm, '\n  )\n');

    // 2. Fix missing return statement wrapping
    content = content.replace(/(return\s*\(\s*\n)(.*?)(\n\s*\}\s*\n)/gms, (match, returnStmt, jsxContent, ending) => {
      // Count opening and closing parentheses in JSX content
      const openParens = (jsxContent.match(/\(/g) || []).length;
      const closeParens = (jsxContent.match(/\)/g) || []).length;

      if (openParens > closeParens) {
        // Missing closing parenthesis
        return returnStmt + jsxContent + '\n  )' + ending;
      } else if (closeParens > openParens) {
        // Extra closing parenthesis - remove it
        const lastCloseParenIndex = jsxContent.lastIndexOf(')');
        if (lastCloseParenIndex !== -1) {
          jsxContent = jsxContent.substring(0, lastCloseParenIndex) + jsxContent.substring(lastCloseParenIndex + 1);
        }
        return returnStmt + jsxContent + '\n  )' + ending;
      }
      return match;
    });

    // 3. Fix extra div closings and orphaned JSX structures
    content = content.replace(/(\s*\}\s*\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*export default)/gm, '$1');
    content = content.replace(/(\s*\}\s*\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*export default)/gm, '$1');
    content = content.replace(/(\s*\}\s*\n\s*<\/div>\s*\n\s*export default)/gm, '$1');

    // 4. Fix cases where export default is in the wrong place
    content = content.replace(/(\s*<\/div>\s*\n\s*export default\s+\w+)/gm, (match, exportLine) => {
      return '\n  )\n}\n\n' + exportLine.trim();
    });

    // 5. Fix mismatched JSX tags - common patterns
    const lines = content.split('\n');
    const fixedLines = [];
    const tagStack = [];
    let inJSXContext = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect JSX context
      if (line.includes('return (') || line.includes('return(')) {
        inJSXContext = true;
      }

      if (inJSXContext) {
        // Track opening tags
        const openingMatches = line.matchAll(/<(\w+)(?:\s[^>]*)?(?<!\/)\s*>/g);
        for (const match of openingMatches) {
          const tagName = match[1];
          if (!['img', 'input', 'br', 'hr', 'meta', 'link'].includes(tagName.toLowerCase())) {
            tagStack.push(tagName);
          }
        }

        // Track self-closing tags (remove from consideration)
        const selfClosingMatches = line.matchAll(/<(\w+)(?:\s[^>]*)?\/>/g);
        for (const match of selfClosingMatches) {
          // These don't need closing tags
        }

        // Track closing tags
        const closingMatches = line.matchAll(/<\/(\w+)>/g);
        for (const match of closingMatches) {
          const tagName = match[1];
          // Remove matching opening tag from stack (LIFO)
          for (let j = tagStack.length - 1; j >= 0; j--) {
            if (tagStack[j] === tagName) {
              tagStack.splice(j, 1);
              break;
            }
          }
        }

        // Check if we're exiting JSX context
        if (line.trim() === '}') {
          inJSXContext = false;
        }
      }

      fixedLines.push(line);
    }

    // Add missing closing tags before the function ends
    if (tagStack.length > 0) {
      for (let i = fixedLines.length - 1; i >= 0; i--) {
        const line = fixedLines[i];
        if (line.trim() === '}' || line.includes('export default')) {
          // Insert missing closing tags before this line
          for (let j = tagStack.length - 1; j >= 0; j--) {
            const tagName = tagStack[j];
            const indentation = '    '.repeat(j);
            fixedLines.splice(i, 0, `${indentation}</${tagName}>`);
          }
          break;
        }
      }
      changed = true;
    }

    content = fixedLines.join('\n');

    // 6. Fix specific problematic patterns

    // Fix Modal structures with incorrect onClose props
    content = content.replace(
      /(onClose=\{[^}]*\})\s*\n\s*<ModalOverlay>([^}]*)\}/gm,
      '$1\n        size="sm"\n        isCentered\n      >\n        <ModalOverlay>\n          <ModalContent>\n$2'
    );

    // Fix broken ModalOverlay structures
    content = content.replace(
      /<ModalOverlay>([^<]*)<\/?\w+>/gm,
      '<ModalOverlay>\n          <ModalContent>$1'
    );

    // 7. Clean up duplicate or malformed JSX structures
    content = content.replace(/(\s*\)\s*\n\s*\)\s*\n\s*\}\s*\n)/gm, '\n  )\n}\n');
    content = content.replace(/(\s*\)\s*\n\s*\)\s*\n)/gm, '\n  )\n');

    // 8. Fix cases where there are orphaned JSX elements after function closing
    content = content.replace(/(\}\s*\n\s*export default \w+\s*\n)([\s\S]*?)(<\/\w+>[\s\S]*)/gm, '$1');

    // Write the fixed content if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      changed = true;
    }

    return changed;

  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Function to fix all files with structural JSX issues
function fixAllFinalJSXStructures() {
  const patterns = [
    `${sourceDir}/**/*.jsx`,
    `${sourceDir}/**/*.tsx`
  ];

  let totalFixed = 0;
  const failedFiles = [];

  console.log('🔧 Fixing final JSX structural issues...\n');

  for (const pattern of patterns) {
    const files = glob.sync(pattern);

    console.log(`📁 Processing ${files.length} files matching ${pattern}...`);

    for (const file of files) {
      try {
        const wasFixed = fixFinalJSXStructures(file);
        if (wasFixed) {
          console.log(`✅ Fixed structural issues: ${file}`);
          totalFixed++;
        }
      } catch (error) {
        failedFiles.push({ file, error: error.message });
        console.error(`❌ Failed to fix: ${file} - ${error.message}`);
      }
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Successfully fixed: ${totalFixed} files`);
  if (failedFiles.length > 0) {
    console.log(`   ❌ Failed to fix: ${failedFiles.length} files`);
    failedFiles.forEach(({ file, error }) => {
      console.log(`      ${file}: ${error}`);
    });
  }
}

// Run the final fix process
if (require.main === module) {
  console.log('🛠️  Final JSX Structure Fixer Starting...\n');
  fixAllFinalJSXStructures();
  console.log('\n✨ Final JSX Structure Fixes Complete!');
}

module.exports = { fixFinalJSXStructures, fixAllFinalJSXStructures };