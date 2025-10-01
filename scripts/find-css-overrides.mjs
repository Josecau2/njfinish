import fg from 'fast-glob';
import fs from 'node:fs';

const cssFiles = await fg(['frontend/src/**/*.css', 'frontend/src/**/*.scss', 'src/**/*.css', 'src/**/*.scss']);
const overrides = [];

for (const file of cssFiles) {
  const content = fs.readFileSync(file, 'utf8');

  // Find !important declarations
  const importantMatches = [...content.matchAll(/!important/g)];
  if (importantMatches.length > 0) {
    overrides.push({ file, count: importantMatches.length, type: '!important' });
  }

  // Find high specificity selectors (multiple classes/IDs)
  const specificityMatches = [...content.matchAll(/([.#][a-zA-Z-_]+){4,}/g)];
  if (specificityMatches.length > 0) {
    overrides.push({ file, count: specificityMatches.length, type: 'high-specificity' });
  }
}

console.log('\n🔍 CSS Override Issues Found:\n');
if (overrides.length === 0) {
  console.log('✅ No major CSS override issues detected');
} else {
  console.table(overrides);
}
