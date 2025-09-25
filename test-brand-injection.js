// Test the withBrandInline function directly
const fs = require('fs');
const { withBrandInline } = require('./server/middleware/withBrandInline');

console.log('=== TESTING withBrandInline FUNCTION ===');

// Read the actual build/index.html file
const html = fs.readFileSync('./build/index.html', 'utf8');
console.log('1. Original HTML length:', html.length);
console.log('2. Contains BRAND_INLINE placeholder:', html.includes('<!--BRAND_INLINE-->'));

// Apply the withBrandInline function
const result = withBrandInline(html);
console.log('3. Result HTML length:', result.length);
console.log('4. Result contains window.__BRAND__:', result.includes('window.__BRAND__'));
console.log('5. Result contains custom background:', result.includes('#443131'));

if (result.length > html.length) {
  console.log('✅ Brand injection is working - content was added');
  const added = result.length - html.length;
  console.log('   Added', added, 'characters');
} else {
  console.log('❌ Brand injection failed - no content added');
}

// Test if inline file is readable
try {
  const inlineContent = fs.readFileSync('./public/brand/inline.html', 'utf8');
  console.log('6. Inline file length:', inlineContent.length);
  console.log('7. Inline contains window.__BRAND__:', inlineContent.includes('window.__BRAND__'));
} catch (e) {
  console.log('6. ❌ Cannot read inline file:', e.message);
}

console.log('\n=== SUMMARY ===');
if (result.includes('window.__BRAND__')) {
  console.log('✅ withBrandInline function is working correctly');
} else {
  console.log('❌ withBrandInline function is NOT working');
}