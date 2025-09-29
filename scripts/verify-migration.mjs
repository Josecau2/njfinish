#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Comprehensive migration verification script
 * Verifies that CoreUI to Chakra UI migration is complete
 */

const FRONTEND_DIR = path.join(process.cwd(), 'frontend', 'src');

// Patterns to check for remaining CoreUI usage
const COREUI_PATTERNS = [
  // CoreUI imports
  /@coreui\/react/g,
  /@coreui\/icons/g,
  /@coreui\/coreui/g,
  /@coreui\/chartjs/g,
  
  // CoreUI components
  /\bCButton\b/g,
  /\bCCard\b/g,
  /\bCModal\b/g,
  /\bCForm\b/g,
  /\bCInput\b/g,
  /\bCSelect\b/g,
  /\bCContainer\b/g,
  /\bCRow\b/g,
  /\bCCol\b/g,
  /\bCAlert\b/g,
  /\bCSpinner\b/g,
  /\bCTable\b/g,
  /\bCNav\b/g,
  /\bCTabs\b/g,
  /\bCDropdown\b/g,
  /\bCBreadcrumb\b/g,
  /\bCBadge\b/g,
  /\bCProgress\b/g,
  /\bCAccordion\b/g,
  /\bCCollapse\b/g,
  /\bCListGroup\b/g,
  /\bCToast\b/g,
  /\bCInputGroup\b/g,
  /\bCFormInput\b/g,
  /\bCFormSelect\b/g,
  /\bCFormCheck\b/g,
  /\bCFormSwitch\b/g,
  /\bCFormLabel\b/g,
  /\bCFormFeedback\b/g,
  /\bCCloseButton\b/g,
];

// Patterns to verify Chakra UI usage
const CHAKRA_PATTERNS = [
  /@chakra-ui\/react/g,
  /\bBox\b/g,
  /\bFlex\b/g,
  /\bButton\b/g,
  /\bInput\b/g,
  /\bSelect\b/g,
  /\bModal\b/g,
  /\bCard\b/g,
  /\bText\b/g,
  /\bHeading\b/g,
];

// Patterns to verify React Hook Form usage
const RHF_PATTERNS = [
  /react-hook-form/g,
  /useForm/g,
  /Controller/g,
];

// Patterns to verify Framer Motion usage
const FRAMER_PATTERNS = [
  /framer-motion/g,
  /motion\./g,
  /whileTap/g,
  /useReducedMotion/g,
];

// FontAwesome patterns (should be replaced with Lucide)
const FONTAWESOME_PATTERNS = [
  /@fortawesome/g,
  /FontAwesomeIcon/g,
  /\bfa[A-Z]/g, // FontAwesome icon names
];

// SweetAlert patterns (should be replaced with Chakra toast)
const SWEETALERT_PATTERNS = [
  /sweetalert2/g,
  /\bSwal\b/g,
];

function getAllJSXFiles() {
  const files = [];
  const extensions = ['.jsx', '.tsx', '.js', '.ts'];
  
  function walkDir(dir) {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          walkDir(fullPath);
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read directory ${dir}: ${error.message}`);
    }
  }
  
  walkDir(FRONTEND_DIR);
  return files;
}

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(FRONTEND_DIR, filePath);
    
    const results = {
      file: relativePath,
      coreUIUsage: [],
      fontAwesomeUsage: [],
      sweetAlertUsage: [],
      hasChakraUI: false,
      hasReactHookForm: false,
      hasFramerMotion: false,
    };
    
    // Check for CoreUI patterns
    COREUI_PATTERNS.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        results.coreUIUsage.push(...matches);
      }
    });
    
    // Check for FontAwesome patterns
    FONTAWESOME_PATTERNS.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        results.fontAwesomeUsage.push(...matches);
      }
    });
    
    // Check for SweetAlert patterns
    SWEETALERT_PATTERNS.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        results.sweetAlertUsage.push(...matches);
      }
    });
    
    // Check for modern patterns
    results.hasChakraUI = CHAKRA_PATTERNS.some(pattern => pattern.test(content));
    results.hasReactHookForm = RHF_PATTERNS.some(pattern => pattern.test(content));
    results.hasFramerMotion = FRAMER_PATTERNS.some(pattern => pattern.test(content));
    
    return results;
  } catch (error) {
    console.warn(`Warning: Could not analyze ${filePath}: ${error.message}`);
    return null;
  }
}

function checkPackageJson() {
  console.log('🔍 Checking package.json dependencies...');
  
  try {
    const packagePath = path.join(process.cwd(), 'frontend', 'package.json');
    const packageContent = fs.readFileSync(packagePath, 'utf-8');
    const packageJson = JSON.parse(packageContent);
    
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };
    
    const coreUIDeps = Object.keys(allDeps).filter(dep => dep.includes('@coreui'));
    const chakraDeps = Object.keys(allDeps).filter(dep => dep.includes('@chakra-ui'));
    const fontAwesomeDeps = Object.keys(allDeps).filter(dep => dep.includes('@fortawesome'));
    const rhfDeps = Object.keys(allDeps).filter(dep => dep.includes('react-hook-form'));
    const framerDeps = Object.keys(allDeps).filter(dep => dep.includes('framer-motion'));
    const sweetAlertDeps = Object.keys(allDeps).filter(dep => dep.includes('sweetalert'));
    
    console.log('📦 Dependencies Analysis:');
    console.log(`   CoreUI dependencies: ${coreUIDeps.length > 0 ? '❌' : '✅'} (${coreUIDeps.join(', ') || 'None'})`);
    console.log(`   Chakra UI dependencies: ${chakraDeps.length > 0 ? '✅' : '❌'} (${chakraDeps.join(', ') || 'None'})`);
    console.log(`   FontAwesome dependencies: ${fontAwesomeDeps.length > 0 ? '⚠️' : '✅'} (${fontAwesomeDeps.join(', ') || 'None'})`);
    console.log(`   React Hook Form: ${rhfDeps.length > 0 ? '✅' : '❌'} (${rhfDeps.join(', ') || 'None'})`);
    console.log(`   Framer Motion: ${framerDeps.length > 0 ? '✅' : '❌'} (${framerDeps.join(', ') || 'None'})`);
    console.log(`   SweetAlert: ${sweetAlertDeps.length > 0 ? '⚠️' : '✅'} (${sweetAlertDeps.join(', ') || 'None'})`);
    
    return {
      coreUIDeps,
      chakraDeps,
      fontAwesomeDeps,
      rhfDeps,
      framerDeps,
      sweetAlertDeps
    };
  } catch (error) {
    console.error('❌ Could not analyze package.json:', error.message);
    return null;
  }
}

function main() {
  console.log('🚀 Starting comprehensive migration verification...\n');
  
  // Check package.json first
  const packageAnalysis = checkPackageJson();
  console.log('');
  
  // Get all files
  const files = getAllJSXFiles();
  console.log(`🔍 Analyzing ${files.length} source files...\n`);
  
  let totalFiles = 0;
  let filesWithCoreUI = 0;
  let filesWithFontAwesome = 0;
  let filesWithSweetAlert = 0;
  let filesWithChakraUI = 0;
  let filesWithRHF = 0;
  let filesWithFramer = 0;
  
  const problemFiles = [];
  
  // Analyze each file
  for (const file of files) {
    const analysis = analyzeFile(file);
    if (!analysis) continue;
    
    totalFiles++;
    
    if (analysis.coreUIUsage.length > 0) {
      filesWithCoreUI++;
      problemFiles.push({
        ...analysis,
        issues: ['CoreUI usage found']
      });
    }
    
    if (analysis.fontAwesomeUsage.length > 0) {
      filesWithFontAwesome++;
      const existing = problemFiles.find(f => f.file === analysis.file);
      if (existing) {
        existing.issues.push('FontAwesome usage found');
      } else {
        problemFiles.push({
          ...analysis,
          issues: ['FontAwesome usage found']
        });
      }
    }
    
    if (analysis.sweetAlertUsage.length > 0) {
      filesWithSweetAlert++;
      const existing = problemFiles.find(f => f.file === analysis.file);
      if (existing) {
        existing.issues.push('SweetAlert usage found');
      } else {
        problemFiles.push({
          ...analysis,
          issues: ['SweetAlert usage found']
        });
      }
    }
    
    if (analysis.hasChakraUI) filesWithChakraUI++;
    if (analysis.hasReactHookForm) filesWithRHF++;
    if (analysis.hasFramerMotion) filesWithFramer++;
  }
  
  // Print summary
  console.log('📊 Migration Verification Summary:');
  console.log(`   Total files analyzed: ${totalFiles}`);
  console.log(`   Files with CoreUI: ${filesWithCoreUI > 0 ? '❌' : '✅'} ${filesWithCoreUI}`);
  console.log(`   Files with FontAwesome: ${filesWithFontAwesome > 0 ? '⚠️' : '✅'} ${filesWithFontAwesome}`);
  console.log(`   Files with SweetAlert: ${filesWithSweetAlert > 0 ? '⚠️' : '✅'} ${filesWithSweetAlert}`);
  console.log(`   Files with Chakra UI: ${filesWithChakraUI > 0 ? '✅' : '❌'} ${filesWithChakraUI}`);
  console.log(`   Files with React Hook Form: ${filesWithRHF > 0 ? '✅' : '❌'} ${filesWithRHF}`);
  console.log(`   Files with Framer Motion: ${filesWithFramer > 0 ? '✅' : '❌'} ${filesWithFramer}`);
  
  // Show problem files
  if (problemFiles.length > 0) {
    console.log('\n⚠️  Files that need attention:');
    problemFiles.forEach(file => {
      console.log(`   ${file.file}`);
      file.issues.forEach(issue => {
        console.log(`      - ${issue}`);
      });
      if (file.coreUIUsage.length > 0) {
        console.log(`      - CoreUI components: ${[...new Set(file.coreUIUsage)].join(', ')}`);
      }
      if (file.fontAwesomeUsage.length > 0) {
        console.log(`      - FontAwesome usage: ${[...new Set(file.fontAwesomeUsage)].join(', ')}`);
      }
      if (file.sweetAlertUsage.length > 0) {
        console.log(`      - SweetAlert usage: ${[...new Set(file.sweetAlertUsage)].join(', ')}`);
      }
    });
  }
  
  // Overall assessment
  console.log('\n🎯 Migration Status:');
  const isCoreUICompletelyRemoved = filesWithCoreUI === 0 && (packageAnalysis?.coreUIDeps.length === 0);
  const hasModernStack = filesWithChakraUI > 0 && (packageAnalysis?.chakraDeps.length > 0);
  
  if (isCoreUICompletelyRemoved && hasModernStack) {
    console.log('✅ MIGRATION COMPLETE: CoreUI fully replaced with Chakra UI');
  } else if (isCoreUICompletelyRemoved) {
    console.log('⚠️  MIGRATION MOSTLY COMPLETE: CoreUI removed but modern stack adoption could be improved');
  } else {
    console.log('❌ MIGRATION INCOMPLETE: CoreUI usage still found');
  }
  
  if (filesWithFontAwesome > 0 || packageAnalysis?.fontAwesomeDeps.length > 0) {
    console.log('⚠️  Consider replacing FontAwesome with Lucide React for consistency');
  }
  
  if (filesWithSweetAlert > 0 || packageAnalysis?.sweetAlertDeps.length > 0) {
    console.log('⚠️  Consider replacing SweetAlert with Chakra UI toast/modal for consistency');
  }
}

// Run the verification
main();