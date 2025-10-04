#!/usr/bin/env node
/**
 * Auto-Add Missing Translations Script
 * Automatically adds translation keys to components and updates locale files
 * Usage: node add-missing-translations.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const SOURCE_DIR = path.join(__dirname, 'frontend/src');
const LOCALE_FILE_EN = path.join(__dirname, 'frontend/src/i18n/locales/en.json');
const LOCALE_FILE_ES = path.join(__dirname, 'frontend/src/i18n/locales/es.json');
const REPORT_FILE = path.join(__dirname, 'translation-audit-report.json');

// Load existing translations
let existingTranslations = {};
let spanishTranslations = {};

try {
  existingTranslations = JSON.parse(fs.readFileSync(LOCALE_FILE_EN, 'utf8'));
  spanishTranslations = JSON.parse(fs.readFileSync(LOCALE_FILE_ES, 'utf8'));
} catch (err) {
  console.error('Error loading locale files:', err.message);
  process.exit(1);
}

// Load audit report
let auditReport = {};
try {
  auditReport = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8'));
} catch (err) {
  console.error('Error loading audit report. Please run find-missing-translations.js first.');
  process.exit(1);
}

const newTranslations = {};
const updatedFiles = [];
const skippedFiles = [];

// Helper to generate translation key from string
function generateKeyFromString(str, context = '') {
  // Remove special characters and normalize
  let key = str
    .replace(/[{}'"`]/g, '')
    .replace(/\.\.\./g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(word => word.length > 0)
    .join('_');

  // Truncate if too long
  if (key.length > 50) {
    key = key.substring(0, 50);
  }

  return key;
}

// Helper to determine section based on file path
function getSectionFromPath(filePath) {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();

  if (normalized.includes('/auth/')) return 'auth';
  if (normalized.includes('/settings/manufacturers')) return 'settings.manufacturers';
  if (normalized.includes('/settings/users')) return 'settings.users';
  if (normalized.includes('/settings/locations')) return 'settings.locations';
  if (normalized.includes('/settings/taxes')) return 'settings.taxes';
  if (normalized.includes('/settings/terms')) return 'settings.terms';
  if (normalized.includes('/settings/customization')) return 'settings.customization';
  if (normalized.includes('/settings/globalmods')) return 'globalMods';
  if (normalized.includes('/settings/multipliers')) return 'settings.multipliers';
  if (normalized.includes('/settings/usersgroup')) return 'settings.userGroups';
  if (normalized.includes('/settings/')) return 'settings';
  if (normalized.includes('/proposals/')) return 'proposals';
  if (normalized.includes('/orders/')) return 'orders';
  if (normalized.includes('/customers/')) return 'customers';
  if (normalized.includes('/payments/')) return 'payment';
  if (normalized.includes('/admin/')) return 'admin';
  if (normalized.includes('/dashboard')) return 'dashboard';
  if (normalized.includes('/resources')) return 'resources';
  if (normalized.includes('/calendar') || normalized.includes('/calender')) return 'calendar';
  if (normalized.includes('/contact')) return 'contact';
  if (normalized.includes('/3dkitchen')) return 'kitchen3d';
  if (normalized.includes('/components/model')) return 'modals';
  if (normalized.includes('/components/pdf')) return 'pdf';
  if (normalized.includes('/components/')) return 'components';

  return 'common';
}

// Helper to check if translation key already exists
function translationExists(section, key) {
  const parts = section.split('.');
  let obj = existingTranslations;

  for (const part of parts) {
    if (!obj[part]) return false;
    obj = obj[part];
  }

  return obj.hasOwnProperty(key);
}

// Helper to get nested value
function getNestedValue(obj, path) {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (!current[part]) return undefined;
    current = current[part];
  }
  return current;
}

// Helper to set nested value
function setNestedValue(obj, path, value) {
  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part]) {
      current[part] = {};
    }
    current = current[part];
  }

  current[parts[parts.length - 1]] = value;
}

// Process hardcoded strings and generate translation mapping
function processHardcodedStrings() {
  console.log('🔄 Processing hardcoded strings from audit report...\n');

  const allFiles = [
    ...auditReport.filesWithoutTranslation,
    ...auditReport.filesWithPartialTranslation
  ];

  for (const fileInfo of allFiles) {
    const section = getSectionFromPath(fileInfo.path);
    const hardcodedStrings = auditReport.potentialHardcodedStrings[fileInfo.path] || [];

    if (!newTranslations[fileInfo.path]) {
      newTranslations[fileInfo.path] = {
        section,
        translations: {}
      };
    }

    for (const str of hardcodedStrings) {
      // Skip very short strings or technical strings
      if (str.length < 3) continue;
      if (/^[A-Z_]+$/.test(str)) continue; // CONSTANT_CASE
      if (/^\d+$/.test(str)) continue; // Pure numbers
      if (str.includes('{') && str.includes('}')) {
        // Contains interpolation - keep it but clean up
      }

      const baseKey = generateKeyFromString(str);
      let key = baseKey;
      let counter = 1;

      // Ensure unique key within section
      while (translationExists(section, key)) {
        // Check if existing translation matches
        const fullPath = `${section}.${key}`;
        const existing = getNestedValue(existingTranslations, fullPath);
        if (existing === str) {
          // Already exists with same value, use it
          newTranslations[fileInfo.path].translations[str] = `${section}.${key}`;
          break;
        }
        key = `${baseKey}_${counter}`;
        counter++;
      }

      newTranslations[fileInfo.path].translations[str] = `${section}.${key}`;

      // Add to newTranslations to be added to locale file
      setNestedValue(existingTranslations, `${section}.${key}`, str);
    }
  }
}

// Update component files to use translations
function updateComponentFile(filePath, translationMap) {
  const fullPath = path.join(SOURCE_DIR, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const hasTranslation = content.includes('useTranslation');

  // Add useTranslation hook if not present
  if (!hasTranslation) {
    // Find React import
    const reactImportMatch = content.match(/import React[^;]*;/);
    if (reactImportMatch) {
      const importPosition = reactImportMatch.index + reactImportMatch[0].length;
      content = content.slice(0, importPosition) +
        "\nimport { useTranslation } from 'react-i18next';" +
        content.slice(importPosition);
    }

    // Add const { t } inside component
    const componentMatch = content.match(/const \w+ = \([^)]*\) => {/);
    if (componentMatch) {
      const hookPosition = componentMatch.index + componentMatch[0].length;
      content = content.slice(0, hookPosition) +
        "\n  const { t } = useTranslation();\n" +
        content.slice(hookPosition);
    } else {
      // Try function component
      const funcMatch = content.match(/function \w+\([^)]*\) {/);
      if (funcMatch) {
        const hookPosition = funcMatch.index + funcMatch[0].length;
        content = content.slice(0, hookPosition) +
          "\n  const { t } = useTranslation();\n" +
          content.slice(hookPosition);
      }
    }
  }

  // Replace hardcoded strings with t() calls
  let modifiedCount = 0;
  for (const [str, key] of Object.entries(translationMap)) {
    // Create regex patterns for different contexts
    const patterns = [
      // Button, Heading, Text, etc with direct text
      new RegExp(`(<(?:Button|Heading|Text|FormLabel|MenuItem|Badge|Link)[^>]*>)\\s*${escapeRegex(str)}\\s*(?=<)`, 'g'),
      // Placeholder
      new RegExp(`placeholder=["']${escapeRegex(str)}["']`, 'g'),
      // aria-label
      new RegExp(`aria-label=["']${escapeRegex(str)}["']`, 'g'),
      // String literals in JSX
      new RegExp(`>\\s*["']${escapeRegex(str)}["']\\s*<`, 'g'),
    ];

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      if (pattern.test(content)) {
        if (i === 0) {
          // JSX element content
          content = content.replace(pattern, `$1{t('${key}')}`);
        } else if (i === 1) {
          // placeholder
          content = content.replace(pattern, `placeholder={t('${key}')}`);
        } else if (i === 2) {
          // aria-label
          content = content.replace(pattern, `aria-label={t('${key}')}`);
        } else if (i === 3) {
          // String literal
          content = content.replace(pattern, `>{t('${key}')}<`);
        }
        modifiedCount++;
      }
    }
  }

  if (modifiedCount > 0 && !DRY_RUN) {
    fs.writeFileSync(fullPath, content, 'utf8');
    updatedFiles.push({ path: filePath, changes: modifiedCount });
    return true;
  } else if (modifiedCount > 0) {
    console.log(`  [DRY RUN] Would update: ${filePath} (${modifiedCount} changes)`);
    return false;
  }

  return false;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Save updated locale files
function saveLocaleFiles() {
  if (DRY_RUN) {
    console.log('\n[DRY RUN] Would update locale files with new translations');
    return;
  }

  // Sort keys for readability
  const sortedEn = sortObjectByKeys(existingTranslations);

  // Backup original files
  fs.copyFileSync(LOCALE_FILE_EN, LOCALE_FILE_EN + '.backup');
  fs.copyFileSync(LOCALE_FILE_ES, LOCALE_FILE_ES + '.backup');

  // Write updated English translations
  fs.writeFileSync(LOCALE_FILE_EN, JSON.stringify(sortedEn, null, 2), 'utf8');

  console.log('\n✅ Updated locale files');
  console.log(`   Backup created: ${path.basename(LOCALE_FILE_EN)}.backup`);
}

function sortObjectByKeys(obj) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return obj;
  }

  const sorted = {};
  Object.keys(obj).sort().forEach(key => {
    sorted[key] = sortObjectByKeys(obj[key]);
  });
  return sorted;
}

// Main execution
console.log(DRY_RUN ? '🔍 DRY RUN MODE - No files will be modified\n' : '🚀 Starting translation auto-add process...\n');

// Process strings
processHardcodedStrings();

// Show summary of new translations to be added
console.log('\n📊 Summary of New Translations:\n');
console.log('═══════════════════════════════════════════════════════════');

const sections = {};
for (const [filePath, data] of Object.entries(newTranslations)) {
  const section = data.section;
  if (!sections[section]) {
    sections[section] = 0;
  }
  sections[section] += Object.keys(data.translations).length;
}

for (const [section, count] of Object.entries(sections).sort()) {
  console.log(`${section}: ${count} new translations`);
}

console.log('═══════════════════════════════════════════════════════════\n');

// Save locale files first
saveLocaleFiles();

// Note: File updates are complex and risky to automate
console.log('\n⚠️  IMPORTANT: Automatic component file updates are disabled');
console.log('Please manually update component files using the translation keys shown above.');
console.log('\nNew translation keys have been added to en.json');
console.log('Use the audit report (translation-audit-report.json) to identify which files need updates.\n');

// Generate update instructions
console.log('\n📝 Manual Update Instructions:\n');
console.log('For each file in the audit report:');
console.log('1. Add: import { useTranslation } from "react-i18next"');
console.log('2. Add: const { t } = useTranslation() inside the component');
console.log('3. Replace hardcoded strings with t("section.key") calls');
console.log('4. For placeholders: placeholder={t("section.key")}');
console.log('5. For aria-labels: aria-label={t("section.key")}\n');

console.log(`Translation keys saved to: ${LOCALE_FILE_EN}`);
console.log(`Total sections updated: ${Object.keys(sections).length}`);
console.log(`Total new translation keys: ${Object.values(sections).reduce((a, b) => a + b, 0)}\n`);

process.exit(0);
