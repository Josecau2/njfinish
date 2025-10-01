#!/usr/bin/env node

/**
 * Migrate all raw Chakra Card usages to StandardCard
 *
 * This script:
 * 1. Finds all files importing Card from @chakra-ui/react
 * 2. Adds StandardCard import
 * 3. Replaces <Card> with <StandardCard>
 * 4. Keeps CardBody, CardHeader, CardFooter unchanged
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filesToMigrate = [
  'frontend/src/components/contact/ContactInfoCard.jsx',
  'frontend/src/components/contact/MessageComposer.jsx',
  'frontend/src/components/PageErrorBoundary.jsx',
  'frontend/src/components/ResponsiveTable.jsx',
  'frontend/src/pages/admin/ContractorDetail/OverviewTab.jsx',
  'frontend/src/pages/admin/ContractorDetail/SettingsTab.jsx',
  'frontend/src/pages/contracts/index.jsx',
  'frontend/src/pages/payments/PaymentCancel.jsx',
  'frontend/src/pages/payments/PaymentTest.jsx',
  'frontend/src/pages/public/PublicProposalPage.jsx',
  'frontend/src/pages/settings/customization/index.jsx',
  'frontend/src/pages/settings/globalMods/GlobalModsPage.jsx',
  'frontend/src/pages/settings/locations/CreateLocation.jsx',
  'frontend/src/pages/settings/multipliers/EditManuMultiplier.jsx',
  'frontend/src/pages/settings/terms/TermsPage.jsx',
  'frontend/src/pages/settings/usersGroup/CreateUserGroup.jsx',
];

let migratedCount = 0;
let errorCount = 0;

console.log('🔄 Starting StandardCard migration...\n');

filesToMigrate.forEach(relPath => {
  const filePath = path.join(__dirname, '..', relPath);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipping ${relPath} (not found)`);
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // Step 1: Add StandardCard import if not already present
    if (!content.includes('StandardCard')) {
      // Find the import from @chakra-ui/react that includes Card
      const chakraImportMatch = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]@chakra-ui\/react['"]/);

      if (chakraImportMatch && chakraImportMatch[1].includes('Card')) {
        // Remove Card from Chakra imports (but keep CardBody, CardHeader, CardFooter)
        const imports = chakraImportMatch[1].split(',').map(i => i.trim());
        const filteredImports = imports.filter(i => i !== 'Card');

        if (filteredImports.length !== imports.length) {
          // Card was in the import, remove it
          const newChakraImport = `import { ${filteredImports.join(', ')} } from '@chakra-ui/react'`;
          content = content.replace(chakraImportMatch[0], newChakraImport);

          // Calculate import path depth
          const depth = relPath.split('/').length - 2; // -2 for frontend/src
          const importPath = '../'.repeat(depth) + 'components/StandardCard';

          // Add StandardCard import after Chakra import
          const insertPosition = content.indexOf(newChakraImport) + newChakraImport.length;
          content = content.slice(0, insertPosition) + '\nimport StandardCard from \'' + importPath + '\'' + content.slice(insertPosition);

          modified = true;
        }
      }
    }

    // Step 2: Replace <Card with <StandardCard (but NOT CardBody, CardHeader, CardFooter)
    // Use word boundaries to avoid replacing CardBody, CardHeader, CardFooter
    content = content.replace(/(<\/?)Card(\s|>)/g, (match, opening, ending) => {
      modified = true;
      return `${opening}StandardCard${ending}`;
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ Migrated: ${relPath}`);
      migratedCount++;
    } else {
      console.log(`ℹ️  No changes: ${relPath}`);
    }

  } catch (error) {
    console.error(`❌ Error migrating ${relPath}:`, error.message);
    errorCount++;
  }
});

console.log(`\n📊 Migration Summary:`);
console.log(`   ✅ Migrated: ${migratedCount} files`);
console.log(`   ❌ Errors: ${errorCount} files`);
console.log(`\nNext steps:`);
console.log(`   1. Run: npm run build:frontend`);
console.log(`   2. Check for any build errors`);
console.log(`   3. Run: grep -r "import.*StandardCard" frontend/src | wc -l`);
console.log(`   4. Should show more than 4 imports now`);
