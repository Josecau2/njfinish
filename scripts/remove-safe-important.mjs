import fs from 'node:fs';

const file = 'frontend/src/responsive.css';
const backupFile = file + '.backup';

// Backup original file
fs.copyFileSync(file, backupFile);
console.log(`✅ Backup created: ${backupFile}\n`);

let content = fs.readFileSync(file, 'utf8');
const originalImportantCount = (content.match(/!important/g) || []).length;

console.log(`📊 Original !important count: ${originalImportantCount}\n`);
console.log('🔧 Applying safe removals...\n');

let removalCount = 0;

// 1. Remove !important from overflow-x (safe because it's in reset.css)
const beforeOverflow = (content.match(/!important/g) || []).length;
content = content.replace(/overflow-x:\s*hidden\s*!important;/g, 'overflow-x: hidden;');
content = content.replace(/overflow-y:\s*hidden\s*!important;/g, 'overflow-y: hidden;');
const afterOverflow = (content.match(/!important/g) || []).length;
const overflowRemoved = beforeOverflow - afterOverflow;
console.log(`   Overflow rules: -${overflowRemoved} !important`);
removalCount += overflowRemoved;

// 2. Remove !important from box-sizing (safe because it's in reset.css)
const beforeBoxSizing = (content.match(/!important/g) || []).length;
content = content.replace(/box-sizing:\s*border-box\s*!important;/g, 'box-sizing: border-box;');
const afterBoxSizing = (content.match(/!important/g) || []).length;
const boxSizingRemoved = beforeBoxSizing - afterBoxSizing;
console.log(`   Box-sizing rules: -${boxSizingRemoved} !important`);
removalCount += boxSizingRemoved;

// 3. Remove !important from max-width: 100vw (safe, no conflicts)
const beforeMaxWidth = (content.match(/!important/g) || []).length;
content = content.replace(/max-width:\s*100vw\s*!important;/g, 'max-width: 100vw;');
content = content.replace(/max-width:\s*100%\s*!important;/g, 'max-width: 100%;');
const afterMaxWidth = (content.match(/!important/g) || []).length;
const maxWidthRemoved = beforeMaxWidth - afterMaxWidth;
console.log(`   Max-width rules: -${maxWidthRemoved} !important`);
removalCount += maxWidthRemoved;

// 4. Remove !important from -webkit-font-smoothing and -moz-osx-font-smoothing
const beforeFontSmoothing = (content.match(/!important/g) || []).length;
content = content.replace(/-webkit-font-smoothing:\s*antialiased\s*!important;/g, '-webkit-font-smoothing: antialiased;');
content = content.replace(/-moz-osx-font-smoothing:\s*grayscale\s*!important;/g, '-moz-osx-font-smoothing: grayscale;');
const afterFontSmoothing = (content.match(/!important/g) || []).length;
const fontSmoothingRemoved = beforeFontSmoothing - afterFontSmoothing;
console.log(`   Font-smoothing rules: -${fontSmoothingRemoved} !important`);
removalCount += fontSmoothingRemoved;

// 5. Remove !important from margin: 0 and padding: 0 where safe
// Only for body and root elements, not utilities
const lines = content.split('\n');
const processedLines = lines.map(line => {
  // Check if we're in a body/html/root context (simple heuristic)
  if (line.includes('margin: 0 !important') || line.includes('padding: 0 !important')) {
    // Only remove if it's a simple reset (not in a utility class)
    if (!line.includes('.') && !line.includes('#')) {
      return line.replace(/margin:\s*0\s*!important;/g, 'margin: 0;')
                 .replace(/padding:\s*0\s*!important;/g, 'padding: 0;');
    }
  }
  return line;
});
content = processedLines.join('\n');

const finalImportantCount = (content.match(/!important/g) || []).length;
const totalRemoved = originalImportantCount - finalImportantCount;

// Save the cleaned file
fs.writeFileSync(file, content);

console.log(`\n${'='.repeat(60)}`);
console.log(`✅ Refactoring complete!`);
console.log(`${'='.repeat(60)}`);
console.log(`   Original: ${originalImportantCount} !important declarations`);
console.log(`   Removed:  ${totalRemoved}`);
console.log(`   Remaining: ${finalImportantCount}`);
console.log(`   Reduction: ${((totalRemoved / originalImportantCount) * 100).toFixed(1)}%`);
console.log(`${'='.repeat(60)}\n`);
console.log(`📝 File updated: ${file}`);
console.log(`💾 Backup saved: ${backupFile}`);
console.log(`\n⚠️  Next steps:`);
console.log(`   1. Run: npm run build`);
console.log(`   2. Test the app visually`);
console.log(`   3. If issues: cp ${backupFile} ${file}`);
console.log(``);
