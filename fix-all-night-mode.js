#!/usr/bin/env node
/**
 * Comprehensive Night Mode Fix Script
 * Phase 4-9: Fixes all remaining components systematically
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Comprehensive color mappings
const COLOR_FIXES = {
  // Common background colors
  bg: {
    '"white"': '{useColorModeValue("white", "gray.800")}',
    "'white'": "{useColorModeValue('white', 'gray.800')}",
    '"gray.50"': '{useColorModeValue("gray.50", "gray.800")}',
    "'gray.50'": "{useColorModeValue('gray.50', 'gray.800')}",
    '"gray.100"': '{useColorModeValue("gray.100", "gray.700")}',
    "'gray.100'": "{useColorModeValue('gray.100', 'gray.700')}",
    '"blue.50"': '{useColorModeValue("blue.50", "blue.900")}',
    "'blue.50'": "{useColorModeValue('blue.50', 'blue.900')}",
    '"green.50"': '{useColorModeValue("green.50", "green.900")}',
    "'green.50'": "{useColorModeValue('green.50', 'green.900')}",
    '"yellow.50"': '{useColorModeValue("yellow.50", "yellow.900")}',
    "'yellow.50'": "{useColorModeValue('yellow.50', 'yellow.900')}",
    '"orange.50"': '{useColorModeValue("orange.50", "orange.900")}',
    "'orange.50'": "{useColorModeValue('orange.50', 'orange.900')}",
    '"purple.50"': '{useColorModeValue("purple.50", "purple.900")}',
    "'purple.50'": "{useColorModeValue('purple.50', 'purple.900')}",
    '"teal.50"': '{useColorModeValue("teal.50", "teal.900")}',
    "'teal.50'": "{useColorModeValue('teal.50', 'teal.900')}",
  },

  // Text colors
  color: {
    '"gray.700"': '{useColorModeValue("gray.700", "gray.300")}',
    "'gray.700'": "{useColorModeValue('gray.700', 'gray.300')}",
    '"gray.600"': '{useColorModeValue("gray.600", "gray.400")}',
    "'gray.600'": "{useColorModeValue('gray.600', 'gray.400')}",
    '"gray.500"': '{useColorModeValue("gray.500", "gray.400")}',
    "'gray.500'": "{useColorModeValue('gray.500', 'gray.400')}",
    '"gray.400"': '{useColorModeValue("gray.400", "gray.500")}',
    "'gray.400'": "{useColorModeValue('gray.400', 'gray.500')}",
    '"gray.800"': '{useColorModeValue("gray.800", "gray.200")}',
    "'gray.800'": "{useColorModeValue('gray.800', 'gray.200')}",
    '"blue.600"': '{useColorModeValue("blue.600", "blue.300")}',
    "'blue.600'": "{useColorModeValue('blue.600', 'blue.300')}",
    '"blue.500"': '{useColorModeValue("blue.500", "blue.300")}',
    "'blue.500'": "{useColorModeValue('blue.500', 'blue.300')}",
  },

  // Border colors
  borderColor: {
    '"gray.200"': '{useColorModeValue("gray.200", "gray.600")}',
    "'gray.200'": "{useColorModeValue('gray.200', 'gray.600')}",
    '"gray.300"': '{useColorModeValue("gray.300", "gray.600")}',
    "'gray.300'": "{useColorModeValue('gray.300', 'gray.600')}",
  },

  // Hover states
  _hover: {
    '{ bg: "gray.50" }': '{ bg: useColorModeValue("gray.50", "gray.700") }',
    "{ bg: 'gray.50' }": "{ bg: useColorModeValue('gray.50', 'gray.700') }",
    '{ bg: "gray.100" }': '{ bg: useColorModeValue("gray.100", "gray.600") }',
    "{ bg: 'gray.100' }": "{ bg: useColorModeValue('gray.100', 'gray.600') }",
  }
};

function ensureImport(content) {
  const chakraImportRegex = /import\s+{([^}]+)}\s+from\s+['"]@chakra-ui\/react['"]/;
  const match = content.match(chakraImportRegex);

  if (!match) {
    return content; // No chakra import, skip
  }

  const imports = match[1].split(',').map(s => s.trim());
  if (!imports.includes('useColorModeValue')) {
    imports.push('useColorModeValue');
    const newImportString = `import { ${imports.join(', ')} } from '@chakra-ui/react'`;
    return content.replace(chakraImportRegex, newImportString);
  }

  return content;
}

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let fixes = 0;

    // Check if file needs fixing
    const needsFix = Object.values(COLOR_FIXES).some(propFixes =>
      Object.keys(propFixes).some(oldValue => content.includes(oldValue))
    );

    if (!needsFix) {
      return { modified: false, fixes: 0 };
    }

    // Ensure import exists
    const originalContent = content;
    content = ensureImport(content);
    if (content !== originalContent) {
      modified = true;
    }

    // Apply all color fixes
    for (const [prop, fixes] of Object.entries(COLOR_FIXES)) {
      for (const [oldValue, newValue] of Object.entries(fixes)) {
        const propPattern = `${prop}=${oldValue}`;
        if (content.includes(propPattern)) {
          content = content.replace(new RegExp(propPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), `${prop}=${newValue}`);
          fixes++;
          modified = true;
        }
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
    }

    return { modified, fixes };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return { modified: false, fixes: 0, error: error.message };
  }
}

// Phase-specific file patterns
const PHASES = {
  phase5: {
    name: 'Core Page Components',
    patterns: [
      'frontend/src/pages/dashboard/**/*.{jsx,js}',
      'frontend/src/pages/proposals/Proposals.jsx',
      'frontend/src/pages/customers/Customers.jsx',
      'frontend/src/pages/orders/OrdersList.jsx',
      'frontend/src/pages/admin/Contractors.jsx',
    ]
  },
  phase6: {
    name: 'Table Components',
    patterns: [
      'frontend/src/components/CatalogTable.js',
      'frontend/src/components/CatalogTableEdit.js',
      'frontend/src/components/DataTable/**/*.{jsx,js}',
      'frontend/src/components/ResponsiveTable.jsx',
    ]
  },
  phase7: {
    name: 'Modal Components',
    patterns: [
      'frontend/src/components/NeutralModal.jsx',
      'frontend/src/components/TermsModal.jsx',
      'frontend/src/components/model/**/*.{jsx,js}',
    ]
  },
  phase8: {
    name: 'Buttons & Icons',
    patterns: [
      'frontend/src/components/common/PaginationComponent.jsx',
      'frontend/src/pages/settings/**/*.{jsx,js}',
      'frontend/src/pages/contractor/**/*.{jsx,js}',
    ]
  },
  phase9: {
    name: 'Forms & Inputs',
    patterns: [
      'frontend/src/pages/settings/users/CreateUser.jsx',
      'frontend/src/pages/customers/CustomerForm.jsx',
      'frontend/src/pages/customers/AddCustomerForm.jsx',
    ]
  }
};

// Run specific phase or all
const phase = process.argv[2] || 'all';

console.log(`\n🚀 Night Mode Fix Script - ${phase === 'all' ? 'All Phases' : phase.toUpperCase()}\n`);
console.log('='.repeat(70));

let totalFiles = 0;
let totalFixed = 0;
let totalChanges = 0;

const phasesToRun = phase === 'all' ? Object.keys(PHASES) : [phase];

phasesToRun.forEach(phaseName => {
  const phaseConfig = PHASES[phaseName];
  if (!phaseConfig) {
    console.error(`\n❌ Unknown phase: ${phaseName}`);
    return;
  }

  console.log(`\n📦 ${phaseConfig.name}`);
  console.log('-'.repeat(70));

  phaseConfig.patterns.forEach(pattern => {
    const files = glob.sync(pattern, { cwd: __dirname });

    files.forEach(file => {
      const fullPath = path.join(__dirname, file);
      totalFiles++;

      const result = fixFile(fullPath);

      if (result.error) {
        console.log(`  ❌ ${path.basename(file)}: ${result.error}`);
      } else if (result.modified) {
        console.log(`  ✅ ${path.basename(file)}: ${result.fixes} fixes applied`);
        totalFixed++;
        totalChanges += result.fixes;
      }
    });
  });
});

console.log('\n' + '='.repeat(70));
console.log(`\n✨ Complete: ${totalFixed}/${totalFiles} files updated, ${totalChanges} total fixes\n`);

if (totalFixed > 0) {
  console.log('⚠️  Remember to test the build: cd frontend && npm run build\n');
}
