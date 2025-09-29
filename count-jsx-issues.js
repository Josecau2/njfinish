#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const sourceDir = './frontend/src';

// Function to count JSX syntax issues in a file
function countJSXIssues(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = {
      unclosedTags: 0,
      unexpectedClosingTags: 0,
      duplicateImports: 0,
      malformedStructures: 0,
      missingReturnParentheses: 0,
      orphanedJSX: 0,
      modalStructureIssues: 0,
      details: []
    };

    const lines = content.split('\n');
    const tagStack = [];
    const importSources = new Set();
    let inJSXContext = false;
    let returnDepth = 0;
    let hasReturn = false;
    let returnLineCount = 0;

    // Track imports for duplicates
    const importLines = lines.filter((line, idx) => {
      if (line.trim().startsWith('import')) {
        const fromMatch = line.match(/from\s+['"]([^'"]+)['"]/);
        if (fromMatch) {
          const source = fromMatch[1];
          if (importSources.has(source)) {
            issues.duplicateImports++;
            issues.details.push(`Line ${idx + 1}: Duplicate import from '${source}'`);
          } else {
            importSources.add(source);
          }
        }
      }
    });

    // Analyze JSX structure
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Detect JSX context
      if (line.includes('return (') || line.includes('return(')) {
        inJSXContext = true;
        hasReturn = true;
        returnDepth = (line.match(/^\s*/)[0].length / 2) || 0;
        returnLineCount++;
      }

      // Count multiple return statements
      if (line.includes('return (') && returnLineCount > 1) {
        issues.malformedStructures++;
        issues.details.push(`Line ${lineNumber}: Multiple return statements detected`);
      }

      if (inJSXContext) {
        // Check for Modal structure issues
        if (line.includes('<Modal') && !lines.slice(i, i + 5).some(l => l.includes('<ModalOverlay>'))) {
          issues.modalStructureIssues++;
          issues.details.push(`Line ${lineNumber}: Modal missing ModalOverlay structure`);
        }

        // Find opening tags (excluding self-closing and void elements)
        const openingTagMatches = line.matchAll(/<(\w+)(?:\s[^>]*)?(?<!\/)\s*>/g);
        for (const match of openingTagMatches) {
          const tagName = match[1];
          if (!['img', 'input', 'br', 'hr', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'].includes(tagName.toLowerCase())) {
            tagStack.push({
              tag: tagName,
              line: lineNumber,
              column: match.index
            });
          }
        }

        // Find closing tags
        const closingTagMatches = line.matchAll(/<\/(\w+)>/g);
        for (const match of closingTagMatches) {
          const tagName = match[1];
          let found = false;

          // Look for matching opening tag (LIFO)
          for (let j = tagStack.length - 1; j >= 0; j--) {
            if (tagStack[j].tag === tagName) {
              tagStack.splice(j, 1);
              found = true;
              break;
            }
          }

          if (!found) {
            issues.unexpectedClosingTags++;
            issues.details.push(`Line ${lineNumber}: Unexpected closing tag '</${tagName}>' with no matching opening tag`);
          }
        }

        // Check if we've returned from the JSX context
        const currentIndentation = (line.match(/^\s*/)[0].length / 2) || 0;
        if ((line.trim() === '}' || line.trim().startsWith('export')) && currentIndentation <= returnDepth) {
          inJSXContext = false;

          // Count unclosed tags at end of JSX context
          if (tagStack.length > 0) {
            issues.unclosedTags += tagStack.length;
            tagStack.forEach(tag => {
              issues.details.push(`Line ${tag.line}: Unclosed tag '<${tag.tag}>' opened but never closed`);
            });
          }
        }
      }
    }

    // Check for missing return parentheses structure
    if (hasReturn) {
      const returnPattern = /return\s*\(/;
      const closeParenPattern = /\s*\)\s*\n\s*\}/;

      if (returnPattern.test(content) && !closeParenPattern.test(content)) {
        issues.missingReturnParentheses++;
        issues.details.push('Missing closing parenthesis for return statement');
      }
    }

    // Check for orphaned JSX after function closing
    const afterExportMatch = content.match(/(export default \w+[\s\S]*?)(<\/\w+>)/);
    if (afterExportMatch) {
      issues.orphanedJSX++;
      issues.details.push('Orphaned JSX elements found after export statement');
    }

    // Check for malformed function structures
    const functionClosingPattern = /\}\s*\n\s*\)\s*\n\s*\}/g;
    const malformedClosings = content.match(functionClosingPattern);
    if (malformedClosings) {
      issues.malformedStructures += malformedClosings.length;
      issues.details.push(`${malformedClosings.length} malformed function closing structures detected`);
    }

    return issues;

  } catch (error) {
    return {
      unclosedTags: 0,
      unexpectedClosingTags: 0,
      duplicateImports: 0,
      malformedStructures: 0,
      missingReturnParentheses: 0,
      orphanedJSX: 0,
      modalStructureIssues: 0,
      details: [`Error reading file: ${error.message}`]
    };
  }
}

// Function to count issues across all files
function countAllJSXIssues() {
  const patterns = [
    `${sourceDir}/**/*.jsx`,
    `${sourceDir}/**/*.tsx`
  ];

  const summary = {
    totalFiles: 0,
    filesWithIssues: 0,
    totalIssues: 0,
    unclosedTags: 0,
    unexpectedClosingTags: 0,
    duplicateImports: 0,
    malformedStructures: 0,
    missingReturnParentheses: 0,
    orphanedJSX: 0,
    modalStructureIssues: 0,
    fileBreakdown: {}
  };

  console.log('📊 Counting JSX syntax issues across the codebase...\n');

  for (const pattern of patterns) {
    const files = glob.sync(pattern);
    summary.totalFiles += files.length;

    console.log(`📁 Analyzing ${files.length} files matching ${pattern}...`);

    for (const file of files) {
      const issues = countJSXIssues(file);
      const fileIssueCount =
        issues.unclosedTags +
        issues.unexpectedClosingTags +
        issues.duplicateImports +
        issues.malformedStructures +
        issues.missingReturnParentheses +
        issues.orphanedJSX +
        issues.modalStructureIssues;

      if (fileIssueCount > 0) {
        summary.filesWithIssues++;
        summary.totalIssues += fileIssueCount;
        summary.unclosedTags += issues.unclosedTags;
        summary.unexpectedClosingTags += issues.unexpectedClosingTags;
        summary.duplicateImports += issues.duplicateImports;
        summary.malformedStructures += issues.malformedStructures;
        summary.missingReturnParentheses += issues.missingReturnParentheses;
        summary.orphanedJSX += issues.orphanedJSX;
        summary.modalStructureIssues += issues.modalStructureIssues;

        summary.fileBreakdown[file] = {
          totalIssues: fileIssueCount,
          breakdown: issues,
          details: issues.details
        };

        console.log(`❌ ${file}: ${fileIssueCount} issues`);
      }
    }
  }

  // Display detailed summary
  console.log(`\n📈 SUMMARY REPORT`);
  console.log('='.repeat(50));
  console.log(`Total Files Analyzed: ${summary.totalFiles}`);
  console.log(`Files with Issues: ${summary.filesWithIssues}`);
  console.log(`Total Issues Found: ${summary.totalIssues}`);
  console.log('');
  console.log('Issue Breakdown:');
  console.log(`  🏷️  Unclosed Tags: ${summary.unclosedTags}`);
  console.log(`  ❌ Unexpected Closing Tags: ${summary.unexpectedClosingTags}`);
  console.log(`  📦 Duplicate Imports: ${summary.duplicateImports}`);
  console.log(`  🏗️  Malformed Structures: ${summary.malformedStructures}`);
  console.log(`  📝 Missing Return Parentheses: ${summary.missingReturnParentheses}`);
  console.log(`  🚪 Orphaned JSX: ${summary.orphanedJSX}`);
  console.log(`  🖼️  Modal Structure Issues: ${summary.modalStructureIssues}`);

  // Show percentage of files affected
  const percentageAffected = ((summary.filesWithIssues / summary.totalFiles) * 100).toFixed(1);
  console.log(`\n📊 Impact: ${percentageAffected}% of files have syntax issues`);

  // Show top problematic files
  const sortedFiles = Object.entries(summary.fileBreakdown)
    .sort((a, b) => b[1].totalIssues - a[1].totalIssues)
    .slice(0, 10);

  if (sortedFiles.length > 0) {
    console.log(`\n🔥 Top 10 Most Problematic Files:`);
    console.log('-'.repeat(50));
    sortedFiles.forEach(([file, data], index) => {
      console.log(`${index + 1}. ${file}: ${data.totalIssues} issues`);
    });
  }

  // Generate detailed report file
  const reportPath = './jsx-issues-count-report.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    summary: summary,
    detailedBreakdown: summary.fileBreakdown
  }, null, 2));

  console.log(`\n📋 Detailed report saved to: ${reportPath}`);

  // Priority recommendations
  console.log(`\n💡 RECOMMENDATIONS:`);
  if (summary.totalIssues === 0) {
    console.log('✅ No JSX syntax issues found! The codebase is clean.');
  } else if (summary.totalIssues < 10) {
    console.log('⚠️  Low number of issues. Manual fixes recommended.');
  } else if (summary.totalIssues < 50) {
    console.log('🔧 Moderate number of issues. Targeted scripts recommended.');
  } else {
    console.log('🚨 High number of issues. Comprehensive automated fixing required.');
  }

  return summary;
}

// Run the count analysis
if (require.main === module) {
  console.log('🔍 JSX Issue Counter Starting...\n');
  const result = countAllJSXIssues();
  console.log('\n✨ Analysis Complete!');
}

module.exports = { countJSXIssues, countAllJSXIssues };