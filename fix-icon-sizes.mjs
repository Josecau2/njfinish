#!/usr/bin/env node
/**
 * Fix Icon Sizing Issues - CRITICAL-4 UI/UX Audit
 *
 * This script fixes all icon sizing issues across the codebase by:
 * 1. Replacing size={16}, size={18}, size={20} with ICON_SIZE_MD (24px)
 * 2. Replacing boxSize={4}, boxSize={5} with ICON_BOX_MD (6 = 24px)
 * 3. Adding imports for icon size constants where needed
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Files we've already fixed manually
const ALREADY_FIXED = [
  'AppHeader.js',
  'AppSidebar.js',
  'AppSidebarNav.js',
  'AppHeaderDropdown.js',
];

// Track statistics
const stats = {
  filesProcessed: 0,
  filesModified: 0,
  size16Fixed: 0,
  size18Fixed: 0,
  size20Fixed: 0,
  boxSize4Fixed: 0,
  boxSize5Fixed: 0,
  importsAdded: 0,
};

// Determine which import to add based on what's being replaced
function determineNeededImports(content) {
  const needsMD = /size=\{(16|18|20)\}/.test(content) || /boxSize=\{(4|5)\}/.test(content);
  const needsSM = false; // We're not using SM in this fix
  const needsXS = false; // We're not using XS in this fix

  return { needsMD, needsSM, needsXS };
}

// Add import statement if not already present
function addIconSizeImport(content, filePath) {
  const { needsMD } = determineNeededImports(content);

  if (!needsMD) {
    return content;
  }

  // Check if already has the import
  if (content.includes('ICON_SIZE_MD') || content.includes('ICON_BOX_MD')) {
    return content;
  }

  // Determine relative path to constants
  const fileDir = path.dirname(filePath);
  const constantsPath = path.join(__dirname, 'frontend', 'src', 'constants', 'iconSizes.js');
  let relativePath = path.relative(fileDir, constantsPath)
    .replace(/\\/g, '/') // Convert Windows paths to Unix
    .replace(/\.js$/, ''); // Remove .js extension

  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }

  // Find all import statements - handle both single and multiline imports
  const lines = content.split('\n');
  let lastImportLineIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('import ')) {
      lastImportLineIndex = i;
      // Check for multiline imports
      if (!line.includes('from') || !line.endsWith('}')) {
        // Continue scanning for end of multiline import
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].includes('from')) {
            lastImportLineIndex = j;
            break;
          }
        }
      }
    }
  }

  if (lastImportLineIndex === -1) {
    // No imports found, add at the top
    return `import { ICON_SIZE_MD, ICON_BOX_MD } from '${relativePath}'\n\n${content}`;
  }

  // Insert the import after the last import line
  const importStatement = `import { ICON_SIZE_MD, ICON_BOX_MD } from '${relativePath}'`;
  lines.splice(lastImportLineIndex + 1, 0, importStatement);

  stats.importsAdded++;
  return lines.join('\n');
}

// Fix icon sizes in content
function fixIconSizes(content) {
  let modified = false;
  let newContent = content;

  // Fix Lucide icon sizes (size={16}, size={18}, size={20})
  const size16Matches = (content.match(/size=\{16\}/g) || []).length;
  const size18Matches = (content.match(/size=\{18\}/g) || []).length;
  const size20Matches = (content.match(/size=\{20\}/g) || []).length;

  if (size16Matches > 0) {
    newContent = newContent.replace(/size=\{16\}/g, 'size={ICON_SIZE_MD}');
    stats.size16Fixed += size16Matches;
    modified = true;
  }

  if (size18Matches > 0) {
    newContent = newContent.replace(/size=\{18\}/g, 'size={ICON_SIZE_MD}');
    stats.size18Fixed += size18Matches;
    modified = true;
  }

  if (size20Matches > 0) {
    newContent = newContent.replace(/size=\{20\}/g, 'size={ICON_SIZE_MD}');
    stats.size20Fixed += size20Matches;
    modified = true;
  }

  // Fix Chakra Icon boxSize (boxSize={4}, boxSize={5})
  const boxSize4Matches = (content.match(/boxSize=\{4\}/g) || []).length;
  const boxSize5Matches = (content.match(/boxSize=\{5\}/g) || []).length;

  if (boxSize4Matches > 0) {
    newContent = newContent.replace(/boxSize=\{4\}/g, 'boxSize={ICON_BOX_MD}');
    stats.boxSize4Fixed += boxSize4Matches;
    modified = true;
  }

  if (boxSize5Matches > 0) {
    newContent = newContent.replace(/boxSize=\{5\}/g, 'boxSize={ICON_BOX_MD}');
    stats.boxSize5Fixed += boxSize5Matches;
    modified = true;
  }

  return { content: newContent, modified };
}

// Process a single file
function processFile(filePath) {
  const fileName = path.basename(filePath);

  // Skip already fixed files
  if (ALREADY_FIXED.includes(fileName)) {
    console.log(`⏭️  Skipping ${fileName} (already fixed manually)`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // Check if file has any icon sizing issues
  if (!/size=\{(16|18|20)\}/.test(content) && !/boxSize=\{(4|5)\}/.test(content)) {
    return; // Nothing to fix
  }

  stats.filesProcessed++;

  // Fix icon sizes
  const { content: fixedContent, modified } = fixIconSizes(content);

  if (!modified) {
    return;
  }

  // Add import if needed
  const finalContent = addIconSizeImport(fixedContent, filePath);

  // Write back to file
  fs.writeFileSync(filePath, finalContent, 'utf8');
  stats.filesModified++;

  console.log(`✅ Fixed ${fileName}`);
}

// Recursively find all JS/JSX files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, build, dist, etc.
      if (!['node_modules', 'build', 'dist', '.git'].includes(file)) {
        findFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Main execution
function main() {
  console.log('🔧 Starting icon size fixes...\n');

  const srcDir = path.join(__dirname, 'frontend', 'src');
  const files = findFiles(srcDir);

  console.log(`Found ${files.length} JS/JSX files\n`);

  files.forEach(processFile);

  console.log('\n📊 Summary:');
  console.log(`   Files processed: ${stats.filesProcessed}`);
  console.log(`   Files modified: ${stats.filesModified}`);
  console.log(`   Imports added: ${stats.importsAdded}`);
  console.log(`\n🔧 Icon fixes:`);
  console.log(`   size={16} → size={ICON_SIZE_MD}: ${stats.size16Fixed} replacements`);
  console.log(`   size={18} → size={ICON_SIZE_MD}: ${stats.size18Fixed} replacements`);
  console.log(`   size={20} → size={ICON_SIZE_MD}: ${stats.size20Fixed} replacements`);
  console.log(`   boxSize={4} → boxSize={ICON_BOX_MD}: ${stats.boxSize4Fixed} replacements`);
  console.log(`   boxSize={5} → boxSize={ICON_BOX_MD}: ${stats.boxSize5Fixed} replacements`);
  console.log(`\n✅ Total icon size fixes: ${stats.size16Fixed + stats.size18Fixed + stats.size20Fixed + stats.boxSize4Fixed + stats.boxSize5Fixed}`);
}

main();
