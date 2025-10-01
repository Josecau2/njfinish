import fs from 'node:fs';

/**
 * Phase 7: Ultra-Aggressive !important Cleanup
 *
 * Targets the remaining !important declarations in responsive.css:
 * - Padding and margin overrides
 * - Font and typography overrides
 * - Border and transition overrides
 * - Color overrides (except critical ones)
 */

const file = 'frontend/src/responsive.css';
const backupFile = `${file}.backup-phase7`;

console.log('\n🧹 Phase 7: Ultra-Aggressive !important Cleanup\n');

// Create backup
if (!fs.existsSync(backupFile)) {
  fs.copyFileSync(file, backupFile);
  console.log(`✅ Backup created: ${backupFile}`);
}

let content = fs.readFileSync(file, 'utf8');
const originalImportantCount = (content.match(/!important/g) || []).length;

console.log(`📊 Original !important count in responsive.css: ${originalImportantCount}\n`);

// Phase 7: Ultra-aggressive cleanup patterns
const cleanupPatterns = [
  // Padding overrides (safe to remove - Chakra handles spacing)
  {
    pattern: /\s*padding(?:-[a-z]+)?:\s*[^;]+!important;/g,
    description: 'Padding overrides',
    keepCondition: (match) => false // Remove all padding !important
  },

  // Margin overrides (safe to remove - Chakra handles spacing)
  {
    pattern: /\s*margin(?:-[a-z]+)?:\s*[^;]+!important;/g,
    description: 'Margin overrides',
    keepCondition: (match) => false // Remove all margin !important
  },

  // Font-size overrides (keep only if > 1rem or specific breakpoints)
  {
    pattern: /\s*font-size:\s*[^;]+!important;/g,
    description: 'Font-size overrides',
    keepCondition: (match) => {
      // Keep !important for font sizes > 1rem (likely headings)
      const sizeMatch = match.match(/font-size:\s*([0-9.]+)rem/);
      if (sizeMatch) {
        const size = parseFloat(sizeMatch[1]);
        return size > 1.0;
      }
      return false;
    }
  },

  // Font-weight overrides (keep only if > 500)
  {
    pattern: /\s*font-weight:\s*[^;]+!important;/g,
    description: 'Font-weight overrides',
    keepCondition: (match) => {
      const weightMatch = match.match(/font-weight:\s*([0-9]+)/);
      if (weightMatch) {
        const weight = parseInt(weightMatch[1]);
        return weight >= 500; // Keep semibold and bold
      }
      return false;
    }
  },

  // Border overrides (remove unless critical)
  {
    pattern: /\s*border(?:-[a-z]+)?:\s*[^;]+!important;/g,
    description: 'Border overrides',
    keepCondition: (match) => false // Remove all border !important
  },

  // Transition overrides (safe to remove)
  {
    pattern: /\s*transition:\s*[^;]+!important;/g,
    description: 'Transition overrides',
    keepCondition: (match) => false // Remove all transition !important
  },

  // Color overrides (keep only background white/black)
  {
    pattern: /\s*(?:color|background|background-color):\s*[^;]+!important;/g,
    description: 'Color overrides',
    keepCondition: (match) => {
      return match.includes('background: white') ||
             match.includes('background-color: white') ||
             match.includes('background: black') ||
             match.includes('background-color: black');
    }
  }
];

let totalRemoved = 0;

for (const { pattern, description, keepCondition } of cleanupPatterns) {
  const matches = content.match(pattern);
  if (matches) {
    let removed = 0;
    content = content.replace(pattern, (match) => {
      if (keepCondition(match)) {
        return match; // Keep this !important
      } else {
        removed++;
        return match.replace(' !important', ''); // Remove !important
      }
    });

    if (removed > 0) {
      console.log(`   ${description}: removed ${removed} !important`);
      totalRemoved += removed;
    }
  }
}

// Additional cleanup: Remove !important from gap property (Chakra handles this)
const gapPattern = /\s*gap:\s*[^;]+!important;/g;
const gapMatches = content.match(gapPattern);
if (gapMatches) {
  content = content.replace(gapPattern, (match) => match.replace(' !important', ''));
  console.log(`   Gap overrides: removed ${gapMatches.length} !important`);
  totalRemoved += gapMatches.length;
}

// Write updated file
fs.writeFileSync(file, content);

const finalImportantCount = (content.match(/!important/g) || []).length;
const reduction = originalImportantCount - finalImportantCount;

console.log(`\n📊 Phase 7 Complete:`);
console.log(`   Original: ${originalImportantCount} !important declarations`);
console.log(`   Removed:  ${totalRemoved}`);
console.log(`   Remaining: ${finalImportantCount}`);
console.log(`   Reduction: ${((reduction / originalImportantCount) * 100).toFixed(1)}%\n`);

console.log('💡 Advanced cleanup completed. Only critical !important declarations remain.\n');

// Run diagnostic
console.log('🔍 Running post-cleanup diagnostic...\n');
const { execSync } = await import('child_process');
try {
  execSync('node scripts/find-css-overrides.mjs', { stdio: 'inherit' });
} catch (error) {
  console.log('❌ Diagnostic failed, but cleanup completed');
}