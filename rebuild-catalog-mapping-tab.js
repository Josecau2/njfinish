#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const filePath = path.join(__dirname, 'frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx')

function rebuildCatalogMappingTab() {
  console.log('🔄 Rebuilding CatalogMappingTab.jsx from git version...')

  // Get the original file from git
  let originalContent
  try {
    originalContent = execSync('git show HEAD:frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx', { encoding: 'utf8' })
    console.log(`📥 Retrieved original file: ${originalContent.length} characters`)
  } catch (error) {
    console.error('❌ Failed to get original file from git:', error.message)
    process.exit(1)
  }

  // 1. Fix imports - replace CoreUI with Chakra UI
  let content = originalContent

  // Remove CoreUI imports and replace with Chakra UI
  const oldCoreUIImports = /import\s*\{[^}]*\}\s*from\s*'@coreui\/react';?/g
  content = content.replace(oldCoreUIImports, '')

  // Add comprehensive Chakra UI imports at the top
  const chakraImports = `import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  Button, Box, Text, Heading, VStack, HStack, Divider, Flex, Spacer, useToast,
  FormControl, FormLabel, Input, Textarea, Select, Checkbox, Badge, Card, CardHeader, CardBody,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Alert, AlertIcon, AlertTitle, AlertDescription,
  Spinner, IconButton, Container, useDisclosure,
  Stack, Grid, GridItem, SimpleGrid
} from '@chakra-ui/react'`

  // Insert Chakra imports after PageHeader import
  const pageHeaderImportIndex = content.indexOf("import PageHeader from '../../../../components/PageHeader'")
  if (pageHeaderImportIndex !== -1) {
    const insertIndex = content.indexOf('\n', pageHeaderImportIndex) + 1
    content = content.slice(0, insertIndex) + chakraImports + '\n' + content.slice(insertIndex)
  }

  // 2. Replace CoreUI components with Chakra UI equivalents
  const componentReplacements = {
    'CButton': 'Button',
    'CModal': 'Modal',
    'CModalBody': 'ModalBody',
    'CModalFooter': 'ModalFooter',
    'CForm': 'Box',
    'CFormInput': 'Input',
    'CTable': 'Table',
    'CTableHead': 'Thead',
    'CTableBody': 'Tbody',
    'CTableRow': 'Tr',
    'CTableHeaderCell': 'Th',
    'CTableDataCell': 'Td',
    'CFormTextarea': 'Textarea',
    'CFormSelect': 'Select',
    'CFormLabel': 'FormLabel',
    'CFormCheck': 'Checkbox',
    'CBadge': 'Badge',
    'CCard': 'Card',
    'CCardHeader': 'CardHeader',
    'CCardBody': 'CardBody'
  }

  // Apply component replacements
  Object.entries(componentReplacements).forEach(([oldComp, newComp]) => {
    const regex = new RegExp(`\\b${oldComp}\\b`, 'g')
    content = content.replace(regex, newComp)
  })

  // 3. Fix Modal structures to proper Chakra UI format
  // Pattern: visible={state} -> isOpen={state}
  content = content.replace(/visible=\{([^}]+)\}/g, 'isOpen={$1}')

  // 4. Fix button props
  content = content.replace(/color="primary"/g, 'colorScheme="blue"')
  content = content.replace(/color="secondary"/g, 'colorScheme="gray"')
  content = content.replace(/color="danger"/g, 'colorScheme="red"')
  content = content.replace(/color="success"/g, 'colorScheme="green"')
  content = content.replace(/variant="outline"/g, 'variant="outline"')

  // 5. Wrap all Modal content with proper Chakra UI structure
  // This will need to be done systematically for each Modal
  const modalPattern = /<Modal([^>]*)>\s*<ModalBody>/g
  content = content.replace(modalPattern, '<Modal$1>\n        <ModalOverlay>\n          <ModalContent>\n            <ModalHeader>Modal</ModalHeader>\n            <ModalCloseButton />\n            <ModalBody>')

  // Fix Modal closures
  content = content.replace(/<\/ModalFooter>\s*<\/Modal>/g, '</ModalFooter>\n          </ModalContent>\n        </ModalOverlay>\n      </Modal>')

  // 6. Fix Table wrapper
  content = content.replace(/<Table([^>]*)>/g, '<TableContainer>\n        <Table$1>')
  content = content.replace(/<\/Table>/g, '</Table>\n      </TableContainer>')

  // 7. Clean up any remaining issues
  content = content.replace(/className="btn/g, 'className="')

  // 8. Fix icon imports
  content = content.replace(
    /import { Plus, ChevronUp, ChevronDown } from '@\/icons-lucide';/,
    `import { Plus, ChevronUp, ChevronDown, Edit, Trash, Search, FileText, Upload, Download, Settings, Check, X, AlertCircle, ChevronLeft, ChevronRight, Eye, EyeOff, Copy, Save, Refresh, Filter, MoreVertical } from 'lucide-react'`
  )

  // 9. Add useToast hook usage
  const hookInsertPattern = /const \{ t \} = useTranslation\(\);/
  content = content.replace(hookInsertPattern, `const { t } = useTranslation()
  const toast = useToast()`)

  // 10. Final cleanup - remove any empty import lines
  content = content.replace(/^import\s*;\s*$/gm, '')
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n')

  console.log(`✅ Converted file: ${content.length} characters`)

  // Write the converted content
  fs.writeFileSync(filePath, content, 'utf8')
  console.log('💾 Saved converted CatalogMappingTab.jsx')
}

try {
  rebuildCatalogMappingTab()
  console.log('🎉 CatalogMappingTab.jsx has been successfully rebuilt with Chakra UI!')
} catch (error) {
  console.error('❌ Error rebuilding CatalogMappingTab.jsx:', error.message)
  process.exit(1)
}