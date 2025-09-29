#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Comprehensive mapping of CoreUI to Chakra UI components
const COMPONENT_MAPPING = {
  // Modal components
  'CModal': 'Modal',
  'CModalOverlay': 'ModalOverlay',
  'CModalContent': 'ModalContent',
  'CModalHeader': 'ModalHeader',
  'CModalTitle': 'ModalHeader', // Title becomes content of ModalHeader
  'CModalBody': 'ModalBody',
  'CModalFooter': 'ModalFooter',
  'CModalCloseButton': 'ModalCloseButton',

  // Form components
  'CForm': 'FormControl',
  'CFormLabel': 'FormLabel',
  'CFormInput': 'Input',
  'CFormTextarea': 'Textarea',
  'CFormText': 'FormHelperText',
  'CFormCheck': 'Checkbox',
  'CFormSwitch': 'Switch',
  'CFormRange': 'Slider',
  'CFormSelect': 'Select',

  // Layout components
  'CContainer': 'Container',
  'CCard': 'Card',
  'CCardBody': 'CardBody',
  'CCardHeader': 'CardHeader',
  'CRow': 'Flex', // or Box with flexbox
  'CCol': 'Box', // or Flex item

  // Navigation components
  'CNav': 'Flex', // or HStack
  'CNavItem': 'Box',
  'CNavLink': 'Link',
  'CTabContent': 'Box',
  'CTabPane': 'Box',
  'CBreadcrumb': 'Breadcrumb',
  'CBreadcrumbItem': 'BreadcrumbItem',

  // Utility components
  'CSpinner': 'Spinner',
  'CAlert': 'Alert',
  'CBadge': 'Badge',
  'CTooltip': 'Tooltip',
  'CFooter': 'Box', // or Footer component
  'CLink': 'Link',
};

// Icon mapping from @coreui/icons to lucide-react
const ICON_MAPPING = {
  'cilArrowLeft': 'ArrowLeft',
  'cilArrowRight': 'ArrowRight',
  'cilChevronLeft': 'ChevronLeft',
  'cilChevronRight': 'ChevronRight',
  'cilCheckAlt': 'Check',
  'cilCheckCircle': 'CheckCircle',
  'cilX': 'X',
  'cilTrash': 'Trash',
  'cilPencil': 'Edit',
  'cilPlus': 'Plus',
  'cilMinus': 'Minus',
  'cilSearch': 'Search',
  'cilSettings': 'Settings',
  'cilSave': 'Save',
  'cilReload': 'RefreshCw',
  'cilCopy': 'Copy',
  'cilFile': 'File',
  'cilList': 'List',
  'cilOptions': 'MoreHorizontal',
  'cilUser': 'User',
  'cilGroup': 'Users',
  'cilEnvelopeClosed': 'Mail',
  'cilSend': 'Send',
  'cilNotes': 'FileText',
  'cilCalendar': 'Calendar',
  'cilFilter': 'Filter',
  'cilClock': 'Clock',
  'cilDescription': 'FileText',
  'cilImage': 'Image',
  'cilColorPalette': 'Palette',
  'cilMagnifyingGlass': 'Search',
  'cilCloudDownload': 'Download',
  'cilLinkBroken': 'Link',
  'cilMediaPlay': 'Play',
  'cilCode': 'Code',
  'cilEyedropper': 'Eye',
  'cilUserFollow': 'UserPlus',
};

// Props mapping for component-specific transformations
const PROPS_MAPPING = {
  'CAlert': {
    'color': {
      'danger': 'status="error"',
      'warning': 'status="warning"',
      'success': 'status="success"',
      'info': 'status="info"',
      'light': 'status="light"',
    }
  },
  'CBadge': {
    'color': {
      'primary': 'colorScheme="blue"',
      'secondary': 'colorScheme="gray"',
      'success': 'colorScheme="green"',
      'danger': 'colorScheme="red"',
      'warning': 'colorScheme="orange"',
      'info': 'colorScheme="blue"',
      'light': 'colorScheme="gray"',
      'dark': 'colorScheme="gray"',
    }
  },
  'CSpinner': {
    'color': {
      'primary': 'color="blue.500"',
      'secondary': 'color="gray.500"',
      'success': 'color="green.500"',
      'danger': 'color="red.500"',
      'warning': 'color="orange.500"',
      'info': 'color="blue.500"',
      'light': 'color="gray.200"',
      'dark': 'color="gray.800"',
    }
  }
};

// Function to find all JavaScript/TypeScript files
function findFiles(dir, extensions = ['.js', '.jsx', '.ts', '.tsx']) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

// Function to transform import statements
function transformImports(content) {
  let transformed = content;

  // Transform @coreui/react imports
  const coreuiReactRegex = /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@coreui\/react['"]/g;
  transformed = transformed.replace(coreuiReactRegex, (match, imports) => {
    const importList = imports.split(',').map(imp => imp.trim());
    const chakraImports = [];

    importList.forEach(imp => {
      const componentName = imp.replace(/ as \w+$/, '').trim();
      if (COMPONENT_MAPPING[componentName]) {
        chakraImports.push(COMPONENT_MAPPING[componentName]);
      }
    });

    if (chakraImports.length > 0) {
      return `import { ${chakraImports.join(', ')} } from '@chakra-ui/react'`;
    }
    return match;
  });

  // Transform @coreui/icons-react imports
  const coreuiIconsReactRegex = /import\s+CIcon\s+from\s*['"]@coreui\/icons-react['"]/g;
  transformed = transformed.replace(coreuiIconsReactRegex, "import { Icon } from '@chakra-ui/react'");

  // Transform @coreui/icons imports
  const coreuiIconsRegex = /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@coreui\/icons['"]/g;
  transformed = transformed.replace(coreuiIconsRegex, (match, icons) => {
    const iconList = icons.split(',').map(icon => icon.trim());
    const lucideIcons = [];

    iconList.forEach(icon => {
      if (ICON_MAPPING[icon]) {
        lucideIcons.push(ICON_MAPPING[icon]);
      }
    });

    if (lucideIcons.length > 0) {
      return `import { ${lucideIcons.join(', ')} } from 'lucide-react'`;
    }
    return match;
  });

  return transformed;
}

// Function to transform JSX usage
function transformJSX(content) {
  let transformed = content;

  // Transform component names
  Object.entries(COMPONENT_MAPPING).forEach(([coreui, chakra]) => {
    const regex = new RegExp(`<${coreui}(\\s|>)`, 'g');
    transformed = transformed.replace(regex, `<${chakra}$1`);
    const closingRegex = new RegExp(`</${coreui}>`, 'g');
    transformed = transformed.replace(closingRegex, `</${chakra}>`);
  });

  // Transform CIcon usage to Icon
  transformed = transformed.replace(/<CIcon\s+icon=\{([^}]+)\}/g, (match, iconExpr) => {
    const iconName = iconExpr.replace(/cil/, '');
    if (ICON_MAPPING[`cil${iconName}`]) {
      return `<Icon as={${ICON_MAPPING[`cil${iconName}`]}}`;
    }
    return match;
  });

  // Transform props
  Object.entries(PROPS_MAPPING).forEach(([component, mappings]) => {
    Object.entries(mappings).forEach(([prop, values]) => {
      Object.entries(values).forEach(([oldValue, newValue]) => {
        const regex = new RegExp(`${prop}="${oldValue}"`, 'g');
        transformed = transformed.replace(regex, newValue);
        const jsRegex = new RegExp(`${prop}={['"]${oldValue}['"]}`, 'g');
        transformed = transformed.replace(jsRegex, `${newValue}`);
      });
    });
  });

  // Handle special cases
  // CModalTitle becomes content of ModalHeader
  transformed = transformed.replace(/<ModalHeader>(.*?)<\/ModalHeader>/gs, (match, content) => {
    if (content.includes('<ModalTitle>')) {
      const titleContent = content.replace(/<ModalTitle>(.*?)<\/ModalTitle>/s, '$1');
      return `<ModalHeader>${titleContent}</ModalHeader>`;
    }
    return match;
  });

  // Add ModalOverlay and ModalContent for CModal
  transformed = transformed.replace(/(<Modal[^>]*>)/g, '$1\n      <ModalOverlay />\n      <ModalContent>');

  // Close ModalContent before ModalFooter
  transformed = transformed.replace(/(<ModalFooter[^>]*>)/g, '      </ModalContent>\n    $1');

  return transformed;
}

// Main migration function
function migrateFile(filePath) {
  console.log(`🔄 Migrating: ${path.relative(process.cwd(), filePath)}`);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let transformed = content;

    // Transform imports first
    transformed = transformImports(transformed);

    // Then transform JSX
    transformed = transformJSX(transformed);

    // Write back if changed
    if (transformed !== content) {
      fs.writeFileSync(filePath, transformed, 'utf8');
      console.log(`✅ Migrated: ${path.relative(process.cwd(), filePath)}`);
      return true;
    } else {
      console.log(`⏭️  No changes needed: ${path.relative(process.cwd(), filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error migrating ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
function main() {
  console.log('🚀 Starting comprehensive CoreUI to Chakra UI migration...\n');

  const frontendDir = path.join(__dirname, 'frontend', 'src');
  const files = findFiles(frontendDir);

  console.log(`📁 Found ${files.length} files to process\n`);

  let migratedCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const migrated = migrateFile(file);
    if (migrated) {
      migratedCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log(`✅ Files migrated: ${migratedCount}`);
  console.log(`❌ Files with errors: ${errorCount}`);
  console.log(`📁 Total files processed: ${files.length}`);

  if (migratedCount > 0) {
    console.log('\n🔍 Running final check...');
    // Run the check script to see remaining imports
    const { spawn } = require('child_process');
    const checkProcess = spawn('node', ['check-coreui-imports.js'], {
      stdio: 'inherit',
      cwd: __dirname
    });

    checkProcess.on('close', (code) => {
      console.log('\n🎉 Migration completed!');
      console.log('💡 Review the changes and test your application.');
      console.log('🔧 You may need to manually adjust some complex layouts or props.');
    });
  } else {
    console.log('\n✅ No files needed migration!');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { migrateFile, transformImports, transformJSX };