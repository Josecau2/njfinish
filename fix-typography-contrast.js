const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING TYPOGRAPHY & CONTRAST ISSUES\n');
console.log('═'.repeat(80));

// Font size mappings: px/rem -> Chakra tokens
const fontSizeMappings = {
  // Exact matches
  '10px': 'xs',      // 10px
  '11px': 'xs',      // 11px
  '12px': 'xs',      // 12px
  '13px': 'sm',      // 13px
  '14px': 'sm',      // 14px
  '15px': 'md',      // 15px
  '16px': 'md',      // 16px
  '17px': 'lg',      // 17px
  '18px': 'lg',      // 18px
  '19px': 'lg',      // 19px
  '20px': 'xl',      // 20px
  '22px': 'xl',      // 22px
  '24px': '2xl',     // 24px

  '0.6rem': 'xs',    // 9.6px
  '0.65rem': 'xs',   // 10.4px
  '0.7rem': 'xs',    // 11.2px
  '0.75rem': 'xs',   // 12px
  '0.8rem': 'sm',    // 12.8px
  '0.85rem': 'sm',   // 13.6px
  '0.875rem': 'sm',  // 14px
  '0.9rem': 'sm',    // 14.4px
  '0.95rem': 'md',   // 15.2px
  '1rem': 'md',      // 16px
  '1.1rem': 'lg',    // 17.6px
  '1.125rem': 'lg',  // 18px
  '1.2rem': 'lg',    // 19.2px
  '1.25rem': 'xl',   // 20px
  '1.3rem': 'xl',    // 20.8px
  '1.5rem': '2xl',   // 24px
};

// Color mappings: hex -> Chakra tokens
const colorMappings = {
  '#1a73e8': 'blue.500',
  '#0d6efd': 'blue.500',
  '#1d4ed8': 'blue.700',
  '#2b6cb0': 'blue.600',
  '#3182ce': 'blue.500',

  '#198754': 'green.600',
  '#28a745': 'green.500',
  '#e6ffed': 'green.50',

  '#dc3545': 'red.500',
  '#c62828': 'red.600',
  '#ffebee': 'red.50',

  '#f59f00': 'orange.400',

  '#6c757d': 'gray.500',
  '#888': 'gray.500',
};

function findJsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory() && !file.includes('node_modules')) {
      findJsxFiles(filePath, fileList);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const files = findJsxFiles('frontend/src');
let totalFixed = 0;
let filesModified = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Fix fontSize prop with hardcoded values
  Object.entries(fontSizeMappings).forEach(([oldSize, newToken]) => {
    const patterns = [
      new RegExp(`fontSize=["']${oldSize.replace('.', '\\.')}["']`, 'g'),
      new RegExp(`fontSize:\\s*["']${oldSize.replace('.', '\\.')}["']`, 'g'),
    ];

    patterns.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, `fontSize="${newToken}"`);
        modified = true;
        totalFixed++;
      }
    });
  });

  // Fix color prop with hardcoded hex values
  Object.entries(colorMappings).forEach(([hexColor, chakraToken]) => {
    const patterns = [
      new RegExp(`color=["']${hexColor}["']`, 'gi'),
      new RegExp(`color:\\s*["']${hexColor}["']`, 'gi'),
      new RegExp(`bg=["']${hexColor}["']`, 'gi'),
      new RegExp(`backgroundColor:\\s*["']${hexColor}["']`, 'gi'),
    ];

    patterns.forEach(pattern => {
      if (pattern.test(content)) {
        const match = pattern.toString().includes('bg=') ? 'bg=' :
                      pattern.toString().includes('backgroundColor') ? 'backgroundColor:' : 'color:';

        if (match === 'bg=') {
          content = content.replace(new RegExp(`bg=["']${hexColor}["']`, 'gi'), `bg="${chakraToken}"`);
        } else if (match === 'backgroundColor:') {
          content = content.replace(new RegExp(`backgroundColor:\\s*["']${hexColor}["']`, 'gi'), `backgroundColor: "${chakraToken}"`);
        } else {
          content = content.replace(new RegExp(`color=["']${hexColor}["']`, 'gi'), `color="${chakraToken}"`);
          content = content.replace(new RegExp(`color:\\s*["']${hexColor}["']`, 'gi'), `color: "${chakraToken}"`);
        }
        modified = true;
        totalFixed++;
      }
    });
  });

  if (modified) {
    fs.writeFileSync(file, content);
    filesModified++;
    const relPath = path.relative('frontend/src', file);
    console.log(`✅ Fixed: ${relPath}`);
  }
});

console.log('\n\n📊 SUMMARY:');
console.log('═'.repeat(80));
console.log(`Files Modified: ${filesModified}`);
console.log(`Total Fixes Applied: ${totalFixed}`);
console.log('\n✅ Typography and contrast fixes complete!');
console.log('\nNext steps:');
console.log('1. Run: npm run build');
console.log('2. Test the app visually');
console.log('3. Run: node audit-typography-contrast.js (to verify remaining issues)');
