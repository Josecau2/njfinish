#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, 'frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx')

function fixCatalogMappingTab() {
  console.log('Reading CatalogMappingTab.jsx...')
  let content = fs.readFileSync(filePath, 'utf8')

  console.log(`Original file size: ${content.length} characters`)

  // 1. Fix imports - add missing Modal components
  const oldImport = `import { Modal, ModalBody, ModalFooter, FormControl, Input, Textarea, Select, FormLabel, Checkbox, Badge, Card, CardHeader, CardBody } from '@chakra-ui/react'`
  const newImport = `import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  FormControl, Input, Textarea, Select, FormLabel, Checkbox, Badge, Card, CardHeader, CardBody,
  Button, Box, Text, Heading, VStack, HStack, Divider, Flex, Spacer, useToast
} from '@chakra-ui/react'`

  content = content.replace(oldImport, newImport)

  // 2. Fix icon import path
  content = content.replace(
    `import { Plus, ChevronUp, ChevronDown } from '@/icons-lucide'`,
    `import { Plus, ChevronUp, ChevronDown, Edit, Trash, Search, FileText, Upload, Download, Settings, Check, X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'`
  )

  // 3. Fix Modal structure issues - pattern 1: corrupted opening
  content = content.replace(
    /<Modal isOpen=\{([^}]+)\} onClose=\{\(\) =>\s*<ModalOverlay>([^}]+)\}>/g,
    '<Modal isOpen={$1} onClose={() => $2}>\n        <ModalOverlay>\n          <ModalContent>'
  )

  // 4. Fix Modal structure issues - pattern 2: missing ModalContent
  content = content.replace(
    /<Modal\s+([^>]*)>\s*<ModalOverlay>\s*([^<]*)\s*<ModalBody>/g,
    '<Modal $1>\n        <ModalOverlay>\n          <ModalContent>\n            <ModalHeader>Modal</ModalHeader>\n            <ModalCloseButton />\n            <ModalBody>'
  )

  // 5. Fix corrupted closing structure
  content = content.replace(
    /<\/ModalBody><ModalFooter>/g,
    '</ModalBody>\n            <ModalFooter>'
  )

  // 6. Fix missing closing structure
  content = content.replace(
    /<\/ModalContent>\s*<\/Modal>/g,
    '</ModalContent>\n        </ModalOverlay>\n      </Modal>'
  )

  // 7. Fix any remaining ModalOverlay without proper nesting
  content = content.replace(
    /<ModalOverlay>([^<]*)<ModalBody>/g,
    '<ModalOverlay>\n          <ModalContent>\n            <ModalHeader>Modal</ModalHeader>\n            <ModalCloseButton />\n            <ModalBody>'
  )

  // 8. Add missing ModalContent wrapping
  content = content.replace(
    /<Modal([^>]*)>\s*<ModalBody>/g,
    '<Modal$1>\n        <ModalOverlay>\n          <ModalContent>\n            <ModalHeader>Modal</ModalHeader>\n            <ModalCloseButton />\n            <ModalBody>'
  )

  // 9. Fix orphaned ModalFooter
  content = content.replace(
    /<\/ModalBody>\s*<ModalFooter>/g,
    '</ModalBody>\n            <ModalFooter>'
  )

  // 10. Fix any remaining incomplete Modal closures
  content = content.replace(
    /<\/ModalFooter>\s*<\/Modal>/g,
    '</ModalFooter>\n          </ModalContent>\n        </ModalOverlay>\n      </Modal>'
  )

  // 11. Fix any remaining incomplete structures
  content = content.replace(
    /<\/ModalFooter>\s*<\/ModalContent>\s*<\/Modal>/g,
    '</ModalFooter>\n          </ModalContent>\n        </ModalOverlay>\n      </Modal>'
  )

  // 12. Fix multiple/duplicate imports by removing old CoreUI references
  content = content.replace(/import.*from.*@coreui\/react.*/g, '')
  content = content.replace(/import.*CButton.*/g, '')
  content = content.replace(/import.*CModal.*/g, '')

  // 13. Replace any remaining CoreUI components with Chakra UI equivalents
  content = content.replace(/CButton/g, 'Button')
  content = content.replace(/CModal/g, 'Modal')
  content = content.replace(/CModalHeader/g, 'ModalHeader')
  content = content.replace(/CModalBody/g, 'ModalBody')
  content = content.replace(/CModalFooter/g, 'ModalFooter')
  content = content.replace(/CForm/g, 'Box')
  content = content.replace(/CFormInput/g, 'Input')
  content = content.replace(/CFormSelect/g, 'Select')
  content = content.replace(/CFormTextarea/g, 'Textarea')
  content = content.replace(/CFormCheck/g, 'Checkbox')
  content = content.replace(/CCard/g, 'Card')
  content = content.replace(/CCardHeader/g, 'CardHeader')
  content = content.replace(/CCardBody/g, 'CardBody')

  // 14. Fix className to proper prop usage for Chakra UI
  content = content.replace(/className="btn btn-primary"/g, 'colorScheme="blue"')
  content = content.replace(/className="btn btn-secondary"/g, 'colorScheme="gray"')
  content = content.replace(/className="btn btn-danger"/g, 'colorScheme="red"')
  content = content.replace(/className="btn btn-success"/g, 'colorScheme="green"')

  // 15. Clean up any remaining syntax issues
  content = content.replace(/\s*<ModalOverlay>\s*([^<\s][^<]*[^>\s])\s*<ModalBody>/g, '<ModalOverlay>\n          <ModalContent>\n            <ModalHeader>Modal</ModalHeader>\n            <ModalCloseButton />\n            <ModalBody>')

  // 16. Fix any remaining unclosed tags by ensuring proper Modal structure
  content = content.replace(
    /<Modal([^>]*)>\s*<ModalOverlay>\s*<ModalContent>\s*<ModalBody>/g,
    '<Modal$1>\n        <ModalOverlay>\n          <ModalContent>\n            <ModalHeader>Modal</ModalHeader>\n            <ModalCloseButton />\n            <ModalBody>'
  )

  console.log(`Fixed file size: ${content.length} characters`)

  // Write the fixed content
  fs.writeFileSync(filePath, content, 'utf8')
  console.log('✅ Fixed CatalogMappingTab.jsx Modal structures and imports')
}

try {
  fixCatalogMappingTab()
  console.log('🎉 CatalogMappingTab.jsx has been fixed successfully!')
} catch (error) {
  console.error('❌ Error fixing CatalogMappingTab.jsx:', error.message)
  process.exit(1)
}