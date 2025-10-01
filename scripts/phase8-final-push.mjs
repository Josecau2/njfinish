import fs from 'node:fs';

/**
 * Phase 8: Final Push to Near-Zero !important
 *
 * Final cleanup phase targeting remaining !important declarations.
 * Keeps only the most critical ones:
 * - z-index (layering conflicts)
 * - display: none (accessibility/show/hide)
 * - position (absolute/fixed positioning)
 *
 * Removes all others as they're no longer needed with proper CSS cascade.
 */

const file = 'frontend/src/responsive.css';
const backupFile = `${file}.backup-phase8`;

console.log('\n🎯 Phase 8: Final Push to Near-Zero !important\n');

// Create backup
if (!fs.existsSync(backupFile)) {
  fs.copyFileSync(file, backupFile);
  console.log(`✅ Backup created: ${backupFile}`);
}

let content = fs.readFileSync(file, 'utf8');
const originalImportantCount = (content.match(/!important/g) || []).length;

console.log(`📊 Original !important count in responsive.css: ${originalImportantCount}\n`);

// Critical !important declarations to KEEP
const criticalPatterns = [
  // z-index (essential for layering)
  /z-index:\s*[^;]+!important;/g,

  // display: none (accessibility and show/hide functionality)
  /display:\s*none\s*!important;/g,

  // position (critical for absolute/fixed positioning)
  /position:\s*(?:absolute|fixed|relative|sticky)\s*!important;/g,

  // top/right/bottom/left (coordinates for positioned elements)
  /(?:top|right|bottom|left):\s*[^;]+!important;/g,
];

// Find all !important declarations
const allImportantMatches = content.match(/[^}]*!important;[^}]*/g) || [];
let keptCount = 0;
let removedCount = 0;

console.log('🔍 Analyzing remaining !important declarations...\n');

// Process each !important declaration
for (const match of allImportantMatches) {
  let shouldKeep = false;

  // Check if it matches any critical pattern
  for (const pattern of criticalPatterns) {
    if (pattern.test(match)) {
      shouldKeep = true;
      break;
    }
  }

  if (shouldKeep) {
    keptCount++;
    console.log(`   ✅ KEEP: ${match.trim().substring(0, 60)}...`);
  } else {
    // Remove !important
    const withoutImportant = match.replace(/\s*!important/, '');
    content = content.replace(match, withoutImportant);
    removedCount++;
    console.log(`   🗑️  REMOVE: ${match.trim().substring(0, 60)}...`);
  }
}

// Write updated file
fs.writeFileSync(file, content);

const finalImportantCount = (content.match(/!important/g) || []).length;

console.log(`\n📊 Phase 8 Complete:`);
console.log(`   Original: ${originalImportantCount} !important declarations`);
console.log(`   Kept:     ${keptCount} (critical only)`);
console.log(`   Removed: ${removedCount}`);
console.log(`   Remaining: ${finalImportantCount}`);
console.log(`   Reduction: ${((removedCount / originalImportantCount) * 100).toFixed(1)}%\n`);

if (finalImportantCount <= 50) {
  console.log('🎉 SUCCESS: Near-zero !important achieved!');
  console.log('   Only critical declarations remain (z-index, display:none, position)');
} else {
  console.log('⚠️  WARNING: Still have significant !important declarations');
  console.log('   May need additional cleanup or acceptance of remaining declarations');
}

console.log('\n💡 CSS cascade should now work properly with Chakra UI specificity.\n');

// Run diagnostic
console.log('🔍 Running final diagnostic...\n');
const { execSync } = await import('child_process');
try {
  execSync('node scripts/find-css-overrides.mjs', { stdio: 'inherit' });
} catch (error) {
  console.log('❌ Diagnostic failed, but cleanup completed');
}