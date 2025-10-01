import fs from 'node:fs';

const file = 'frontend/src/responsive.css';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const categories = {
  layout: [],
  overflow: [],
  sizing: [],
  spacing: [],
  display: [],
  positioning: [],
  colors: [],
  typography: [],
  borders: [],
  other: []
};

const patterns = {
  layout: /flex|grid|align|justify/i,
  overflow: /overflow|scroll/i,
  sizing: /width|height|max-|min-/i,
  spacing: /padding|margin/i,
  display: /display|visibility|opacity/i,
  positioning: /position|top|left|right|bottom|z-index/i,
  colors: /color|background/i,
  typography: /font|text|line-height/i,
  borders: /border|outline|shadow/i,
};

lines.forEach((line, idx) => {
  if (line.includes('!important')) {
    let categorized = false;

    for (const [category, pattern] of Object.entries(patterns)) {
      if (pattern.test(line)) {
        categories[category].push({ line: idx + 1, content: line.trim() });
        categorized = true;
        break;
      }
    }

    if (!categorized) {
      categories.other.push({ line: idx + 1, content: line.trim() });
    }
  }
});

console.log('\n📊 !important Usage Analysis for responsive.css\n');
console.log('=' .repeat(80));

Object.entries(categories).forEach(([category, items]) => {
  if (items.length > 0) {
    console.log(`\n${category.toUpperCase()}: ${items.length} instances`);
    console.log('-'.repeat(80));
    items.slice(0, 5).forEach(item => {
      console.log(`  Line ${item.line}: ${item.content.substring(0, 70)}...`);
    });
    if (items.length > 5) {
      console.log(`  ... and ${items.length - 5} more`);
    }
  }
});

console.log('\n' + '='.repeat(80));
console.log(`\nTOTAL: ${Object.values(categories).reduce((sum, cat) => sum + cat.length, 0)} !important declarations\n`);

// Recommendations
console.log('💡 RECOMMENDATIONS:\n');
console.log('1. OVERFLOW (high priority): Move to CSS reset and remove !important');
console.log('2. LAYOUT (medium): Increase specificity using :where() pseudo-class');
console.log('3. SPACING (medium): Use Chakra spacing props instead of CSS');
console.log('4. SIZING (low): Many needed for mobile responsiveness, can stay for now\n');
