#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Checking for @coreui imports in the codebase...\n');

// Function to find all JavaScript/TypeScript files
function findFiles(dir, extensions = ['.js', '.jsx', '.ts', '.tsx']) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

// Find all relevant files
const frontendDir = path.join(__dirname, 'frontend', 'src');
const files = findFiles(frontendDir);

console.log(`📁 Found ${files.length} JavaScript/TypeScript files to check\n`);

let totalImports = 0;
const importLocations = {};

for (const file of files) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('@coreui/')) {
        const relativePath = path.relative(process.cwd(), file);
        if (!importLocations[relativePath]) {
          importLocations[relativePath] = [];
        }
        importLocations[relativePath].push({
          line: i + 1,
          content: line.trim()
        });
        totalImports++;
      }
    }
  } catch (error) {
    console.warn(`⚠️  Could not read file: ${file}`);
  }
}

console.log(`📊 Total @coreui imports found: ${totalImports}\n`);

if (totalImports > 0) {
  console.log('📍 Locations:');
  console.log('='.repeat(80));

  for (const [file, locations] of Object.entries(importLocations)) {
    console.log(`\n📄 ${file} (${locations.length} imports):`);
    for (const location of locations) {
      console.log(`  Line ${location.line}: ${location.content}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`❌ Migration Status: ${totalImports} @coreui imports remaining`);
  console.log('💡 Continue migrating CoreUI components to Chakra UI');
} else {
  console.log('✅ Migration Complete: No @coreui imports found!');
  console.log('🎉 All components have been successfully migrated to Chakra UI');
}

console.log('\n🔧 To migrate remaining components, run:');
console.log('   node scripts/migrate-coreui.js [component-name]');