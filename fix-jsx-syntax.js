#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { diagnoseJSXIssues } = require('./diagnose-jsx-issues');

// Function to fix JSX syntax issues in a file
function fixJSXSyntax(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    const originalContent = content;

    // First, fix duplicate imports
    const lines = content.split('\n');
    const importMap = new Map();
    const cleanedLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim().startsWith('import')) {
        const fromMatch = line.match(/from\s+['"]([^'"]+)['"]/);
        if (fromMatch) {
          const source = fromMatch[1];

          if (importMap.has(source)) {
            // Merge with existing import
            const existingImport = importMap.get(source);
            const currentImports = line.match(/import\s+\{([^}]+)\}/);
            const existingImports = existingImport.match(/import\s+\{([^}]+)\}/);

            if (currentImports && existingImports) {
              const currentItems = currentImports[1].split(',').map(s => s.trim());
              const existingItems = existingImports[1].split(',').map(s => s.trim());
              const combined = [...new Set([...existingItems, ...currentItems])].sort();

              const newImport = `import { ${combined.join(', ')} } from '${source}'`;
              importMap.set(source, newImport);
              changed = true;
              continue; // Skip adding this duplicate line
            }
          } else {
            importMap.set(source, line);
          }
        }
      }

      cleanedLines.push(line);
    }

    // Rebuild content with cleaned imports if duplicates were found
    if (changed) {
      const importSection = [];
      const nonImportSection = [];
      let inImportSection = true;

      for (const line of cleanedLines) {
        if (line.trim().startsWith('import')) {
          if (inImportSection) {
            // Skip, we'll add consolidated imports
          } else {
            nonImportSection.push(line);
          }
        } else if (line.trim() === '') {
          if (inImportSection) {
            importSection.push(line);
          } else {
            nonImportSection.push(line);
          }
        } else {
          inImportSection = false;
          nonImportSection.push(line);
        }
      }

      // Add consolidated imports
      const consolidatedImports = Array.from(importMap.values()).sort();
      content = [...consolidatedImports, ...importSection, ...nonImportSection].join('\n');
    }

    // Now fix JSX tag issues
    const issues = diagnoseJSXIssues(filePath);
    const unclosedTags = issues.filter(issue => issue.type === 'unclosed_tag');

    if (unclosedTags.length > 0) {
      const contentLines = content.split('\n');

      // Sort unclosed tags by line number (descending) to add closing tags from bottom to top
      unclosedTags.sort((a, b) => b.line - a.line);

      for (const unclosedTag of unclosedTags) {
        // Find where to insert the closing tag
        let insertIndex = -1;
        let targetIndentation = unclosedTag.indentation;

        // Look for a good place to insert the closing tag
        // Start from the end of the file and work backwards
        for (let i = contentLines.length - 1; i >= unclosedTag.line; i--) {
          const line = contentLines[i].trim();
          const lineIndentation = (contentLines[i].match(/^\s*/)[0].length / 2) || 0;

          // Look for return statement, closing of function, or similar structure
          if (line === '}' && lineIndentation <= targetIndentation) {
            insertIndex = i;
            break;
          }
          if (line === ')' && lineIndentation <= targetIndentation) {
            insertIndex = i;
            break;
          }
          if (line.includes('export default') && i > unclosedTag.line) {
            insertIndex = i;
            break;
          }
        }

        // If no specific place found, add before the last meaningful line
        if (insertIndex === -1) {
          for (let i = contentLines.length - 1; i >= 0; i--) {
            if (contentLines[i].trim() !== '') {
              insertIndex = i;
              break;
            }
          }
        }

        if (insertIndex !== -1) {
          const indentationStr = '  '.repeat(targetIndentation);
          const closingTag = `${indentationStr}</${unclosedTag.tag}>`;
          contentLines.splice(insertIndex, 0, closingTag);
          changed = true;
        }
      }

      content = contentLines.join('\n');
    }

    // Fix common JSX patterns

    // 1. Fix broken Modal structures
    content = content.replace(
      /(Modal\s+isOpen=\{[^}]+\}[^>]*>)\s*(?!<ModalOverlay)/gm,
      '$1\n        <ModalOverlay>'
    );

    // Add missing ModalOverlay closing if ModalContent exists but ModalOverlay is missing
    content = content.replace(
      /(<ModalOverlay>\s*<ModalContent[^>]*>.*?<\/ModalContent>)\s*(?!<\/ModalOverlay>)/gms,
      '$1\n      </ModalOverlay>'
    );

    // 2. Fix spacing and formatting issues
    content = content.replace(/\}\s*\n\s*export default/gm, '  )\n}\n\nexport default');

    // 3. Fix common missing closing div patterns
    content = content.replace(
      /(\s+<\/div>\s*\n\s*{\/\*[^*]*\*\/}\s*\n\s*<div)/gm,
      '$1'
    );

    // 4. Ensure proper JSX return structure
    content = content.replace(
      /(return\s*\(\s*\n\s*<[^>]+>.*?)(\s*\n\s*\}\s*\n)/gms,
      (match, jsx, ending) => {
        // Count opening vs closing tags in jsx portion
        const openTags = (jsx.match(/<(?!\/)[\w-]+(?:\s[^>]*)?(?<!\/)\s*>/g) || []).length;
        const closeTags = (jsx.match(/<\/[\w-]+>/g) || []).length;
        const selfClosingTags = (jsx.match(/<[\w-]+(?:\s[^>]*)?\/>/g) || []).length;

        if (openTags - selfClosingTags > closeTags) {
          const deficit = openTags - selfClosingTags - closeTags;
          const closingTags = '    </div>\n'.repeat(deficit);
          return jsx + '\n' + closingTags + '  )' + ending;
        }
        return jsx + '\n  )' + ending;
      }
    );

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

// Function to fix all files based on diagnostic results
function fixAllJSXSyntax() {
  const reportPath = './jsx-issues-report.json';

  let filesToFix = [];

  // Try to load existing report first
  if (fs.existsSync(reportPath)) {
    try {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      filesToFix = Object.keys(report.issues || {});
      console.log(`📋 Using existing diagnostic report: ${filesToFix.length} files to fix`);
    } catch (error) {
      console.log('⚠️  Could not read existing report, running fresh diagnosis...');
    }
  }

  // If no report or couldn't read it, run diagnosis
  if (filesToFix.length === 0) {
    console.log('🔍 Running fresh diagnosis...');
    const { diagnoseAllFiles } = require('./diagnose-jsx-issues');
    const allIssues = diagnoseAllFiles();
    filesToFix = Object.keys(allIssues);
  }

  if (filesToFix.length === 0) {
    console.log('✅ No JSX syntax issues found!');
    return;
  }

  console.log(`\n🔧 Fixing JSX syntax in ${filesToFix.length} files...\n`);

  let totalFixed = 0;
  const fixedFiles = [];
  const failedFiles = [];

  for (const file of filesToFix) {
    try {
      console.log(`Fixing: ${file}`);
      const wasFixed = fixJSXSyntax(file);
      if (wasFixed) {
        fixedFiles.push(file);
        totalFixed++;
        console.log(`✅ Fixed: ${file}`);
      } else {
        console.log(`ℹ️  No changes needed: ${file}`);
      }
    } catch (error) {
      failedFiles.push({ file, error: error.message });
      console.error(`❌ Failed to fix: ${file} - ${error.message}`);
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Successfully fixed: ${totalFixed} files`);
  console.log(`   ⏭️  No changes needed: ${filesToFix.length - totalFixed - failedFiles.length} files`);
  if (failedFiles.length > 0) {
    console.log(`   ❌ Failed to fix: ${failedFiles.length} files`);
    failedFiles.forEach(({ file, error }) => {
      console.log(`      ${file}: ${error}`);
    });
  }

  // Run diagnosis again to verify fixes
  console.log(`\n🔍 Running post-fix diagnosis...`);
  const { diagnoseAllFiles } = require('./diagnose-jsx-issues');
  const remainingIssues = diagnoseAllFiles();

  if (Object.keys(remainingIssues).length === 0) {
    console.log('🎉 All JSX syntax issues have been resolved!');
  } else {
    console.log(`⚠️  ${Object.keys(remainingIssues).length} files still have issues. Check the updated report.`);
  }
}

// Run the fix process
if (require.main === module) {
  console.log('🛠️  JSX Syntax Fixer Starting...\n');
  fixAllJSXSyntax();
  console.log('\n✨ JSX Syntax Fixer Complete!');
}

module.exports = { fixJSXSyntax, fixAllJSXSyntax };