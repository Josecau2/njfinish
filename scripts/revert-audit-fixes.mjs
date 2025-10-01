#!/usr/bin/env node
/**
 * Revert Automated UI Violations Fix Script
 * Reverses changes made by fix-audit-violations.mjs
 */

import fg from 'fast-glob';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

let revertCount = 0;

// Reverse color mapping - Chakra tokens back to hex
const colorReverseMap = {
  'blue.600': '#321fdb',
  'white': '#ffffff',
  'black': '#000000',
  'gray.50': '#f8f9fa',
  'gray.100': '#e9ecef',
  'gray.200': '#dee2e6',
  'gray.300': '#ced4da',
  'gray.400': '#adb5bd',
  'gray.500': '#6c757d',
  'gray.600': '#495057',
  'gray.700': '#343a40',
  'gray.800': '#212529',
  'gray.900': '#0f172a',
  'blue.500': '#0d6efd',
  'green.500': '#198754',
  'red.500': '#dc3545',
  'red.600': '#bb2d3b',
  'yellow.400': '#ffc107',
  'teal.400': '#20c997',
  'cyan.400': '#0dcaf0',
  'blue.100': '#d0e6ff',
  'purple.500': '#667eea',
};

// Files to revert
const filesToRevert = await fg([
  'frontend/src/**/*.{jsx,tsx}',
  '!frontend/src/**/*.test.{jsx,tsx}',
  '!frontend/src/**/*.spec.{jsx,tsx}',
], { cwd: root });

console.log(`🔄 Reverting ${filesToRevert.length} files...\n`);

for (const filePath of filesToRevert) {
  const fullPath = path.join(root, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  const originalContent = content;

  // Revert 1: Chakra tokens back to hex colors
  for (const [token, hex] of Object.entries(colorReverseMap)) {
    const tokenRegex = new RegExp(`(["'\`])${token.replace('.', '\\.')}\\1`, 'g');
    if (tokenRegex.test(content)) {
      content = content.replace(tokenRegex, `"${hex}"`);
      modified = true;
      revertCount++;
    }
  }

  // Revert 2: bg prop back to style backgroundColor
  content = content.replace(
    /\s+bg=\{([^}]+)\}/g,
    (match, value) => {
      modified = true;
      revertCount++;
      return ` style={{ backgroundColor: ${value} }}`;
    }
  );

  content = content.replace(
    /\s+bg="([^"]+)"/g,
    (match, value) => {
      modified = true;
      revertCount++;
      return ` style={{ backgroundColor: "${value}" }}`;
    }
  );

  // Revert 3: color prop back to style (only if standalone)
  content = content.replace(
    /(?<!\w)color=\{([^}]+)\}(?!\w)/g,
    (match, value) => {
      modified = true;
      revertCount++;
      return `style={{ color: ${value} }}`;
    }
  );

  content = content.replace(
    /(?<!\w)color="([^"]+)"(?!\w)/g,
    (match, value) => {
      modified = true;
      revertCount++;
      return `style={{ color: "${value}" }}`;
    }
  );

  // Revert 4: fontSize prop back to style (only hardcoded ones we changed)
  const sizeReverseMap = {
    'xs': '12px',
    'sm': '14px',
    'md': '16px',
    'lg': '18px',
    'xl': '20px',
  };

  content = content.replace(
    /fontSize="(xs|sm|md|lg|xl)"/g,
    (match, size) => {
      modified = true;
      revertCount++;
      return `fontSize: "${sizeReverseMap[size]}"`;
    }
  );

  // Revert 5: spacing={4} back to original values (this is tricky, we'll set to 2 as conservative)
  content = content.replace(/spacing\s*=\s*\{4\}/g, (match) => {
    modified = true;
    revertCount++;
    return 'spacing={2}';
  });

  content = content.replace(/gap\s*=\s*\{4\}/g, (match) => {
    modified = true;
    revertCount++;
    return 'gap={2}';
  });

  // Revert 6: Remove minH from buttons that we added
  content = content.replace(
    /<Button\s+([^>]*)\s+minH="44px">/g,
    (match, attrs) => {
      modified = true;
      revertCount++;
      return `<Button ${attrs}>`;
    }
  );

  // Revert 7: Remove minW/minH from IconButton that we added
  content = content.replace(
    /<IconButton\s+([^>]*)\s+minW="44px"\s+minH="44px">/g,
    (match, attrs) => {
      modified = true;
      revertCount++;
      return `<IconButton ${attrs}>`;
    }
  );

  // Revert 8: Remove ModalOverlay we added (only the standalone ones)
  content = content.replace(
    /(<Modal[^>]*isOpen[^>]*>\s*)<ModalOverlay \/>\s*\n\s*(<ModalContent)/g,
    (match, modalOpen, modalContent) => {
      modified = true;
      revertCount++;
      return `${modalOpen}${modalContent}`;
    }
  );

  // Revert 9: Remove scrollBehavior from Modal
  content = content.replace(
    /<Modal\s+([^>]*)scrollBehavior="inside"([^>]*)>/g,
    (match, before, after) => {
      modified = true;
      revertCount++;
      return `<Modal ${before}${after}>`.replace(/\s+/g, ' ');
    }
  );

  // Revert 10: Restore TODO comments we added (remove them)
  content = content.replace(/\/\* TODO: Use [^*]+ \*\/\s*/g, (match) => {
    modified = true;
    revertCount++;
    return '';
  });

  // Only write if modified
  if (modified && content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Reverted: ${filePath}`);
  }
}

console.log(`\n✅ Completed! Reverted ${revertCount} changes.\n`);
console.log(`📝 Your code has been restored to its original state.`);
console.log(`⚠️  Note: Some complex changes may need manual review.\n`);
