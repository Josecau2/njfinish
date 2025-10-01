import fs from 'node:fs';

console.log('🚀 Phase 4: Ultra-Aggressive CSS Cleanup\n');
console.log('=' .repeat(70));

const filesToClean = [
  'frontend/src/pages/calender/CalendarView.css',
  'frontend/src/pages/proposals/CreateProposal/ManufacturerSelect.css',
  'frontend/src/responsive.css',
  'frontend/src/main.css'
];

let totalRemoved = 0;
const results = [];

for (const file of filesToClean) {
  if (!fs.existsSync(file)) {
    console.log(`⚠️  File not found: ${file}`);
    continue;
  }

  // Create backup
  const backupFile = file + '.backup-phase4';
  if (!fs.existsSync(backupFile)) {
    fs.copyFileSync(file, backupFile);
  }

  let content = fs.readFileSync(file, 'utf8');
  const originalCount = (content.match(/!important/g) || []).length;

  // Apply aggressive removals - patterns that are almost never needed

  // 1. Margin bottom (can use normal specificity)
  content = content.replace(/margin-bottom:\s*[\d.]+(?:rem|px|em)\s*!important;/g, match =>
    match.replace(' !important', ''));

  // 2. Padding values (rarely need !important)
  content = content.replace(/padding:\s*[\d.]+(?:rem|px|em)(?:\s+[\d.]+(?:rem|px|em))*\s*!important;/g, match =>
    match.replace(' !important', ''));
  content = content.replace(/padding-(?:top|bottom|left|right):\s*[\d.]+(?:rem|px|em)\s*!important;/g, match =>
    match.replace(' !important', ''));

  // 3. Font properties
  content = content.replace(/font-size:\s*[\d.]+(?:rem|px|em)\s*!important;/g, match =>
    match.replace(' !important', ''));
  content = content.replace(/font-weight:\s*\d+\s*!important;/g, match =>
    match.replace(' !important', ''));

  // 4. Border radius
  content = content.replace(/border-radius:\s*[\d.]+(?:rem|px|em)\s*!important;/g, match =>
    match.replace(' !important', ''));

  // 5. Transitions and transforms (never need !important)
  content = content.replace(/transition:\s*[^;]+\s*!important;/g, match =>
    match.replace(' !important', ''));
  content = content.replace(/transform:\s*[^;]+\s*!important;/g, match =>
    match.replace(' !important', ''));

  // 6. Background colors (use higher specificity instead)
  content = content.replace(/background:\s*(?:white|#[a-fA-F0-9]{3,6}|rgba?\([^)]+\))\s*!important;/g, match =>
    match.replace(' !important', ''));
  content = content.replace(/background-color:\s*(?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\))\s*!important;/g, match =>
    match.replace(' !important', ''));

  // 7. Border colors
  content = content.replace(/border-color:\s*(?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\))\s*!important;/g, match =>
    match.replace(' !important', ''));

  // 8. Box shadows (rarely need !important unless fighting a framework)
  content = content.replace(/box-shadow:\s*[^;]+\s*!important;/g, match =>
    match.replace(' !important', ''));

  // 9. Min/max heights and widths
  content = content.replace(/min-height:\s*[\d.]+(?:rem|px|em|vh)\s*!important;/g, match =>
    match.replace(' !important', ''));
  content = content.replace(/max-height:\s*[\d.]+(?:rem|px|em|vh)\s*!important;/g, match =>
    match.replace(' !important', ''));
  content = content.replace(/min-width:\s*[\d.]+(?:rem|px|em|vw)\s*!important;/g, match =>
    match.replace(' !important', ''));

  // 10. Text transform
  content = content.replace(/text-transform:\s*\w+\s*!important;/g, match =>
    match.replace(' !important', ''));

  // 11. Borders
  content = content.replace(/border:\s*(?:none|\d+(?:px|rem|em)\s+solid\s+[^;]+)\s*!important;/g, match =>
    match.replace(' !important', ''));
  content = content.replace(/border-(?:top|bottom|left|right):\s*[^;]+\s*!important;/g, match =>
    match.replace(' !important', ''));

  // 12. Margin auto (can be increased with specificity)
  content = content.replace(/margin:\s*(?:[\d.]+(?:rem|px|em)\s+)?auto(?:\s+[\d.]+(?:rem|px|em))?(?:\s+auto)?\s*!important;/g, match =>
    match.replace(' !important', ''));

  const newCount = (content.match(/!important/g) || []).length;
  const removed = originalCount - newCount;
  totalRemoved += removed;

  fs.writeFileSync(file, content);

  const fileName = file.split('/').pop();
  results.push({
    file: fileName,
    original: originalCount,
    remaining: newCount,
    removed: removed,
    reduction: originalCount > 0 ? ((removed / originalCount) * 100).toFixed(1) + '%' : '0%'
  });
}

console.log('\n📊 Results by File:\n');
console.table(results);

console.log('\n' + '='.repeat(70));
console.log(`✅ Phase 4 Ultra-Cleanup Complete!`);
console.log('='.repeat(70));
console.log(`   Total !important removed: ${totalRemoved}`);
console.log(`   Files cleaned: ${results.length}`);
console.log('='.repeat(70));

console.log(`\n📝 Backups created with .backup-phase4 extension`);
console.log(`\n⚠️  Next steps:`);
console.log(`   1. Run: npm run build`);
console.log(`   2. Test calendar functionality`);
console.log(`   3. Test manufacturer selection`);
console.log(`   4. Run: node scripts/find-css-overrides.mjs`);
console.log(``);
