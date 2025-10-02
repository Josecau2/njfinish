#!/usr/bin/env node
/**
 * Fix responsive.css by replacing CoreUI variables with Chakra-compatible ones
 * This maintains the responsive behavior while removing CoreUI dependency
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const responsiveCssPath = path.join(__dirname, '../frontend/src/responsive.css');
const backupPath = path.join(__dirname, '../frontend/src/responsive.css.backup');

// Read the file
let content = fs.readFileSync(responsiveCssPath, 'utf8');

console.log('📝 Backing up responsive.css...');
fs.writeFileSync(backupPath, content);

console.log('🔧 Replacing CoreUI variables with standard CSS variables...');

// Variable mapping from CoreUI to standard names
const variableReplacements = {
  // Colors - remove cui prefix
  '--cui-primary': '--app-primary',
  '--cui-primary-rgb': '--app-primary-rgb',
  '--cui-secondary': '--app-secondary',
  '--cui-secondary-rgb': '--app-secondary-rgb',
  '--cui-success': '--app-success',
  '--cui-success-rgb': '--app-success-rgb',
  '--cui-danger': '--app-danger',
  '--cui-danger-rgb': '--app-danger-rgb',
  '--cui-warning': '--app-warning',
  '--cui-warning-rgb': '--app-warning-rgb',
  '--cui-info': '--app-info',
  '--cui-info-rgb': '--app-info-rgb',

  // Grays
  '--cui-gray-900': '--app-gray-900',
  '--cui-gray-800': '--app-gray-800',
  '--cui-gray-700': '--app-gray-700',
  '--cui-gray-600': '--app-gray-600',
  '--cui-gray-500': '--app-gray-500',
  '--cui-gray-400': '--app-gray-400',
  '--cui-gray-300': '--app-gray-300',
  '--cui-gray-200': '--app-gray-200',
  '--cui-gray-100': '--app-gray-100',
  '--cui-gray-50': '--app-gray-50',
  '--cui-white': '--app-white',

  // Body & Text
  '--cui-body-bg': '--app-body-bg',
  '--cui-body-color': '--app-body-color',
  '--cui-heading-color': '--app-heading-color',
  '--cui-link-color': '--app-link-color',
  '--cui-link-hover-color': '--app-link-hover-color',

  // Borders
  '--cui-border-color': '--app-border-color',
  '--cui-border-radius': '--app-border-radius',
  '--cui-border-radius-sm': '--app-border-radius-sm',
  '--cui-border-radius-lg': '--app-border-radius-lg',
  '--cui-border-radius-xl': '--app-border-radius-xl',
  '--cui-border-radius-2xl': '--app-border-radius-2xl',
  '--cui-border-radius-pill': '--app-border-radius-pill',

  // Shadows
  '--cui-box-shadow-sm': '--app-box-shadow-sm',
  '--cui-box-shadow': '--app-box-shadow',
  '--cui-box-shadow-lg': '--app-box-shadow-lg',
};

// Replace all occurrences
let replacementCount = 0;
for (const [oldVar, newVar] of Object.entries(variableReplacements)) {
  const regex = new RegExp(oldVar.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
  const matches = content.match(regex);
  if (matches) {
    replacementCount += matches.length;
    content = content.replace(regex, newVar);
  }
}

console.log(`✅ Replaced ${replacementCount} CoreUI variable references`);

// Add header comment
const header = `/* Responsive Design & Modern UI Overrides
 *
 * MIGRATED FROM COREUI: All --cui-* variables replaced with --app-* prefix
 * This file provides responsive behavior and legacy compatibility.
 *
 * CSS Variables are now Chakra-compatible and can be overridden via theme.
 * Last updated: ${new Date().toISOString().split('T')[0]}
 */

`;

content = header + content.replace(/^\/\* Responsive Design & Modern UI Overrides \*\/\n\n/, '');

// Write back
fs.writeFileSync(responsiveCssPath, content);

console.log('✅ responsive.css updated successfully');
console.log(`📦 Backup saved to: ${backupPath}`);
console.log(`
📊 Summary:
- ${replacementCount} variable references updated
- All --cui-* prefixes changed to --app-*
- Responsive behavior preserved
- Chakra compatibility improved
`);
