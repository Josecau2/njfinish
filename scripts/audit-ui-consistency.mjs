#!/usr/bin/env node
/**
 * UI Consistency Audit Script
 * Checks entire app against UI_EXECUTION_PLAYBOOK.md standards
 *
 * Generates: AUDIT-VIOLATIONS.md with all findings and locations
 */

import fg from 'fast-glob';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

// Violation tracking
const violations = {
  hardcodedColors: [],
  inlineStyles: [],
  spacingIssues: [],
  buttonIssues: [],
  modalIssues: [],
  legacyCSS: [],
  importIssues: [],
};

let totalFiles = 0;
let totalViolations = 0;

// Patterns to detect violations
const patterns = {
  // Hardcoded hex colors (excluding valid cases like color mode values)
  hexColor: /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})(?!['"`])/g,

  // Inline style props (should use Chakra props)
  inlineStyle: /style\s*=\s*\{\{/g,

  // Wrong spacing values (should be 4, 6, or 8)
  wrongSpacing: /spacing\s*=\s*\{([0-3]|5|7|9)\}/g,

  // Button without minH
  buttonNoMinHeight: /<Button[^>]*(?!minH)/g,

  // IconButton without minW/minH
  iconButtonNoSize: /<IconButton[^>]*(?!minW|minH)/g,

  // Modal without ModalOverlay
  modalNoOverlay: /<Modal[^>]*isOpen[^>]*>(?:(?!ModalOverlay)[^<])*<ModalContent/gs,

  // Old CoreUI imports
  coreUIImport: /from\s+['"]@coreui\/react['"]/g,

  // Bootstrap classes
  bootstrapClass: /className\s*=\s*['"](.*?\b(?:col-|row|container|btn-|card-|form-|table-|modal-|d-flex|justify-|align-)[^'"]*)['"]/g,

  // Style tags (custom CSS)
  styleTag: /<style[^>]*>[\s\S]*?<\/style>/g,

  // Hardcoded font sizes
  hardcodedFontSize: /fontSize\s*:\s*['"](?!xs|sm|md|lg|xl)[^'"]+['"]/g,

  // Gap values that should be spacing
  gapValue: /gap\s*=\s*\{([0-3]|5|7|9)\}/g,
};

// Files to scan
const filesToScan = await fg([
  'frontend/src/**/*.{jsx,tsx}',
  '!frontend/src/**/*.test.{jsx,tsx}',
  '!frontend/src/**/*.spec.{jsx,tsx}',
  '!frontend/src/**/*.stories.{jsx,tsx}',
], { cwd: root });

console.log(`🔍 Scanning ${filesToScan.length} files...\n`);

// Scan each file
for (const filePath of filesToScan) {
  totalFiles++;
  const fullPath = path.join(root, filePath);
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');

  // Check hardcoded colors
  let match;
  while ((match = patterns.hexColor.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    const line = lines[lineNum - 1]?.trim();

    // Skip if it's in a comment or a valid useColorModeValue
    if (line.includes('//') || line.includes('useColorModeValue')) continue;

    violations.hardcodedColors.push({
      file: filePath,
      line: lineNum,
      code: line,
      color: match[0],
    });
    totalViolations++;
  }

  // Check inline styles
  patterns.inlineStyle.lastIndex = 0;
  while ((match = patterns.inlineStyle.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    const line = lines[lineNum - 1]?.trim();

    violations.inlineStyles.push({
      file: filePath,
      line: lineNum,
      code: line.substring(0, 100),
    });
    totalViolations++;
  }

  // Check spacing values
  patterns.wrongSpacing.lastIndex = 0;
  while ((match = patterns.wrongSpacing.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    const line = lines[lineNum - 1]?.trim();

    violations.spacingIssues.push({
      file: filePath,
      line: lineNum,
      code: line,
      value: match[1],
    });
    totalViolations++;
  }

  // Check gap values
  patterns.gapValue.lastIndex = 0;
  while ((match = patterns.gapValue.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    const line = lines[lineNum - 1]?.trim();

    violations.spacingIssues.push({
      file: filePath,
      line: lineNum,
      code: line,
      value: `gap=${match[1]}`,
    });
    totalViolations++;
  }

  // Check style tags
  patterns.styleTag.lastIndex = 0;
  while ((match = patterns.styleTag.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    const lineCount = match[0].split('\n').length;

    violations.legacyCSS.push({
      file: filePath,
      line: lineNum,
      lines: lineCount,
      snippet: match[0].substring(0, 200) + '...',
    });
    totalViolations++;
  }

  // Check Bootstrap classes
  patterns.bootstrapClass.lastIndex = 0;
  while ((match = patterns.bootstrapClass.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    const line = lines[lineNum - 1]?.trim();

    violations.legacyCSS.push({
      file: filePath,
      line: lineNum,
      code: line.substring(0, 100),
      class: match[1],
    });
    totalViolations++;
  }

  // Check CoreUI imports
  patterns.coreUIImport.lastIndex = 0;
  while ((match = patterns.coreUIImport.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    const line = lines[lineNum - 1]?.trim();

    violations.importIssues.push({
      file: filePath,
      line: lineNum,
      code: line,
      issue: 'CoreUI import (should use Chakra UI)',
    });
    totalViolations++;
  }

  // Check Button components without minH
  const buttonMatches = content.matchAll(/<Button\s+[^>]*>/g);
  for (const match of buttonMatches) {
    const buttonTag = match[0];
    if (!buttonTag.includes('minH') && !buttonTag.includes('size="lg"')) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      const line = lines[lineNum - 1]?.trim();

      violations.buttonIssues.push({
        file: filePath,
        line: lineNum,
        code: line.substring(0, 100),
        issue: 'Button missing minH="44px" for tap target',
      });
      totalViolations++;
    }
  }

  // Check IconButton components
  const iconButtonMatches = content.matchAll(/<IconButton\s+[^>]*>/g);
  for (const match of iconButtonMatches) {
    const buttonTag = match[0];
    if (!buttonTag.includes('minW') && !buttonTag.includes('minH')) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      const line = lines[lineNum - 1]?.trim();

      violations.buttonIssues.push({
        file: filePath,
        line: lineNum,
        code: line.substring(0, 100),
        issue: 'IconButton missing minW/minH (should be 44px)',
      });
      totalViolations++;
    }
  }

  // Check Modal structure
  const modalMatches = content.matchAll(/<Modal[^>]*isOpen[^>]*>/g);
  for (const match of modalMatches) {
    const modalStart = match.index;
    const modalSection = content.substring(modalStart, modalStart + 500);

    const lineNum = content.substring(0, match.index).split('\n').length;

    if (!modalSection.includes('ModalOverlay')) {
      violations.modalIssues.push({
        file: filePath,
        line: lineNum,
        issue: 'Modal missing ModalOverlay',
      });
      totalViolations++;
    }

    if (!modalSection.includes('scrollBehavior')) {
      violations.modalIssues.push({
        file: filePath,
        line: lineNum,
        issue: 'Modal missing scrollBehavior="inside"',
      });
      totalViolations++;
    }
  }

  // Check hardcoded font sizes
  patterns.hardcodedFontSize.lastIndex = 0;
  while ((match = patterns.hardcodedFontSize.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    const line = lines[lineNum - 1]?.trim();

    violations.inlineStyles.push({
      file: filePath,
      line: lineNum,
      code: line.substring(0, 100),
      issue: 'Hardcoded fontSize (use Chakra tokens: xs, sm, md, lg, xl)',
    });
    totalViolations++;
  }
}

// Generate report
const report = generateReport(violations);
const reportPath = path.join(root, 'AUDIT-VIOLATIONS.md');
fs.writeFileSync(reportPath, report);

console.log(`\n✅ Audit complete!`);
console.log(`   Files scanned: ${totalFiles}`);
console.log(`   Total violations: ${totalViolations}`);
console.log(`   Report: AUDIT-VIOLATIONS.md\n`);

console.log(`📊 Violations by category:`);
console.log(`   Hardcoded colors: ${violations.hardcodedColors.length}`);
console.log(`   Inline styles: ${violations.inlineStyles.length}`);
console.log(`   Spacing issues: ${violations.spacingIssues.length}`);
console.log(`   Button issues: ${violations.buttonIssues.length}`);
console.log(`   Modal issues: ${violations.modalIssues.length}`);
console.log(`   Legacy CSS: ${violations.legacyCSS.length}`);
console.log(`   Import issues: ${violations.importIssues.length}\n`);

// Exit with error if violations found
if (totalViolations > 0) {
  console.log(`⚠️  Found ${totalViolations} violations. See AUDIT-VIOLATIONS.md for details.\n`);
  process.exit(1);
}

function generateReport(violations) {
  const timestamp = new Date().toISOString();

  let report = `# UI Consistency Audit Report
Generated: ${timestamp}

## Summary
- **Total Files Scanned:** ${totalFiles}
- **Total Violations:** ${totalViolations}

## Violations by Category

`;

  // Hardcoded Colors
  if (violations.hardcodedColors.length > 0) {
    report += `### 1. Hardcoded Colors (${violations.hardcodedColors.length})\n\n`;
    report += `**Playbook Rule:** Use Chakra color tokens (Step 10)\n\n`;
    report += `| File | Line | Color | Code |\n`;
    report += `|------|------|-------|------|\n`;

    violations.hardcodedColors.slice(0, 50).forEach(v => {
      report += `| ${v.file} | ${v.line} | ${v.color} | \`${v.code.substring(0, 60)}...\` |\n`;
    });

    if (violations.hardcodedColors.length > 50) {
      report += `\n... and ${violations.hardcodedColors.length - 50} more\n`;
    }

    report += `\n**Fix:** Replace hex colors with Chakra tokens:\n`;
    report += `\`\`\`jsx\n`;
    report += `// BAD\n`;
    report += `<Box bg="#321fdb" color="#ffffff" />\n\n`;
    report += `// GOOD\n`;
    report += `<Box bg="blue.600" color="white" />\n`;
    report += `// OR with color mode\n`;
    report += `<Box bg={useColorModeValue('blue.600', 'blue.400')} />\n`;
    report += `\`\`\`\n\n`;
  }

  // Inline Styles
  if (violations.inlineStyles.length > 0) {
    report += `### 2. Inline Style Props (${violations.inlineStyles.length})\n\n`;
    report += `**Playbook Rule:** Use Chakra props instead of style={{}} (Step 1)\n\n`;
    report += `| File | Line | Code |\n`;
    report += `|------|------|------|\n`;

    violations.inlineStyles.slice(0, 50).forEach(v => {
      report += `| ${v.file} | ${v.line} | \`${v.code}\` |\n`;
    });

    if (violations.inlineStyles.length > 50) {
      report += `\n... and ${violations.inlineStyles.length - 50} more\n`;
    }

    report += `\n**Fix:** Convert to Chakra props:\n`;
    report += `\`\`\`jsx\n`;
    report += `// BAD\n`;
    report += `<Box style={{ backgroundColor: 'red', fontSize: '14px' }} />\n\n`;
    report += `// GOOD\n`;
    report += `<Box bg="red.500" fontSize="sm" />\n`;
    report += `\`\`\`\n\n`;
  }

  // Spacing Issues
  if (violations.spacingIssues.length > 0) {
    report += `### 3. Spacing Inconsistencies (${violations.spacingIssues.length})\n\n`;
    report += `**Playbook Rule:** Use spacing={4} for mobile cards, spacing={6} for grids (Step 8.2)\n\n`;
    report += `| File | Line | Value | Code |\n`;
    report += `|------|------|-------|------|\n`;

    violations.spacingIssues.slice(0, 50).forEach(v => {
      report += `| ${v.file} | ${v.line} | ${v.value} | \`${v.code.substring(0, 60)}...\` |\n`;
    });

    if (violations.spacingIssues.length > 50) {
      report += `\n... and ${violations.spacingIssues.length - 50} more\n`;
    }

    report += `\n**Fix:** Use standard spacing values:\n`;
    report += `\`\`\`jsx\n`;
    report += `// BAD\n`;
    report += `<Stack spacing={2}> or <HStack gap={3}>\n\n`;
    report += `// GOOD\n`;
    report += `<Stack spacing={4}> // Mobile cards\n`;
    report += `<SimpleGrid spacing={6}> // Grid layouts\n`;
    report += `\`\`\`\n\n`;
  }

  // Button Issues
  if (violations.buttonIssues.length > 0) {
    report += `### 4. Button Tap Target Violations (${violations.buttonIssues.length})\n\n`;
    report += `**Playbook Rule:** All interactive elements >= 44×44px (Step 9)\n\n`;
    report += `| File | Line | Issue | Code |\n`;
    report += `|------|------|-------|------|\n`;

    violations.buttonIssues.slice(0, 50).forEach(v => {
      report += `| ${v.file} | ${v.line} | ${v.issue} | \`${v.code}\` |\n`;
    });

    if (violations.buttonIssues.length > 50) {
      report += `\n... and ${violations.buttonIssues.length - 50} more\n`;
    }

    report += `\n**Fix:** Add minimum height:\n`;
    report += `\`\`\`jsx\n`;
    report += `// BAD\n`;
    report += `<Button size="sm">Click</Button>\n`;
    report += `<IconButton aria-label="Icon" icon={<Icon />} />\n\n`;
    report += `// GOOD\n`;
    report += `<Button size="sm" minH="44px">Click</Button>\n`;
    report += `<IconButton minW="44px" minH="44px" aria-label="Icon" icon={<Icon />} />\n`;
    report += `\`\`\`\n\n`;
  }

  // Modal Issues
  if (violations.modalIssues.length > 0) {
    report += `### 5. Modal Structure Issues (${violations.modalIssues.length})\n\n`;
    report += `**Playbook Rule:** Modals must have ModalOverlay, scrollBehavior="inside" (Step 7)\n\n`;
    report += `| File | Line | Issue |\n`;
    report += `|------|------|-------|\n`;

    violations.modalIssues.forEach(v => {
      report += `| ${v.file} | ${v.line} | ${v.issue} |\n`;
    });

    report += `\n**Fix:** Complete modal structure:\n`;
    report += `\`\`\`jsx\n`;
    report += `<Modal isOpen={isOpen} onClose={onClose} size={{ base: 'full', md: 'lg' }} scrollBehavior="inside">\n`;
    report += `  <ModalOverlay />\n`;
    report += `  <ModalContent>\n`;
    report += `    <ModalHeader>Title</ModalHeader>\n`;
    report += `    <ModalCloseButton />\n`;
    report += `    <ModalBody>{content}</ModalBody>\n`;
    report += `  </ModalContent>\n`;
    report += `</Modal>\n`;
    report += `\`\`\`\n\n`;
  }

  // Legacy CSS
  if (violations.legacyCSS.length > 0) {
    report += `### 6. Legacy CSS & Bootstrap (${violations.legacyCSS.length})\n\n`;
    report += `**Playbook Rule:** No custom CSS, use Chakra responsive props (Step 2)\n\n`;
    report += `| File | Line | Issue |\n`;
    report += `|------|------|-------|\n`;

    violations.legacyCSS.slice(0, 50).forEach(v => {
      if (v.snippet) {
        report += `| ${v.file} | ${v.line} | ${v.lines} lines of custom CSS |\n`;
      } else if (v.class) {
        report += `| ${v.file} | ${v.line} | Bootstrap class: ${v.class} |\n`;
      }
    });

    if (violations.legacyCSS.length > 50) {
      report += `\n... and ${violations.legacyCSS.length - 50} more\n`;
    }

    report += `\n**Fix:** Remove <style> tags and Bootstrap classes, use Chakra:\n`;
    report += `\`\`\`jsx\n`;
    report += `// BAD\n`;
    report += `<div className="d-flex justify-content-between align-items-center">\n\n`;
    report += `// GOOD\n`;
    report += `<Flex justify="space-between" align="center">\n`;
    report += `\`\`\`\n\n`;
  }

  // Import Issues
  if (violations.importIssues.length > 0) {
    report += `### 7. Import Issues (${violations.importIssues.length})\n\n`;
    report += `**Playbook Rule:** Use Chakra UI only (Step 1)\n\n`;
    report += `| File | Line | Code |\n`;
    report += `|------|------|------|\n`;

    violations.importIssues.forEach(v => {
      report += `| ${v.file} | ${v.line} | \`${v.code}\` |\n`;
    });

    report += `\n**Fix:** Replace CoreUI with Chakra:\n`;
    report += `\`\`\`jsx\n`;
    report += `// BAD\n`;
    report += `import { CButton, CCard } from '@coreui/react'\n\n`;
    report += `// GOOD\n`;
    report += `import { Button, Card } from '@chakra-ui/react'\n`;
    report += `\`\`\`\n\n`;
  }

  report += `## Priority Fix Order

1. **Import Issues** - Replace CoreUI imports with Chakra
2. **Hardcoded Colors** - Use Chakra color tokens
3. **Inline Styles** - Convert to Chakra props
4. **Legacy CSS** - Remove custom CSS and Bootstrap classes
5. **Spacing** - Standardize to playbook values
6. **Buttons** - Add minH="44px" for tap targets
7. **Modals** - Complete structure with ModalOverlay and scrollBehavior

## Next Steps

Run the fix script:
\`\`\`bash
node scripts/fix-audit-violations.mjs
\`\`\`

Or fix manually following the examples above.
`;

  return report;
}
