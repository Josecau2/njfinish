#!/usr/bin/env node
/**
 * Add Icon Size Imports
 *
 * This script adds the necessary imports for ICON_SIZE_MD and ICON_BOX_MD
 * to files that use these constants but don't have the imports.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const stats = {
  filesChecked: 0,
  importsAdded: 0,
  alreadyHadImport: 0,
};

function addIconSizeImport(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Check if file uses ICON_SIZE_MD or ICON_BOX_MD
  if (!content.includes('ICON_SIZE_MD') && !content.includes('ICON_BOX_MD')) {
    return; // Doesn't use the constants
  }

  stats.filesChecked++;

  // Check if already has the import
  if (content.includes("from '../constants/iconSizes") ||
      content.includes("from '../../constants/iconSizes") ||
      content.includes("from '../../../constants/iconSizes") ||
      content.includes("from '../../../../constants/iconSizes") ||
      content.includes("from '../../../../../constants/iconSizes")) {
    stats.alreadyHadImport++;
    return;
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

  // Find all import statements
  const lines = content.split('\n');
  let lastImportLineIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('import ')) {
      lastImportLineIndex = i;
      // Check for multiline imports
      if (!line.includes('from')) {
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
    console.log(`⚠️  No imports found in ${path.basename(filePath)}`);
    return;
  }

  // Insert the import after the last import line
  const importStatement = `import { ICON_SIZE_MD, ICON_BOX_MD } from '${relativePath}'`;
  lines.splice(lastImportLineIndex + 1, 0, importStatement);

  // Write back to file
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  stats.importsAdded++;

  console.log(`✅ Added import to ${path.basename(filePath)}`);
}

// Recursively find all JS/JSX files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!['node_modules', 'build', 'dist', '.git'].includes(file)) {
        findFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function main() {
  console.log('📦 Adding icon size imports...\n');

  const srcDir = path.join(__dirname, 'frontend', 'src');
  const files = findFiles(srcDir);

  files.forEach(addIconSizeImport);

  console.log('\n📊 Summary:');
  console.log(`   Files checked: ${stats.filesChecked}`);
  console.log(`   Imports added: ${stats.importsAdded}`);
  console.log(`   Already had import: ${stats.alreadyHadImport}`);
}

main();
