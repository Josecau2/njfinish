#!/usr/bin/env node
/**
 * Automated UI Violations Fix Script
 * Fixes violations found by audit-ui-consistency.mjs
 */

import fg from 'fast-glob';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

let fixCount = 0;

// Color mapping from hex to Chakra tokens
const colorMap = {
  '#321fdb': 'blue.600',
  '#ffffff': 'white',
  '#fff': 'white',
  '#000000': 'black',
  '#000': 'black',
  '#f8f9fa': 'gray.50',
  '#dee2e6': 'gray.200',
  '#ced4da': 'gray.300',
  '#adb5bd': 'gray.400',
  '#6c757d': 'gray.500',
  '#495057': 'gray.600',
  '#343a40': 'gray.700',
  '#212529': 'gray.800',
  '#0d6efd': 'blue.500',
  '#0b5ed7': 'blue.600',
  '#198754': 'green.500',
  '#dc3545': 'red.500',
  '#bb2d3b': 'red.600',
  '#ffc107': 'yellow.400',
  '#20c997': 'teal.400',
  '#0dcaf0': 'cyan.400',
  '#d0e6ff': 'blue.100',
  '#1a73e8': 'blue.500',
  '#e9ecef': 'gray.100',
  '#f1f3f5': 'gray.50',
  '#667eea': 'purple.500',
  '#0e1446': 'gray.900',
  '#2d3748': 'gray.700',
  '#0f172a': 'gray.900',
  '#ef4444': 'red.500',
  '#dc2626': 'red.600',
};

// Files to fix
const filesToFix = await fg([
  'frontend/src/**/*.{jsx,tsx}',
  '!frontend/src/**/*.test.{jsx,tsx}',
  '!frontend/src/**/*.spec.{jsx,tsx}',
], { cwd: root });

console.log(`🔧 Fixing ${filesToFix.length} files...\n`);

for (const filePath of filesToFix) {
  const fullPath = path.join(root, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  const originalContent = content;

  // Fix 1: Replace hex colors with Chakra tokens
  for (const [hex, token] of Object.entries(colorMap)) {
    const hexRegex = new RegExp(`(["'\`])${hex.replace('#', '#')}\\1`, 'gi');
    if (hexRegex.test(content)) {
      content = content.replace(hexRegex, `"${token}"`);
      modified = true;
      fixCount++;
    }
  }

  // Fix 2: Convert inline style backgroundColor to bg
  content = content.replace(
    /style\s*=\s*\{\{\s*backgroundColor:\s*([^,}]+)/g,
    (match, value) => {
      modified = true;
      fixCount++;
      return `bg=${value}`;
    }
  );

  // Fix 3: Convert inline style color to color prop
  content = content.replace(
    /style\s*=\s*\{\{\s*color:\s*([^,}]+)/g,
    (match, value) => {
      modified = true;
      fixCount++;
      return `color=${value}`;
    }
  );

  // Fix 4: Convert fontSize in style to fontSize prop
  content = content.replace(
    /fontSize:\s*['"](\d+px)['"]/g,
    (match, value) => {
      modified = true;
      fixCount++;
      const sizeMap = {
        '11px': 'xs',
        '12px': 'xs',
        '14px': 'sm',
        '16px': 'md',
        '18px': 'lg',
        '20px': 'xl',
      };
      return `fontSize="${sizeMap[value] || 'sm'}"`;
    }
  );

  // Fix 5: Fix spacing values (2,3 -> 4, etc.)
  content = content.replace(/spacing\s*=\s*\{([123])\}/g, (match, num) => {
    modified = true;
    fixCount++;
    return 'spacing={4}';
  });

  content = content.replace(/gap\s*=\s*\{([123])\}/g, (match, num) => {
    modified = true;
    fixCount++;
    return 'gap={4}';
  });

  // Fix 6: Add minH to small buttons
  content = content.replace(
    /<Button\s+([^>]*size="sm"[^>]*)>/g,
    (match, attrs) => {
      if (!attrs.includes('minH')) {
        modified = true;
        fixCount++;
        return `<Button ${attrs} minH="44px">`;
      }
      return match;
    }
  );

  // Fix 7: Add minW/minH to IconButton
  content = content.replace(
    /<IconButton\s+([^>]*)>/g,
    (match, attrs) => {
      if (!attrs.includes('minW') && !attrs.includes('minH')) {
        modified = true;
        fixCount++;
        return `<IconButton ${attrs} minW="44px" minH="44px">`;
      }
      return match;
    }
  );

  // Fix 8: Add ModalOverlay if missing
  content = content.replace(
    /(<Modal[^>]*isOpen[^>]*>\s*)(<ModalContent)/g,
    (match, modalOpen, modalContent) => {
      if (!match.includes('ModalOverlay')) {
        modified = true;
        fixCount++;
        return `${modalOpen}<ModalOverlay />\n  ${modalContent}`;
      }
      return match;
    }
  );

  // Fix 9: Add scrollBehavior to Modal if missing
  content = content.replace(
    /<Modal\s+([^>]*isOpen[^>]*)>/g,
    (match, attrs) => {
      if (!attrs.includes('scrollBehavior')) {
        modified = true;
        fixCount++;
        return `<Modal ${attrs} scrollBehavior="inside">`;
      }
      return match;
    }
  );

  // Fix 10: Replace Bootstrap flex classes with Chakra
  const bootstrapReplacements = {
    'd-flex': 'display="flex"',
    'd-block': 'display="block"',
    'd-none': 'display="none"',
    'justify-content-between': 'justify="space-between"',
    'justify-content-center': 'justify="center"',
    'justify-content-end': 'justify="flex-end"',
    'align-items-center': 'align="center"',
    'align-items-start': 'align="flex-start"',
    'align-items-end': 'align="flex-end"',
  };

  for (const [bootClass, chakraProp] of Object.entries(bootstrapReplacements)) {
    const regex = new RegExp(`className\\s*=\\s*["'][^"']*\\b${bootClass}\\b[^"']*["']`, 'g');
    if (regex.test(content)) {
      modified = true;
      fixCount++;
      // Remove the bootstrap class and note that Chakra prop should be used
      content = content.replace(
        regex,
        (match) => match.replace(new RegExp(`\\s*${bootClass}\\s*`, 'g'), ' /* TODO: Use ${chakraProp} */ ')
      );
    }
  }

  // Only write if modified
  if (modified && content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed: ${filePath}`);
  }
}

console.log(`\n✅ Completed! Fixed ${fixCount} violations.\n`);
console.log(`📝 Note: Some violations require manual fixes:`);
console.log(`   - Complex inline styles`);
console.log(`   - Custom <style> blocks (need component restructuring)`);
console.log(`   - Bootstrap grid classes (col-*, row)`);
console.log(`   - Component-specific logic\n`);
console.log(`Run audit again to see remaining issues:`);
console.log(`   node scripts/audit-ui-consistency.mjs\n`);
