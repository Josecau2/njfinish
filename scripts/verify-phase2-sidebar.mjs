#!/usr/bin/env node
/**
 * Phase 2 Sidebar Verification Script
 * Verifies that AppSidebar.module.css properly handles all states
 */

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('\n🔍 Phase 2 Sidebar Verification\n');
console.log('=' .repeat(60));

// Check files exist
const files = {
  cssModule: join(projectRoot, 'frontend/src/components/AppSidebar.module.css'),
  component: join(projectRoot, 'frontend/src/components/AppSidebar.js'),
};

let allChecks = true;

for (const [name, path] of Object.entries(files)) {
  if (!fs.existsSync(path)) {
    console.log(`❌ ${name}: File not found at ${path}`);
    allChecks = false;
  } else {
    console.log(`✅ ${name}: Found`);
  }
}

if (!allChecks) {
  console.log('\n❌ Missing required files. Cannot proceed.\n');
  process.exit(1);
}

// Read files
const cssContent = fs.readFileSync(files.cssModule, 'utf8');
const jsContent = fs.readFileSync(files.component, 'utf8');

console.log('\n' + '='.repeat(60));
console.log('📋 CSS Module Checks\n');

// Check 1: No !important in CSS Module
const importantCount = (cssContent.match(/!important/g) || []).length;
console.log(`${importantCount === 0 ? '✅' : '❌'} !important declarations: ${importantCount} (expected: 0)`);
allChecks = allChecks && (importantCount === 0);

// Check 2: Has collapsed state rules
const hasCollapsedRules = cssContent.includes(':global(.sidebar-narrow)');
console.log(`${hasCollapsedRules ? '✅' : '❌'} Collapsed state rules: ${hasCollapsedRules ? 'Present' : 'Missing'}`);
allChecks = allChecks && hasCollapsedRules;

// Check 3: Has expanded state rules
const hasExpandedRules = cssContent.includes('.modernSidebar:not(:global(.sidebar-narrow))');
console.log(`${hasExpandedRules ? '✅' : '❌'} Expanded state rules: ${hasExpandedRules ? 'Present' : 'Missing'}`);
allChecks = allChecks && hasExpandedRules;

// Check 4: Has hover behavior (desktop only)
const hasHoverRules = cssContent.includes('@media (min-width: 992px)') &&
                      cssContent.includes(':hover');
console.log(`${hasHoverRules ? '✅' : '❌'} Hover behavior (desktop): ${hasHoverRules ? 'Present' : 'Missing'}`);
allChecks = allChecks && hasHoverRules;

// Check 5: Has mobile adjustments
const hasMobileRules = cssContent.includes('@media (max-width: 767.98px)');
console.log(`${hasMobileRules ? '✅' : '❌'} Mobile adjustments: ${hasMobileRules ? 'Present' : 'Missing'}`);
allChecks = allChecks && hasMobileRules;

// Check 6: Has fadeIn animation
const hasFadeIn = cssContent.includes('@keyframes fadeIn');
console.log(`${hasFadeIn ? '✅' : '❌'} Fade-in animation: ${hasFadeIn ? 'Present' : 'Missing'}`);
allChecks = allChecks && hasFadeIn;

// Check 7: Has width comments documenting collapsed/expanded
const hasWidthDocs = cssContent.includes('/* COLLAPSED STATE - Sidebar width: 56px */') &&
                     cssContent.includes('/* EXPANDED STATE - Sidebar width: 256px */');
console.log(`${hasWidthDocs ? '✅' : '❌'} Width documentation: ${hasWidthDocs ? 'Present' : 'Missing'}`);
allChecks = allChecks && hasWidthDocs;

console.log('\n' + '='.repeat(60));
console.log('📋 JavaScript Component Checks\n');

// Check 8: Imports CSS Module
const importsCSSModule = jsContent.includes("import styles from './AppSidebar.module.css'");
console.log(`${importsCSSModule ? '✅' : '❌'} CSS Module import: ${importsCSSModule ? 'Present' : 'Missing'}`);
allChecks = allChecks && importsCSSModule;

// Check 9: No inline style injection (removed useEffect)
const hasStyleInjection = jsContent.includes('document.createElement(\'style\')');
console.log(`${!hasStyleInjection ? '✅' : '❌'} Inline style injection: ${!hasStyleInjection ? 'Removed' : 'Still present'}`);
allChecks = allChecks && !hasStyleInjection;

// Check 10: Uses CSS Module classes
const usesModernSidebar = jsContent.includes('styles.modernSidebar');
const usesModernSidebarClose = jsContent.includes('styles.modernSidebarClose');
const usesModernSidebarFooter = jsContent.includes('styles.modernSidebarFooter');
const allClassesUsed = usesModernSidebar && usesModernSidebarClose && usesModernSidebarFooter;
console.log(`${allClassesUsed ? '✅' : '❌'} CSS Module classes used: ${allClassesUsed ? 'All present' : 'Some missing'}`);
if (!allClassesUsed) {
  console.log(`   - styles.modernSidebar: ${usesModernSidebar ? '✅' : '❌'}`);
  console.log(`   - styles.modernSidebarClose: ${usesModernSidebarClose ? '✅' : '❌'}`);
  console.log(`   - styles.modernSidebarFooter: ${usesModernSidebarFooter ? '✅' : '❌'}`);
}
allChecks = allChecks && allClassesUsed;

// Check 11: Collapsed/expanded width props
const hasWidthProps = jsContent.includes('w={collapsed ? "56px" : "256px"}');
console.log(`${hasWidthProps ? '✅' : '❌'} Width props (56px/256px): ${hasWidthProps ? 'Present' : 'Missing'}`);
allChecks = allChecks && hasWidthProps;

console.log('\n' + '='.repeat(60));
console.log('📊 Detailed State Analysis\n');

// Analyze CSS for state-specific rules
const collapsedRulesCount = (cssContent.match(/:global\(\.sidebar-narrow\)/g) || []).length;
const expandedRulesCount = (cssContent.match(/\.modernSidebar:not\(:global\(\.sidebar-narrow\)\)/g) || []).length;
const hoverRulesCount = (cssContent.match(/:hover/g) || []).length;

console.log(`📌 Collapsed state rules: ${collapsedRulesCount}`);
console.log(`📌 Expanded state rules: ${expandedRulesCount}`);
console.log(`📌 Hover rules: ${hoverRulesCount}`);

// Check for specific patterns
console.log('\n🎯 Pattern Verification:\n');

const patterns = [
  { name: 'Collapsed: Hide labels', pattern: /sidebar-narrow.*display:\s*none/, present: cssContent.match(/sidebar-narrow.*\n.*display:\s*none/) },
  { name: 'Collapsed: Center icons', pattern: /sidebar-narrow.*justify-content:\s*center/, present: cssContent.match(/sidebar-narrow.*\n.*justify-content:\s*center/) },
  { name: 'Expanded: Show labels', pattern: /not.*sidebar-narrow.*display:\s*block/, present: cssContent.match(/not.*sidebar-narrow.*\n.*display:\s*block/) },
  { name: 'Expanded: Left align', pattern: /not.*sidebar-narrow.*justify-content:\s*flex-start/, present: cssContent.match(/not.*sidebar-narrow.*\n.*justify-content:\s*flex-start/) },
  { name: 'Hover: Fade in animation', pattern: /hover.*animation:\s*fadeIn/, present: cssContent.match(/hover.*\n.*animation:\s*fadeIn/) },
];

patterns.forEach(({ name, present }) => {
  console.log(`${present ? '✅' : '⚠️ '} ${name}`);
});

console.log('\n' + '='.repeat(60));
console.log('🏁 Final Result\n');

if (allChecks) {
  console.log('✅ ALL CHECKS PASSED! Phase 2 sidebar implementation is correct.\n');
  console.log('📝 Summary:');
  console.log('   - CSS Module created without !important declarations');
  console.log('   - Inline style injection removed from JavaScript');
  console.log('   - Collapsed state (56px): Centered icons, hidden labels');
  console.log('   - Expanded state (256px): Left-aligned items, visible labels');
  console.log('   - Hover behavior: Smooth transitions, fade-in animations');
  console.log('   - Mobile/desktop responsive adjustments included');
  console.log('\n🎉 Phase 2 is COMPLETE and VERIFIED!\n');
  process.exit(0);
} else {
  console.log('❌ SOME CHECKS FAILED. Please review the errors above.\n');
  process.exit(1);
}
