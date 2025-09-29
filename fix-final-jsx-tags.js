#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const sourceDir = './frontend/src';

// Function to fix specific JSX tag mismatches
function fixFinalJSXTags(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Fix missing closing tags by analyzing tag balance
    const lines = content.split('\n');
    const tagStack = [];
    let inJSXContext = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect JSX context
      if (line.includes('return (') || line.includes('return(')) {
        inJSXContext = true;
      }

      if (inJSXContext) {
        // Find opening tags
        const openingTags = line.match(/<(\w+)(?:\s[^>]*)?>(?![^<]*<\/\1>)/g);
        if (openingTags) {
          openingTags.forEach(tag => {
            const tagName = tag.match(/<(\w+)/)[1];
            if (!tag.endsWith('/>') && !['img', 'input', 'br', 'hr', 'meta', 'link'].includes(tagName)) {
              tagStack.push({ tag: tagName, line: i });
            }
          });
        }

        // Find closing tags
        const closingTags = line.match(/<\/(\w+)>/g);
        if (closingTags) {
          closingTags.forEach(tag => {
            const tagName = tag.match(/<\/(\w+)>/)[1];
            // Pop matching opening tag
            for (let j = tagStack.length - 1; j >= 0; j--) {
              if (tagStack[j].tag === tagName) {
                tagStack.splice(j, 1);
                break;
              }
            }
          });
        }
      }
    }

    // If we have unclosed tags, try to fix common patterns
    if (tagStack.length > 0) {
      // Look for common pattern: missing closing div tags at end of file
      const lastLines = lines.slice(-10);
      const lastNonEmptyLine = lastLines.findIndex(line => line.trim() !== '');

      if (lastNonEmptyLine !== -1) {
        const insertIndex = lines.length - 1;

        // Add missing closing tags before the last return statement
        for (let i = tagStack.length - 1; i >= 0; i--) {
          const tag = tagStack[i].tag;
          const indentation = '    '.repeat(Math.max(0, tagStack.length - i - 1));
          lines.splice(insertIndex, 0, `${indentation}</${tag}>`);
          changed = true;
        }
      }
    }

    if (changed) {
      content = lines.join('\n');
    }

    // Additional specific fixes

    // Fix pattern: missing div closure before right panel
    content = content.replace(
      /(.*)<\/div>\s*\n\s*{\*\s*Right Panel\s*\*}/gm,
      '$1</div>\n      </div>\n\n      {/* Right Panel */'
    );

    // Fix pattern: missing final closing div
    content = content.replace(
      /(\s*)\}\s*\n\s*export default/gm,
      '$1      </div>\n    </div>\n  )\n}\n\nexport default'
    );

    if (content !== fs.readFileSync(filePath, 'utf8')) {
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
    `${sourceDir}/**/*.jsx`,
    `${sourceDir}/**/*.tsx`
  ];

  let totalFixed = 0;

  for (const pattern of patterns) {
    const files = glob.sync(pattern);

    console.log(`Checking ${files.length} files matching ${pattern}...`);

    for (const file of files) {
      const fixed = fixFinalJSXTags(file);
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
  console.log('Fixing final JSX tag issues...');
  fixAllFiles();
  console.log('Done!');
}

module.exports = { fixFinalJSXTags, fixAllFiles };