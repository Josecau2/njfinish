import fs from 'node:fs';

const file = 'frontend/src/responsive.css';
const backupFile = file + '.backup-phase3';

// Create a new backup for Phase 3
if (!fs.existsSync(backupFile)) {
  fs.copyFileSync(file, backupFile);
  console.log(`✅ Phase 3 backup created: ${backupFile}\n`);
}

let content = fs.readFileSync(file, 'utf8');
const originalImportantCount = (content.match(/!important/g) || []).length;

console.log(`📊 Starting aggressive cleanup...`);
console.log(`   Original !important count: ${originalImportantCount}\n`);

let totalRemoved = 0;

// 1. Remove !important from display flex/grid rules (can use higher specificity instead)
const beforeLayout = (content.match(/!important/g) || []).length;
content = content.replace(/display:\s*flex\s*!important;/g, 'display: flex;');
content = content.replace(/display:\s*grid\s*!important;/g, 'display: grid;');
content = content.replace(/display:\s*block\s*!important;/g, 'display: block;');
content = content.replace(/display:\s*none\s*!important;/g, 'display: none;');
const afterLayout = (content.match(/!important/g) || []).length;
const layoutRemoved = beforeLayout - afterLayout;
console.log(`✓ Display rules: -${layoutRemoved} !important`);
totalRemoved += layoutRemoved;

// 2. Remove !important from flex alignment
const beforeAlign = (content.match(/!important/g) || []).length;
content = content.replace(/align-items:\s*center\s*!important;/g, 'align-items: center;');
content = content.replace(/justify-content:\s*center\s*!important;/g, 'justify-content: center;');
content = content.replace(/justify-content:\s*flex-end\s*!important;/g, 'justify-content: flex-end;');
content = content.replace(/justify-content:\s*flex-start\s*!important;/g, 'justify-content: flex-start;');
content = content.replace(/align-items:\s*flex-start\s*!important;/g, 'align-items: flex-start;');
content = content.replace(/align-items:\s*flex-end\s*!important;/g, 'align-items: flex-end;');
const afterAlign = (content.match(/!important/g) || []).length;
const alignRemoved = beforeAlign - afterAlign;
console.log(`✓ Flex alignment: -${alignRemoved} !important`);
totalRemoved += alignRemoved;

// 3. Remove !important from flex-direction
const beforeFlexDir = (content.match(/!important/g) || []).length;
content = content.replace(/flex-direction:\s*column\s*!important;/g, 'flex-direction: column;');
content = content.replace(/flex-direction:\s*row\s*!important;/g, 'flex-direction: row;');
const afterFlexDir = (content.match(/!important/g) || []).length;
const flexDirRemoved = beforeFlexDir - afterFlexDir;
console.log(`✓ Flex direction: -${flexDirRemoved} !important`);
totalRemoved += flexDirRemoved;

// 4. Remove !important from flex: 1
const beforeFlex = (content.match(/!important/g) || []).length;
content = content.replace(/flex:\s*1\s*!important;/g, 'flex: 1;');
content = content.replace(/flex:\s*none\s*!important;/g, 'flex: none;');
const afterFlex = (content.match(/!important/g) || []).length;
const flexRemoved = beforeFlex - afterFlex;
console.log(`✓ Flex properties: -${flexRemoved} !important`);
totalRemoved += flexRemoved;

// 5. Remove !important from padding: 0 and margin: 0
const beforeReset = (content.match(/!important/g) || []).length;
content = content.replace(/padding:\s*0\s*!important;/g, 'padding: 0;');
content = content.replace(/margin:\s*0\s*!important;/g, 'margin: 0;');
const afterReset = (content.match(/!important/g) || []).length;
const resetRemoved = beforeReset - afterReset;
console.log(`✓ Reset (padding/margin: 0): -${resetRemoved} !important`);
totalRemoved += resetRemoved;

// 6. Remove !important from height: 100% and width: 100%
const beforeSizing = (content.match(/!important/g) || []).length;
content = content.replace(/height:\s*100%\s*!important;/g, 'height: 100%;');
content = content.replace(/width:\s*100%\s*!important;/g, 'width: 100%;');
const afterSizing = (content.match(/!important/g) || []).length;
const sizingRemoved = beforeSizing - afterSizing;
console.log(`✓ 100% sizing: -${sizingRemoved} !important`);
totalRemoved += sizingRemoved;

// 7. Remove !important from background-color: transparent
const beforeBg = (content.match(/!important/g) || []).length;
content = content.replace(/background:\s*transparent\s*!important;/g, 'background: transparent;');
content = content.replace(/background-color:\s*transparent\s*!important;/g, 'background-color: transparent;');
const afterBg = (content.match(/!important/g) || []).length;
const bgRemoved = beforeBg - afterBg;
console.log(`✓ Transparent backgrounds: -${bgRemoved} !important`);
totalRemoved += bgRemoved;

// 8. Remove !important from border: none and box-shadow: none
const beforeBorder = (content.match(/!important/g) || []).length;
content = content.replace(/border:\s*none\s*!important;/g, 'border: none;');
content = content.replace(/box-shadow:\s*none\s*!important;/g, 'box-shadow: none;');
content = content.replace(/outline:\s*none\s*!important;/g, 'outline: none;');
const afterBorder = (content.match(/!important/g) || []).length;
const borderRemoved = beforeBorder - afterBorder;
console.log(`✓ Border/shadow resets: -${borderRemoved} !important`);
totalRemoved += borderRemoved;

// 9. Remove !important from text-align
const beforeText = (content.match(/!important/g) || []).length;
content = content.replace(/text-align:\s*center\s*!important;/g, 'text-align: center;');
content = content.replace(/text-align:\s*left\s*!important;/g, 'text-align: left;');
content = content.replace(/text-align:\s*right\s*!important;/g, 'text-align: right;');
const afterText = (content.match(/!important/g) || []).length;
const textRemoved = beforeText - afterText;
console.log(`✓ Text alignment: -${textRemoved} !important`);
totalRemoved += textRemoved;

// 10. Remove !important from gap (Flexbox/Grid gap)
const beforeGap = (content.match(/!important/g) || []).length;
content = content.replace(/gap:\s*[\d.]+(?:rem|px|em)\s*!important;/g, (match) => {
  return match.replace(' !important', '');
});
const afterGap = (content.match(/!important/g) || []).length;
const gapRemoved = beforeGap - afterGap;
console.log(`✓ Gap properties: -${gapRemoved} !important`);
totalRemoved += gapRemoved;

const finalImportantCount = (content.match(/!important/g) || []).length;

// Save the cleaned file
fs.writeFileSync(file, content);

console.log(`\n${'='.repeat(70)}`);
console.log(`✅ Aggressive cleanup complete!`);
console.log(`${'='.repeat(70)}`);
console.log(`   Original:  ${originalImportantCount} !important`);
console.log(`   Removed:   ${totalRemoved}`);
console.log(`   Remaining: ${finalImportantCount}`);
console.log(`   Reduction: ${((totalRemoved / originalImportantCount) * 100).toFixed(1)}%`);
console.log(`${'='.repeat(70)}\n`);
console.log(`📝 File updated: ${file}`);
console.log(`💾 Backup: ${backupFile}`);
console.log(`\n⚠️  Next steps:`);
console.log(`   1. Run: npm run build`);
console.log(`   2. Test app thoroughly`);
console.log(`   3. If issues: cp ${backupFile} ${file}`);
console.log(`   4. Run: node scripts/find-css-overrides.mjs (to verify final count)`);
console.log(``);
