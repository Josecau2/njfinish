#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const sourceDir = './frontend/src';

// Function to analyze JSX syntax issues in a file
function diagnoseJSXIssues(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];

    // Track all opening and closing tags
    const tagStack = [];
    const lines = content.split('\n');
    let inJSXContext = false;
    let returnDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Detect JSX context
      if (line.includes('return (') || line.includes('return(')) {
        inJSXContext = true;
        returnDepth = (line.match(/^\s*/)[0].length / 2) || 0;
      }

      if (inJSXContext) {
        // Find all opening tags (excluding self-closing and void elements)
        const openingTagMatches = line.matchAll(/<(\w+)(?:\s[^>]*)?(?<!\/)\s*>/g);
        for (const match of openingTagMatches) {
          const tagName = match[1];
          // Skip void/self-closing HTML elements
          if (!['img', 'input', 'br', 'hr', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'].includes(tagName.toLowerCase())) {
            const indentation = (line.match(/^\s*/)[0].length / 2) || 0;
            tagStack.push({
              tag: tagName,
              line: lineNumber,
              column: match.index,
              indentation
            });
          }
        }

        // Find self-closing tags and remove from consideration
        const selfClosingMatches = line.matchAll(/<(\w+)(?:\s[^>]*)?\/>/g);
        for (const match of selfClosingMatches) {
          // These are properly self-closed, no issue
        }

        // Find closing tags
        const closingTagMatches = line.matchAll(/<\/(\w+)>/g);
        for (const match of closingTagMatches) {
          const tagName = match[1];
          let found = false;

          // Look for matching opening tag (LIFO - last in, first out)
          for (let j = tagStack.length - 1; j >= 0; j--) {
            if (tagStack[j].tag === tagName) {
              tagStack.splice(j, 1);
              found = true;
              break;
            }
          }

          if (!found) {
            issues.push({
              type: 'unexpected_closing_tag',
              tag: tagName,
              line: lineNumber,
              column: match.index,
              message: `Unexpected closing tag '</${tagName}>' with no matching opening tag`
            });
          }
        }

        // Check if we've returned from the JSX context
        const currentIndentation = (line.match(/^\s*/)[0].length / 2) || 0;
        if (line.trim() === '}' && currentIndentation <= returnDepth) {
          inJSXContext = false;
        }
      }
    }

    // Any remaining tags in stack are unclosed
    for (const unclosedTag of tagStack) {
      issues.push({
        type: 'unclosed_tag',
        tag: unclosedTag.tag,
        line: unclosedTag.line,
        column: unclosedTag.column,
        indentation: unclosedTag.indentation,
        message: `Unclosed tag '<${unclosedTag.tag}>' opened at line ${unclosedTag.line}`
      });
    }

    // Check for other common JSX issues

    // 1. Check for malformed imports
    const importIssues = [];
    const importLines = lines.filter((line, idx) => {
      if (line.trim().startsWith('import')) {
        // Check for duplicate imports from same source
        const fromMatch = line.match(/from\s+['"]([^'"]+)['"]/);
        if (fromMatch) {
          const source = fromMatch[1];
          const existingImports = lines.slice(0, idx).filter(prevLine =>
            prevLine.includes(`from '${source}'`) || prevLine.includes(`from "${source}"`)
          );
          if (existingImports.length > 0) {
            importIssues.push({
              type: 'duplicate_import',
              line: idx + 1,
              source: source,
              message: `Duplicate import from '${source}'`
            });
          }
        }

        // Check for malformed import syntax
        if (!line.includes('from') && !line.includes('import ')) {
          importIssues.push({
            type: 'malformed_import',
            line: idx + 1,
            message: `Malformed import statement: ${line.trim()}`
          });
        }
      }
    });

    issues.push(...importIssues);

    // 2. Check for missing semicolons in JSX context
    const missingSemicolons = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.endsWith(';') && !line.endsWith('{') && !line.endsWith('}') &&
          !line.endsWith(',') && !line.endsWith('>') && !line.startsWith('//') &&
          !line.startsWith('/*') && !line.startsWith('*') && !line.includes('return') &&
          (line.includes('const ') || line.includes('let ') || line.includes('var ')) &&
          !line.includes('=')) {
        missingSemicolons.push({
          type: 'missing_semicolon',
          line: i + 1,
          message: `Potentially missing semicolon: ${line}`
        });
      }
    }

    issues.push(...missingSemicolons);

    return issues;

  } catch (error) {
    return [{
      type: 'file_error',
      message: `Error reading file: ${error.message}`
    }];
  }
}

// Function to scan all files and generate comprehensive report
function diagnoseAllFiles() {
  const patterns = [
    `${sourceDir}/**/*.jsx`,
    `${sourceDir}/**/*.tsx`
  ];

  const allIssues = {};
  let totalIssues = 0;

  console.log('🔍 Diagnosing JSX syntax issues...\n');

  for (const pattern of patterns) {
    const files = glob.sync(pattern);

    console.log(`📁 Checking ${files.length} files matching ${pattern}...`);

    for (const file of files) {
      const issues = diagnoseJSXIssues(file);
      if (issues.length > 0) {
        allIssues[file] = issues;
        totalIssues += issues.length;

        console.log(`\n❌ ${file} (${issues.length} issues):`);
        issues.forEach(issue => {
          console.log(`   Line ${issue.line || '?'}: [${issue.type}] ${issue.message}`);
        });
      }
    }
  }

  console.log(`\n📊 Summary: ${totalIssues} total issues found in ${Object.keys(allIssues).length} files`);

  // Write detailed report to JSON file
  const reportPath = './jsx-issues-report.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    summary: {
      totalFiles: Object.keys(allIssues).length,
      totalIssues: totalIssues,
      generatedAt: new Date().toISOString()
    },
    issues: allIssues
  }, null, 2));

  console.log(`\n📋 Detailed report saved to: ${reportPath}`);

  return allIssues;
}

// Run the diagnosis
if (require.main === module) {
  diagnoseAllFiles();
}

module.exports = { diagnoseJSXIssues, diagnoseAllFiles };