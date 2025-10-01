import fs from 'node:fs';

const file = 'frontend/src/main.css';
const backupFile = file + '.backup';

// Backup original file
if (!fs.existsSync(backupFile)) {
  fs.copyFileSync(file, backupFile);
  console.log(`✅ Backup created: ${backupFile}\n`);
}

let content = fs.readFileSync(file, 'utf8');
const originalImportantCount = (content.match(/!important/g) || []).length;
const originalLength = content.split('\n').length;

console.log(`📊 Original stats:`);
console.log(`   Lines: ${originalLength}`);
console.log(`   !important: ${originalImportantCount}\n`);

console.log('🔧 Removing CoreUI legacy CSS...\n');

// Remove lines 1-70 which contain CoreUI-specific CSS that's not used
// These include: .c-sidebar-nav hover effects, .sidebar-minimized, .sidebar-brand-narrow
const lines = content.split('\n');

// Find the section to remove (from start to line 70, or until we hit login-page-wrapper)
const loginPageIndex = lines.findIndex(line => line.includes('login-page-wrapper'));

if (loginPageIndex > 0) {
  console.log(`   Found login-page-wrapper at line ${loginPageIndex + 1}`);
  console.log(`   Removing lines 1-${loginPageIndex - 1} (CoreUI legacy sidebar CSS)`);

  // Keep from login-page-wrapper onwards
  const cleanedLines = lines.slice(loginPageIndex - 1);
  content = cleanedLines.join('\n');
} else {
  console.log('   ⚠️  Could not find login-page-wrapper, skipping removal');
}

const newLength = content.split('\n').length;
const newImportantCount = (content.match(/!important/g) || []).length;

const linesRemoved = originalLength - newLength;
const importantRemoved = originalImportantCount - newImportantCount;

// Save cleaned file
fs.writeFileSync(file, content);

console.log(`\n${'='.repeat(60)}`);
console.log(`✅ Cleanup complete!`);
console.log(`${'='.repeat(60)}`);
console.log(`   Lines removed: ${linesRemoved}`);
console.log(`   !important removed: ${importantRemoved}`);
console.log(`   New stats:`);
console.log(`     Lines: ${newLength}`);
console.log(`     !important: ${newImportantCount}`);
console.log(`${'='.repeat(60)}\n`);
console.log(`📝 File updated: ${file}`);
console.log(`💾 Backup: ${backupFile}`);
console.log(`\n⚠️  Next steps:`);
console.log(`   1. Run: npm run build`);
console.log(`   2. Test sidebar functionality`);
console.log(`   3. If issues: cp ${backupFile} ${file}`);
console.log(``);
