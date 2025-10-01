#!/usr/bin/env node
/**
 * Enhanced UI Violations Audit Script
 * Based on UI_EXECUTION_PLAYBOOK.md requirements
 */

import fg from 'fast-glob';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const violations = {
  hardcodedColors: [],
  hardcodedPx: [],
  inlineStyles: [],
  missingI18n: [],
  smallTapTargets: [],
  noMinWidth: [],
  modalIssues: [],
  spacingTokens: [],
  iconSizes: [],
  bootstrapClasses: [],
  customCSS: [],
  missingDataAttributes: [],
  overflowIssues: [],
  focusIndicators: [],
};

// Files to scan
const filesToScan = await fg([
  'frontend/src/**/*.{jsx,tsx}',
  '!frontend/src/**/*.test.{jsx,tsx}',
  '!frontend/src/**/*.spec.{jsx,tsx}',
], { cwd: root });

console.log(`🔍 Scanning ${filesToScan.length} files for playbook violations...\n`);

for (const filePath of filesToScan) {
  const fullPath = path.join(root, filePath);
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // 1. Hardcoded colors (hex values in props or styles)
    const hexColorRegex = /#[0-9a-fA-F]{3,6}/g;
    const hexMatches = line.match(hexColorRegex);
    if (hexMatches && !line.includes('//') && !line.includes('contrast') && !line.includes('getOptimal')) {
      hexMatches.forEach(hex => {
        violations.hardcodedColors.push({
          file: filePath,
          line: lineNum,
          code: line.trim().substring(0, 100),
          hex
        });
      });
    }

    // 2. Hardcoded px values (should use tokens)
    // Match fontSize, width, height, padding, margin with px
    const pxRegex = /(fontSize|width|height|padding|margin|gap|spacing|p|m|px|py|pt|pb|pl|pr)[:=]["']?\s*(\d+)px/g;
    let pxMatch;
    while ((pxMatch = pxRegex.exec(line)) !== null) {
      if (!line.includes('//') && !line.includes('viewport')) {
        violations.hardcodedPx.push({
          file: filePath,
          line: lineNum,
          property: pxMatch[1],
          value: pxMatch[2] + 'px',
          code: line.trim().substring(0, 100)
        });
      }
    }

    // 3. Inline style={{}} usage
    if (line.includes('style={{') && !line.includes('//')) {
      violations.inlineStyles.push({
        file: filePath,
        line: lineNum,
        code: line.trim().substring(0, 100)
      });
    }

    // 4. Hardcoded English strings (should use i18n)
    // Look for common UI strings in quotes
    const i18nRegex = /['"]+(Submit|Cancel|Save|Delete|Edit|Create|Add|Remove|Search|Filter|Export|Loading|Error|Success|Warning|Back|Next|Previous|Confirm|Close|Open)['"]+ /gi;
    const i18nMatches = line.match(i18nRegex);
    if (i18nMatches && !line.includes('aria-label') && !line.includes('placeholder') && !line.includes('//')) {
      violations.missingI18n.push({
        file: filePath,
        line: lineNum,
        text: i18nMatches[0].trim(),
        code: line.trim().substring(0, 100)
      });
    }

    // 5. Button/IconButton without minH="44px" or minW="44px"
    if (line.includes('<Button') && !line.includes('minH')) {
      violations.smallTapTargets.push({
        file: filePath,
        line: lineNum,
        type: 'Button',
        issue: 'Missing minH="44px"',
        code: line.trim().substring(0, 100)
      });
    }
    if (line.includes('<IconButton') && (!line.includes('minW') || !line.includes('minH'))) {
      violations.smallTapTargets.push({
        file: filePath,
        line: lineNum,
        type: 'IconButton',
        issue: 'Missing minW/minH="44px"',
        code: line.trim().substring(0, 100)
      });
    }

    // 6. Elements without min-width: 0 (common overflow cause)
    if ((line.includes('<Box') || line.includes('<Flex') || line.includes('<Stack')) &&
        !line.includes('minW') && line.includes('overflow')) {
      violations.noMinWidth.push({
        file: filePath,
        line: lineNum,
        code: line.trim().substring(0, 100)
      });
    }

    // 7. Modal without scrollBehavior="inside"
    if (line.includes('<Modal') && !line.includes('scrollBehavior')) {
      violations.modalIssues.push({
        file: filePath,
        line: lineNum,
        issue: 'Missing scrollBehavior="inside"',
        code: line.trim().substring(0, 100)
      });
    }

    // 8. Non-standard spacing values (should be 4 or 6)
    const spacingRegex = /(spacing|gap)=\{([0-9]+)\}/g;
    let spacingMatch;
    while ((spacingMatch = spacingRegex.exec(line)) !== null) {
      const val = parseInt(spacingMatch[2]);
      if (![0, 1, 2, 3, 4, 5, 6, 8].includes(val)) {
        violations.spacingTokens.push({
          file: filePath,
          line: lineNum,
          property: spacingMatch[1],
          value: val,
          code: line.trim().substring(0, 100)
        });
      }
    }

    // 9. Icon without standard size (should use ICON.sm/md/lg or 16/20/24)
    if (line.includes('<Icon') || line.includes('<svg')) {
      const sizeRegex = /(?:boxSize|size|width|height)[:=]["']?\s*(\d+)/g;
      let sizeMatch;
      while ((sizeMatch = sizeRegex.exec(line)) !== null) {
        const size = parseInt(sizeMatch[1]);
        if (![16, 20, 24, 4, 5, 6].includes(size) && size !== 44) {
          violations.iconSizes.push({
            file: filePath,
            line: lineNum,
            size: size,
            code: line.trim().substring(0, 100)
          });
        }
      }
    }

    // 10. Bootstrap classes (should use Chakra)
    const bootstrapClasses = [
      'd-flex', 'd-block', 'd-none', 'd-inline', 'd-grid',
      'justify-content-', 'align-items-', 'flex-', 'text-',
      'bg-', 'border-', 'rounded-', 'shadow-',
      'p-', 'm-', 'pt-', 'pb-', 'ps-', 'pe-', 'mt-', 'mb-', 'ms-', 'me-',
      'w-', 'h-', 'mw-', 'mh-',
      'container', 'container-fluid', 'row', 'col-'
    ];
    bootstrapClasses.forEach(cls => {
      if (line.includes(`"${cls}`) || line.includes(`'${cls}`) || line.includes(` ${cls} `)) {
        violations.bootstrapClasses.push({
          file: filePath,
          line: lineNum,
          class: cls,
          code: line.trim().substring(0, 100)
        });
      }
    });

    // 11. Custom CSS blocks (should use Chakra props)
    if (line.includes('<style>') || line.includes('const styles = {')) {
      violations.customCSS.push({
        file: filePath,
        line: lineNum,
        code: line.trim().substring(0, 100)
      });
    }

    // 12. Missing data attributes for testing (header, page-container)
    if ((line.includes('Header') || line.includes('header')) &&
        line.includes('<Box') && !line.includes('data-app-header')) {
      violations.missingDataAttributes.push({
        file: filePath,
        line: lineNum,
        missing: 'data-app-header',
        code: line.trim().substring(0, 100)
      });
    }
    if (line.includes('PageContainer') && line.includes('<Box') && !line.includes('data-page-container')) {
      violations.missingDataAttributes.push({
        file: filePath,
        line: lineNum,
        missing: 'data-page-container',
        code: line.trim().substring(0, 100)
      });
    }

    // 13. Potential overflow issues (missing overflow-x: hidden)
    if ((line.includes('width: "100%"') || line.includes('w="full"')) &&
        !line.includes('overflowX')) {
      // This is a heuristic - might have false positives
    }

    // 14. Missing focus indicators (outline: none without replacement)
    if (line.includes('outline: "none"') || line.includes('outline="none"')) {
      if (!line.includes('focusBorderColor') && !line.includes('_focus')) {
        violations.focusIndicators.push({
          file: filePath,
          line: lineNum,
          issue: 'outline:none without focus replacement',
          code: line.trim().substring(0, 100)
        });
      }
    }
  });
}

// Generate report
console.log('📊 AUDIT RESULTS\n');
console.log('='.repeat(80));

let totalViolations = 0;

function printCategory(title, items, limit = 10) {
  if (items.length === 0) return;

  totalViolations += items.length;
  console.log(`\n### ${title}: ${items.length} violations`);
  console.log('-'.repeat(80));

  items.slice(0, limit).forEach(item => {
    console.log(`📍 ${item.file}:${item.line}`);
    if (item.hex) console.log(`   Color: ${item.hex}`);
    if (item.property) console.log(`   ${item.property}: ${item.value}`);
    if (item.type) console.log(`   ${item.type}: ${item.issue}`);
    if (item.text) console.log(`   Hardcoded: ${item.text}`);
    if (item.issue) console.log(`   Issue: ${item.issue}`);
    if (item.class) console.log(`   Bootstrap: ${item.class}`);
    console.log(`   ${item.code}`);
    console.log('');
  });

  if (items.length > limit) {
    console.log(`   ... and ${items.length - limit} more\n`);
  }
}

printCategory('1. Hardcoded Colors (use Chakra tokens)', violations.hardcodedColors, 15);
printCategory('2. Hardcoded px Values (use spacing tokens)', violations.hardcodedPx, 15);
printCategory('3. Inline Styles (use Chakra props)', violations.inlineStyles, 10);
printCategory('4. Missing i18n (hardcoded English)', violations.missingI18n, 10);
printCategory('5. Small Tap Targets (<44x44px)', violations.smallTapTargets, 15);
printCategory('6. Missing minW (overflow risk)', violations.noMinWidth, 5);
printCategory('7. Modal Issues (scrollBehavior)', violations.modalIssues, 10);
printCategory('8. Non-Standard Spacing', violations.spacingTokens, 10);
printCategory('9. Non-Standard Icon Sizes', violations.iconSizes, 10);
printCategory('10. Bootstrap Classes (use Chakra)', violations.bootstrapClasses, 15);
printCategory('11. Custom CSS Blocks', violations.customCSS, 5);
printCategory('12. Missing Data Attributes', violations.missingDataAttributes, 5);
printCategory('13. Missing Focus Indicators', violations.focusIndicators, 5);

console.log('\n' + '='.repeat(80));
console.log(`\n📊 TOTAL VIOLATIONS: ${totalViolations}\n`);

// Save to JSON
const report = {
  timestamp: new Date().toISOString(),
  totalViolations,
  violations
};

fs.writeFileSync(
  path.join(root, 'playbook-audit-report.json'),
  JSON.stringify(report, null, 2)
);

console.log('💾 Detailed report saved to: playbook-audit-report.json\n');

process.exit(totalViolations > 0 ? 1 : 0);
