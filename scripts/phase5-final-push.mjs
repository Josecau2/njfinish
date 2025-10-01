import fs from 'node:fs';

console.log('🎯 Phase 5: Final Push to Near-Zero !important\n');
console.log('=' .repeat(70));

// Analyze what's left
const files = [
  'frontend/src/responsive.css',
  'frontend/src/main.css',
  'frontend/src/pages/calender/CalendarView.css',
  'frontend/src/tailwind.css',
  'frontend/src/styles/fixes.css'
];

let totalRemoved = 0;

for (const file of files) {
  if (!fs.existsSync(file)) continue;

  // Backup
  const backupFile = file + '.backup-phase5';
  if (!fs.existsSync(backupFile)) {
    fs.copyFileSync(file, backupFile);
  }

  let content = fs.readFileSync(file, 'utf8');
  const originalCount = (content.match(/!important/g) || []).length;

  // Ultra-aggressive: Remove ALL !important except for critical ones
  // We'll keep only: display: none, z-index, and position overrides

  const lines = content.split('\n');
  const newLines = [];

  for (let line of lines) {
    if (line.includes('!important')) {
      // Keep display: none !important (needed for hiding elements reliably)
      if (line.includes('display: none !important') ||
          line.includes('display:none!important')) {
        newLines.push(line);
        continue;
      }

      // Keep z-index !important (needed for stacking contexts)
      if (line.includes('z-index') && line.includes('!important')) {
        newLines.push(line);
        continue;
      }

      // Keep position !important (rarely used but critical when needed)
      if (line.includes('position:') && line.includes('!important')) {
        newLines.push(line);
        continue;
      }

      // Remove !important from everything else
      line = line.replace(/\s*!important/g, '');
    }
    newLines.push(line);
  }

  content = newLines.join('\n');

  const newCount = (content.match(/!important/g) || []).length;
  const removed = originalCount - newCount;
  totalRemoved += removed;

  if (removed > 0) {
    fs.writeFileSync(file, content);
    const fileName = file.split('/').pop();
    console.log(`✓ ${fileName.padEnd(25)} ${originalCount} → ${newCount} (-${removed})`);
  }
}

console.log('\n' + '='.repeat(70));
console.log(`✅ Phase 5 Complete!`);
console.log('='.repeat(70));
console.log(`   Total !important removed: ${totalRemoved}`);
console.log('='.repeat(70));

console.log(`\n⚠️  IMPORTANT: This is an ultra-aggressive removal!`);
console.log(`   Some styles may need !important to override third-party libraries.`);
console.log(`   Test thoroughly and restore if needed from .backup-phase5 files.`);
console.log(`\n📝 Next steps:`);
console.log(`   1. Run: npm run build`);
console.log(`   2. Test THOROUGHLY (calendar, forms, mobile views)`);
console.log(`   3. Run: node scripts/find-css-overrides.mjs`);
console.log(`   4. If issues: Restore from .backup-phase5 files`);
console.log(``);
