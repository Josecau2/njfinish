#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Comprehensive CoreUI to Chakra UI migration script
 * Replaces CoreUI components with Chakra UI equivalents following the established patterns
 */

const FRONTEND_DIR = path.join(process.cwd(), 'frontend', 'src');

// Component mapping: CoreUI -> Chakra UI
const COMPONENT_MAPPINGS = {
  // Layout Components
  'CContainer': 'Container',
  'CRow': 'SimpleGrid', // or Flex with wrap
  'CCol': 'Box', // will need columns prop conversion
  
  // Form Components
  'CForm': 'form', // native form element
  'CFormInput': 'Input',
  'CFormLabel': 'FormLabel',
  'CFormSelect': 'Select',
  'CFormTextarea': 'Textarea',
  'CFormCheck': 'Checkbox', // or Radio depending on type
  'CFormSwitch': 'Switch',
  'CFormRange': 'Slider',
  'CFormFeedback': 'FormErrorMessage',
  'CInputGroup': 'InputGroup',
  'CInputGroupText': 'InputLeftAddon', // or InputRightAddon
  
  // Button Components
  'CButton': 'Button',
  'CButtonGroup': 'ButtonGroup',
  'CDropdown': 'Menu',
  'CDropdownToggle': 'MenuButton',
  'CDropdownMenu': 'MenuList',
  'CDropdownItem': 'MenuItem',
  'CDropdownDivider': 'MenuDivider',
  
  // Card Components
  'CCard': 'Card',
  'CCardBody': 'CardBody',
  'CCardHeader': 'CardHeader',
  'CCardFooter': 'CardFooter',
  'CCardTitle': 'Heading',
  'CCardText': 'Text',
  
  // Modal Components
  'CModal': 'Modal',
  'CModalHeader': 'ModalHeader',
  'CModalTitle': 'ModalHeader', // combine with ModalHeader
  'CModalBody': 'ModalBody',
  'CModalFooter': 'ModalFooter',
  'CCloseButton': 'ModalCloseButton',
  
  // Navigation Components
  'CNav': 'Tabs',
  'CNavItem': 'Tab',
  'CNavLink': 'Tab',
  'CTabs': 'Tabs',
  'CTabContent': 'TabPanels',
  'CTabPane': 'TabPanel',
  'CBreadcrumb': 'Breadcrumb',
  'CBreadcrumbItem': 'BreadcrumbItem',
  
  // Data Display Components
  'CTable': 'Table',
  'CTableHead': 'Thead',
  'CTableBody': 'Tbody',
  'CTableRow': 'Tr',
  'CTableHeaderCell': 'Th',
  'CTableDataCell': 'Td',
  'CBadge': 'Badge',
  'CListGroup': 'VStack',
  'CListGroupItem': 'Box',
  
  // Feedback Components
  'CAlert': 'Alert',
  'CToast': 'useToast', // hook, not component
  'CSpinner': 'Spinner',
  'CProgress': 'Progress',
  
  // Utility Components
  'CCollapse': 'Collapse',
  'CAccordion': 'Accordion',
  'CAccordionItem': 'AccordionItem',
  'CAccordionHeader': 'AccordionButton',
  'CAccordionBody': 'AccordionPanel',
};

// Props mapping for components that need prop name changes
const PROPS_MAPPINGS = {
  'Button': {
    'color': 'colorScheme',
    'variant': 'variant', // keep as-is, but map color="primary" to variant="solid" colorScheme="brand"
  },
  'Input': {
    'invalid': 'isInvalid',
    'valid': 'isValid',
    'disabled': 'isDisabled',
    'readonly': 'isReadOnly',
  },
  'Select': {
    'invalid': 'isInvalid',
    'disabled': 'isDisabled',
  },
  'Modal': {
    'visible': 'isOpen',
    'onClose': 'onClose', // keep same
  },
  'Card': {
    'className': 'className', // keep same
  }
};

// Import replacements
const IMPORT_REPLACEMENTS = {
  "from '@coreui/react'": "from '@chakra-ui/react'",
  "import CIcon from '@coreui/icons-react'": "// Replaced with lucide-react icons",
  "from '@coreui/icons'": "from '@/icons-lucide'",
};

// Special pattern replacements for complex transformations
const PATTERN_REPLACEMENTS = [
  // CoreUI button color to Chakra variant + colorScheme
  {
    pattern: /color="primary"/g,
    replacement: 'variant="solid" colorScheme="brand"'
  },
  {
    pattern: /color="secondary"/g,
    replacement: 'variant="outline" colorScheme="gray"'
  },
  {
    pattern: /color="light"/g,
    replacement: 'variant="ghost"'
  },
  {
    pattern: /color="danger"/g,
    replacement: 'variant="solid" colorScheme="red"'
  },
  {
    pattern: /color="success"/g,
    replacement: 'variant="solid" colorScheme="green"'
  },
  {
    pattern: /color="warning"/g,
    replacement: 'variant="solid" colorScheme="orange"'
  },
  
  // CoreUI spacing/layout to Chakra
  {
    pattern: /className="mb-(\d)"/g,
    replacement: 'mb={$1}'
  },
  {
    pattern: /className="mt-(\d)"/g,
    replacement: 'mt={$1}'
  },
  {
    pattern: /className="p-(\d)"/g,
    replacement: 'p={$1}'
  },
  {
    pattern: /className="m-(\d)"/g,
    replacement: 'm={$1}'
  },
  
  // Icon replacements (common CoreUI icons to lucide)
  {
    pattern: /cilUser/g,
    replacement: 'User'
  },
  {
    pattern: /cilLockLocked/g,
    replacement: 'Lock'
  },
  {
    pattern: /cilArrowLeft/g,
    replacement: 'ArrowLeft'
  },
  {
    pattern: /cilSave/g,
    replacement: 'Save'
  },
  {
    pattern: /cilSettings/g,
    replacement: 'Settings'
  },
  {
    pattern: /cilHome/g,
    replacement: 'Home'
  },
  {
    pattern: /cilBuilding/g,
    replacement: 'Building2'
  },
  {
    pattern: /cilX/g,
    replacement: 'X'
  },
  {
    pattern: /cilMagnifyingGlass/g,
    replacement: 'Search'
  },
];

function getAllJSXFiles() {
  console.log('🔍 Finding all JSX/TSX files in frontend/src...');
  
  const files = [];
  const extensions = ['.jsx', '.tsx', '.js', '.ts'];
  
  function walkDir(dir) {
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
  }
  
  walkDir(FRONTEND_DIR);
  console.log(`📁 Found ${files.length} files to process`);
  return files;
}

function replaceImports(content) {
  let updatedContent = content;
  
  Object.entries(IMPORT_REPLACEMENTS).forEach(([oldImport, newImport]) => {
    updatedContent = updatedContent.replaceAll(oldImport, newImport);
  });
  
  return updatedContent;
}

function replaceComponents(content) {
  let updatedContent = content;
  
  // Replace component names
  Object.entries(COMPONENT_MAPPINGS).forEach(([coreUIComponent, chakraComponent]) => {
    // Replace opening tags
    const openTagRegex = new RegExp(`<${coreUIComponent}(\\s|>)`, 'g');
    updatedContent = updatedContent.replace(openTagRegex, `<${chakraComponent}$1`);
    
    // Replace closing tags
    const closeTagRegex = new RegExp(`</${coreUIComponent}>`, 'g');
    updatedContent = updatedContent.replace(closeTagRegex, `</${chakraComponent}>`);
    
    // Replace self-closing tags
    const selfCloseRegex = new RegExp(`<${coreUIComponent}(.*?)/>`, 'g');
    updatedContent = updatedContent.replace(selfCloseRegex, `<${chakraComponent}$1/>`);
  });
  
  return updatedContent;
}

function applyPatternReplacements(content) {
  let updatedContent = content;
  
  PATTERN_REPLACEMENTS.forEach(({ pattern, replacement }) => {
    updatedContent = updatedContent.replace(pattern, replacement);
  });
  
  return updatedContent;
}

function updateChakraImports(content) {
  // Find existing Chakra imports and merge with commonly needed components
  const chakraImportRegex = /import\s*{([^}]+)}\s*from\s*'@chakra-ui\/react'/;
  const match = content.match(chakraImportRegex);
  
  const commonChakraComponents = [
    'Box', 'Flex', 'VStack', 'HStack', 'Container', 'SimpleGrid',
    'Card', 'CardBody', 'CardHeader', 'CardFooter',
    'Button', 'Input', 'Select', 'Textarea', 'FormControl', 'FormLabel', 'FormErrorMessage',
    'Modal', 'ModalOverlay', 'ModalContent', 'ModalHeader', 'ModalBody', 'ModalFooter', 'ModalCloseButton',
    'Table', 'Thead', 'Tbody', 'Tr', 'Th', 'Td',
    'Badge', 'Alert', 'Spinner', 'Text', 'Heading',
    'Tabs', 'TabList', 'Tab', 'TabPanels', 'TabPanel',
    'useToast'
  ];
  
  if (match) {
    // Merge existing imports with common components (remove duplicates)
    const existingImports = match[1].split(',').map(s => s.trim());
    const allImports = [...new Set([...existingImports, ...commonChakraComponents])];
    
    const newImportStatement = `import {\n  ${allImports.join(',\n  ')}\n} from '@chakra-ui/react'`;
    
    return content.replace(chakraImportRegex, newImportStatement);
  } else {
    // Add new Chakra import at the top
    const importStatement = `import {\n  ${commonChakraComponents.join(',\n  ')}\n} from '@chakra-ui/react'`;
    
    // Insert after the first import or at the beginning
    const lines = content.split('\n');
    let insertIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) {
        insertIndex = i + 1;
      } else if (lines[i].trim() === '') {
        continue;
      } else {
        break;
      }
    }
    
    lines.splice(insertIndex, 0, importStatement);
    return lines.join('\n');
  }
}

function processFile(filePath) {
  try {
    console.log(`🔄 Processing: ${path.relative(FRONTEND_DIR, filePath)}`);
    
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Skip files that don't contain CoreUI imports
    if (!content.includes('@coreui/react') && !content.includes('@coreui/icons')) {
      console.log(`⏭️  Skipping (no CoreUI): ${path.relative(FRONTEND_DIR, filePath)}`);
      return { processed: false, errors: [] };
    }
    
    let updatedContent = content;
    
    // Step 1: Replace imports
    updatedContent = replaceImports(updatedContent);
    
    // Step 2: Replace component names
    updatedContent = replaceComponents(updatedContent);
    
    // Step 3: Apply pattern replacements (props, styling, etc.)
    updatedContent = applyPatternReplacements(updatedContent);
    
    // Step 4: Update/add Chakra imports
    updatedContent = updateChakraImports(updatedContent);
    
    // Step 5: Add React Hook Form imports if forms are detected
    if (updatedContent.includes('<form') || updatedContent.includes('FormControl')) {
      if (!updatedContent.includes('react-hook-form')) {
        const rhfImport = "import { useForm, Controller } from 'react-hook-form'";
        const lines = updatedContent.split('\n');
        
        // Find a good place to insert RHF import
        let insertIndex = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes("from '@chakra-ui/react'")) {
            insertIndex = i + 1;
            break;
          }
        }
        
        lines.splice(insertIndex, 0, rhfImport);
        updatedContent = lines.join('\n');
      }
    }
    
    // Step 6: Add Framer Motion imports if animations needed
    if (updatedContent.includes('whileTap') || updatedContent.includes('motion.')) {
      if (!updatedContent.includes('framer-motion')) {
        const motionImport = "import { motion, useReducedMotion } from 'framer-motion'";
        const lines = updatedContent.split('\n');
        
        let insertIndex = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes("from 'react-hook-form'")) {
            insertIndex = i + 1;
            break;
          }
        }
        
        lines.splice(insertIndex, 0, motionImport);
        updatedContent = lines.join('\n');
      }
    }
    
    // Write the updated content back
    fs.writeFileSync(filePath, updatedContent, 'utf-8');
    
    console.log(`✅ Updated: ${path.relative(FRONTEND_DIR, filePath)}`);
    return { processed: true, errors: [] };
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return { processed: false, errors: [error.message] };
  }
}

function main() {
  console.log('🚀 Starting CoreUI to Chakra UI migration...\n');
  
  try {
    const files = getAllJSXFiles();
    
    let processedCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const file of files) {
      const result = processFile(file);
      
      if (result.processed) {
        processedCount++;
      }
      
      if (result.errors.length > 0) {
        errorCount++;
        errors.push(...result.errors.map(err => `${file}: ${err}`));
      }
    }
    
    console.log('\n🎉 Migration Summary:');
    console.log(`📁 Total files scanned: ${files.length}`);
    console.log(`✅ Files processed: ${processedCount}`);
    console.log(`❌ Files with errors: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(error => console.log(`  ${error}`));
    }
    
    console.log('\n📋 Next steps:');
    console.log('1. Run: npm run lint -- --fix');
    console.log('2. Fix any remaining TypeScript/ESLint errors');
    console.log('3. Test critical user flows');
    console.log('4. Update any remaining manual state management to React Hook Form');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
main();