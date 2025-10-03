#!/usr/bin/env node
/**
 * Night Mode Fix Script
 * Systematically fixes hardcoded colors across the application
 */

const fs = require('fs');
const path = require('path');

// Color mapping for common fixes
const colorMappings = {
  // Background colors
  'bg="white"': 'bg={useColorModeValue("white", "gray.800")}',
  "bg='white'": "bg={useColorModeValue('white', 'gray.800')}",
  'bg="gray.50"': 'bg={useColorModeValue("gray.50", "gray.800")}',
  "bg='gray.50'": "bg={useColorModeValue('gray.50', 'gray.800')}",
  'bg="gray.100"': 'bg={useColorModeValue("gray.100", "gray.700")}',
  "bg='gray.100'": "bg={useColorModeValue('gray.100', 'gray.700')}",

  // Text colors
  'color="gray.700"': 'color={useColorModeValue("gray.700", "gray.300")}',
  "color='gray.700'": "color={useColorModeValue('gray.700', 'gray.300')}",
  'color="gray.600"': 'color={useColorModeValue("gray.600", "gray.400")}',
  "color='gray.600'": "color={useColorModeValue('gray.600', 'gray.400')}",
  'color="gray.500"': 'color={useColorModeValue("gray.500", "gray.400")}',
  "color='gray.500'": "color={useColorModeValue('gray.500', 'gray.400')}",
  'color="blue.600"': 'color={useColorModeValue("blue.600", "blue.300")}',
  "color='blue.600'": "color={useColorModeValue('blue.600', 'blue.300')}",

  // Border colors
  'borderColor="gray.200"': 'borderColor={useColorModeValue("gray.200", "gray.600")}',
  "borderColor='gray.200'": "borderColor={useColorModeValue('gray.200', 'gray.600')}",
  'borderColor="gray.300"': 'borderColor={useColorModeValue("gray.300", "gray.600")}',
  "borderColor='gray.300'": "borderColor={useColorModeValue('gray.300', 'gray.600')}",
};

function ensureImport(content, importName) {
  const chakraImportRegex = /import\s+{([^}]+)}\s+from\s+['"]@chakra-ui\/react['"]/;
  const match = content.match(chakraImportRegex);

  if (!match) {
    // No Chakra import found, add it
    const firstImport = content.indexOf('import');
    if (firstImport !== -1) {
      const endOfFirstImport = content.indexOf('\n', firstImport);
      return content.slice(0, endOfFirstImport + 1) +
             `import { ${importName} } from '@chakra-ui/react'\n` +
             content.slice(endOfFirstImport + 1);
    }
    return `import { ${importName} } from '@chakra-ui/react'\n` + content;
  }

  const imports = match[1].split(',').map(s => s.trim());
  if (!imports.includes(importName)) {
    imports.push(importName);
    const newImportString = `import { ${imports.join(', ')} } from '@chakra-ui/react'`;
    return content.replace(chakraImportRegex, newImportString);
  }

  return content;
}

function fixAuthPage(filePath) {
  console.log(`\n📝 Fixing: ${path.basename(filePath)}`);

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Ensure useColorModeValue import
  if (content.includes('bg="white"') || content.includes("bg='white'") ||
      content.includes('color="gray') || content.includes('color="blue')) {
    content = ensureImport(content, 'useColorModeValue');
    modified = true;
  }

  // Apply color mappings
  for (const [oldColor, newColor] of Object.entries(colorMappings)) {
    if (content.includes(oldColor)) {
      const regex = new RegExp(oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      content = content.replace(regex, newColor);
      console.log(`  ✓ Replaced: ${oldColor} → ${newColor}`);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ Updated successfully`);
    return true;
  } else {
    console.log(`  ⏭️  No changes needed`);
    return false;
  }
}

// Authentication pages
const authPages = [
  'frontend/src/pages/auth/LoginPage.jsx',
  'frontend/src/pages/auth/RequestAccessPage.jsx',
  'frontend/src/pages/auth/ForgotPasswordPage.jsx',
  'frontend/src/pages/auth/ResetPasswordPage.jsx',
  'frontend/src/pages/auth/SignupPage.jsx',
];

console.log('🚀 Starting Night Mode Fixes - Phase 2: Authentication Pages\n');
console.log('=' .repeat(70));

let totalFixed = 0;
authPages.forEach(page => {
  const fullPath = path.join(__dirname, page);
  if (fs.existsSync(fullPath)) {
    if (fixAuthPage(fullPath)) {
      totalFixed++;
    }
  } else {
    console.log(`\n⚠️  File not found: ${page}`);
  }
});

console.log('\n' + '='.repeat(70));
console.log(`\n✨ Phase 2 Complete: ${totalFixed}/${authPages.length} files updated\n`);
