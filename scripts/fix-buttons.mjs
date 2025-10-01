#!/usr/bin/env node
/**
 * Safe Button Tap Target Fix Script
 * Adds minH to buttons that don't have it
 */

import fg from 'fast-glob';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

let fixCount = 0;

// Files to fix
const filesToFix = await fg([
  'frontend/src/**/*.{jsx,tsx}',
  '!frontend/src/**/*.test.{jsx,tsx}',
  '!frontend/src/**/*.spec.{jsx,tsx}',
], { cwd: root });

console.log(`🔧 Fixing button tap targets in ${filesToFix.length} files...\n`);

for (const filePath of filesToFix) {
  const fullPath = path.join(root, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  const originalContent = content;

  // Fix 1: Add minH to <Button> on same line that doesn't have it
  // Only match buttons that are on a single line with closing >
  // Pattern: <Button ...props>
  const buttonSingleLineRegex = /<Button\s+([^>]*?)>/g;

  content = content.replace(buttonSingleLineRegex, (match, props) => {
    // Skip if already has minH
    if (props.includes('minH')) {
      return match;
    }
    // Skip if it's likely multiline (has newline)
    if (match.includes('\n')) {
      return match;
    }
    modified = true;
    fixCount++;
    return `<Button ${props} minH="44px">`;
  });

  // Fix 2: Add minW and minH to <IconButton> on same line
  const iconButtonSingleLineRegex = /<IconButton\s+([^>]*?)>/g;

  content = content.replace(iconButtonSingleLineRegex, (match, props) => {
    // Skip if already has minW and minH
    if (props.includes('minW') && props.includes('minH')) {
      return match;
    }
    // Skip if it's likely multiline (has newline)
    if (match.includes('\n')) {
      return match;
    }

    let newProps = props;
    if (!props.includes('minW')) {
      newProps += ' minW="44px"';
    }
    if (!props.includes('minH')) {
      newProps += ' minH="44px"';
    }

    if (newProps !== props) {
      modified = true;
      fixCount++;
    }
    return `<IconButton ${newProps}>`;
  });

  // Only write if modified
  if (modified && content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed: ${filePath}`);
  }
}

console.log(`\n✅ Completed! Fixed ${fixCount} button tap target instances.\n`);
