#!/usr/bin/env node
/**
 * Translation Audit Script
 * Finds components/pages with missing translations or hardcoded text
 * Usage: node find-missing-translations.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SOURCE_DIR = path.join(__dirname, 'frontend/src');
const LOCALE_FILE = path.join(__dirname, 'frontend/src/i18n/locales/en.json');
const PATTERNS_TO_SEARCH = [
  'pages/**/*.{js,jsx}',
  'components/**/*.{js,jsx}'
];

// Load existing translations
const existingTranslations = JSON.parse(fs.readFileSync(LOCALE_FILE, 'utf8'));

// Flatten translation keys for easy lookup
function flattenKeys(obj, prefix = '') {
  let result = [];
  for (let key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      result = result.concat(flattenKeys(obj[key], fullKey));
    } else {
      result.push(fullKey);
    }
  }
  return result;
}

const allTranslationKeys = flattenKeys(existingTranslations);

// Patterns to detect hardcoded strings
const HARDCODED_PATTERNS = [
  // Button text without translation
  /<Button[^>]*>[\s]*([A-Z][^<]+)</g,
  // Heading without translation
  /<Heading[^>]*>[\s]*([A-Z][^<]+)</g,
  // Text without translation
  /<Text[^>]*>[\s]*([A-Z][^<]+)</g,
  // FormLabel without translation
  /<FormLabel[^>]*>[\s]*([A-Z][^<]+)</g,
  // MenuItem without translation
  /<MenuItem[^>]*>[\s]*([A-Z][^<]+)</g,
  // Placeholder without translation
  /placeholder=["']([A-Za-z][^"']+)["']/g,
  // aria-label without translation
  /aria-label=["']([A-Za-z][^"']+)["']/g,
  // Direct string literals in JSX (excluding imports, comments)
  />[\s]*["']([A-Z][^"']{3,})["'][\s]*</g,
];

// Patterns to skip (already translated)
const SKIP_PATTERNS = [
  /useTranslation/,
  /t\(['"`]/,
  /\{t\(['"`]/,
];

const results = {
  filesWithoutTranslation: [],
  filesWithPartialTranslation: [],
  filesFullyTranslated: [],
  potentialHardcodedStrings: {},
  duplicateKeys: [],
  statistics: {
    totalFiles: 0,
    filesWithTranslation: 0,
    filesWithoutTranslation: 0,
    potentialIssues: 0
  }
};

// Check if file uses translations
function usesTranslation(content) {
  return content.includes('useTranslation') && content.includes('const { t }');
}

// Find hardcoded strings
function findHardcodedStrings(content, filePath) {
  const hardcoded = [];

  // Skip if file uses translation (might still have some hardcoded)
  const hasTranslation = usesTranslation(content);

  for (const pattern of HARDCODED_PATTERNS) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const str = match[1]?.trim();
      if (str && str.length > 2) {
        // Skip common technical strings
        if (!/^(console|import|export|const|let|var|function|return|if|else|className|style)/i.test(str)) {
          // Check if it looks like English text
          if (/^[A-Z]/.test(str) && !/^[A-Z_]+$/.test(str)) {
            hardcoded.push({
              string: str,
              hasTranslation
            });
          }
        }
      }
    }
  }

  return [...new Set(hardcoded.map(h => h.string))];
}

// Process a single file
function processFile(filePath) {
  results.statistics.totalFiles++;

  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(SOURCE_DIR, filePath);

  const hasTranslation = usesTranslation(content);
  const hardcodedStrings = findHardcodedStrings(content, filePath);

  const fileInfo = {
    path: relativePath,
    hasTranslation,
    hardcodedStrings: hardcodedStrings.length,
    examples: hardcodedStrings.slice(0, 5) // First 5 examples
  };

  if (hasTranslation) {
    results.statistics.filesWithTranslation++;
    if (hardcodedStrings.length > 0) {
      results.filesWithPartialTranslation.push(fileInfo);
      results.potentialHardcodedStrings[relativePath] = hardcodedStrings;
      results.statistics.potentialIssues += hardcodedStrings.length;
    } else {
      results.filesFullyTranslated.push(fileInfo);
    }
  } else {
    results.statistics.filesWithoutTranslation++;
    if (hardcodedStrings.length > 0) {
      results.filesWithoutTranslation.push(fileInfo);
      results.potentialHardcodedStrings[relativePath] = hardcodedStrings;
      results.statistics.potentialIssues += hardcodedStrings.length;
    }
  }
}

// Find duplicate translation keys
function findDuplicates() {
  const seen = {};
  const duplicates = [];

  function traverse(obj, path = '') {
    for (let key in obj) {
      const fullPath = path ? `${path}.${key}` : key;
      const value = obj[key];

      if (typeof value === 'string') {
        if (seen[value]) {
          duplicates.push({
            key1: seen[value],
            key2: fullPath,
            value: value
          });
        } else {
          seen[value] = fullPath;
        }
      } else if (typeof value === 'object' && value !== null) {
        traverse(value, fullPath);
      }
    }
  }

  traverse(existingTranslations);
  return duplicates;
}

// Helper function to recursively get files
function getFiles(dir, extensions = ['.js', '.jsx']) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

// Main execution
console.log('🔍 Scanning for missing translations...\n');

// Process all files
const pagesDir = path.join(SOURCE_DIR, 'pages');
const componentsDir = path.join(SOURCE_DIR, 'components');

const files = [
  ...getFiles(pagesDir),
  ...getFiles(componentsDir)
];

files.forEach(processFile);

// Find duplicates
results.duplicateKeys = findDuplicates();

// Generate report
console.log('📊 Translation Audit Report\n');
console.log('═══════════════════════════════════════════════════════════');
console.log(`Total files scanned: ${results.statistics.totalFiles}`);
console.log(`Files with translation: ${results.statistics.filesWithTranslation}`);
console.log(`Files without translation: ${results.statistics.filesWithoutTranslation}`);
console.log(`Potential hardcoded strings: ${results.statistics.potentialIssues}`);
console.log(`Duplicate translation values: ${results.duplicateKeys.length}`);
console.log('═══════════════════════════════════════════════════════════\n');

// Files without any translation
if (results.filesWithoutTranslation.length > 0) {
  console.log('⚠️  FILES WITHOUT TRANSLATION SETUP:\n');
  results.filesWithoutTranslation
    .sort((a, b) => b.hardcodedStrings - a.hardcodedStrings)
    .forEach((file, idx) => {
      console.log(`${idx + 1}. ${file.path}`);
      console.log(`   Hardcoded strings: ${file.hardcodedStrings}`);
      if (file.examples.length > 0) {
        console.log(`   Examples: ${file.examples.slice(0, 3).join(', ')}`);
      }
      console.log('');
    });
}

// Files with partial translation
if (results.filesWithPartialTranslation.length > 0) {
  console.log('\n⚠️  FILES WITH PARTIAL TRANSLATION (has useTranslation but also hardcoded strings):\n');
  results.filesWithPartialTranslation
    .sort((a, b) => b.hardcodedStrings - a.hardcodedStrings)
    .forEach((file, idx) => {
      console.log(`${idx + 1}. ${file.path}`);
      console.log(`   Hardcoded strings: ${file.hardcodedStrings}`);
      if (file.examples.length > 0) {
        console.log(`   Examples: ${file.examples.slice(0, 3).join(', ')}`);
      }
      console.log('');
    });
}

// Duplicate keys
if (results.duplicateKeys.length > 0) {
  console.log('\n⚠️  DUPLICATE TRANSLATION VALUES (consider consolidating):\n');
  results.duplicateKeys.slice(0, 20).forEach((dup, idx) => {
    console.log(`${idx + 1}. "${dup.value}"`);
    console.log(`   Key 1: ${dup.key1}`);
    console.log(`   Key 2: ${dup.key2}`);
    console.log('');
  });
  if (results.duplicateKeys.length > 20) {
    console.log(`   ... and ${results.duplicateKeys.length - 20} more duplicates\n`);
  }
}

// Fully translated files (summary)
console.log(`\n✅ Fully translated files: ${results.filesFullyTranslated.length}`);

// Save detailed report
const reportPath = path.join(__dirname, 'translation-audit-report.json');
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`\n📄 Detailed report saved to: ${reportPath}\n`);

// Generate TODO list
console.log('\n📝 RECOMMENDED ACTIONS:\n');
console.log('1. Add useTranslation hook to files without translation setup');
console.log('2. Replace hardcoded strings with t() calls');
console.log('3. Add missing translation keys to en.json');
console.log('4. Consider consolidating duplicate translation values');
console.log('5. Ensure all user-facing text is translatable\n');

// Priority files (most hardcoded strings)
const priorityFiles = [
  ...results.filesWithoutTranslation,
  ...results.filesWithPartialTranslation
]
  .sort((a, b) => b.hardcodedStrings - a.hardcodedStrings)
  .slice(0, 10);

if (priorityFiles.length > 0) {
  console.log('🎯 TOP PRIORITY FILES (most hardcoded strings):\n');
  priorityFiles.forEach((file, idx) => {
    console.log(`${idx + 1}. ${file.path} (${file.hardcodedStrings} strings)`);
  });
  console.log('');
}

process.exit(0);
