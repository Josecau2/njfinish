# UI Consistency Audit Report
Generated: 2025-10-01T04:23:42.469Z

## Summary
- **Total Files Scanned:** 149
- **Total Violations:** 1591

## Violations by Category

### 1. Hardcoded Colors (335)

**Playbook Rule:** Use Chakra color tokens (Step 10)

| File | Line | Color | Code |
|------|------|-------|------|
| frontend/src/components/ItemSelectionContent.jsx | 80 | #000 | `const headerBg = customization.headerBg || '#000000';...` |
| frontend/src/components/ItemSelectionContent.jsx | 83 | #FFF | `if (!hexColor || hexColor.length < 7) return '#FFFFFF';...` |
| frontend/src/components/ItemSelectionContent.jsx | 88 | #000 | `return (yiq >= 128) ? '#000000' : '#FFFFFF';...` |
| frontend/src/components/ItemSelectionContent.jsx | 88 | #FFF | `return (yiq >= 128) ? '#000000' : '#FFFFFF';...` |
| frontend/src/components/ItemSelectionContent.jsx | 1539 | #f8f | `bg="#f8f9fa"...` |
| frontend/src/components/ItemSelectionContent.jsx | 1768 | #f8f | `bg="#f8f9fa"...` |
| frontend/src/components/ItemSelectionContent.jsx | 1771 | #1a7 | `borderColor={styleItem.id === selectedStyleData?.id ? '#1a73...` |
| frontend/src/components/ItemSelectionContent.jsx | 1771 | #e9e | `borderColor={styleItem.id === selectedStyleData?.id ? '#1a73...` |
| frontend/src/components/ItemSelectionContent.jsx | 1785 | #d0e | `bg={styleItem.id === selectedStyleData?.id ? '#d0e6ff' : '#f...` |
| frontend/src/components/ItemSelectionContent.jsx | 1785 | #fff | `bg={styleItem.id === selectedStyleData?.id ? '#d0e6ff' : '#f...` |
| frontend/src/components/ItemSelectionContent.jsx | 1788 | #1a7 | `borderColor={styleItem.id === selectedStyleData?.id ? '#1a73...` |
| frontend/src/components/ItemSelectionContent.jsx | 1788 | #ced | `borderColor={styleItem.id === selectedStyleData?.id ? '#1a73...` |
| frontend/src/components/ItemSelectionContentEdit.jsx | 1372 | #f8f | `bg="#f8f9fa"...` |
| frontend/src/components/ItemSelectionContentEdit.jsx | 1611 | #f8f | `bg="#f8f9fa"...` |
| frontend/src/components/ItemSelectionContentEdit.jsx | 1614 | #1a7 | `borderColor={styleItem.id === selectedStyleData?.id ? '#1a73...` |
| frontend/src/components/ItemSelectionContentEdit.jsx | 1614 | #e9e | `borderColor={styleItem.id === selectedStyleData?.id ? '#1a73...` |
| frontend/src/components/ItemSelectionContentEdit.jsx | 1628 | #d0e | `bg={styleItem.id === selectedStyleData?.id ? '#d0e6ff' : '#f...` |
| frontend/src/components/ItemSelectionContentEdit.jsx | 1628 | #fff | `bg={styleItem.id === selectedStyleData?.id ? '#d0e6ff' : '#f...` |
| frontend/src/components/ItemSelectionContentEdit.jsx | 1631 | #1a7 | `borderColor={styleItem.id === selectedStyleData?.id ? '#1a73...` |
| frontend/src/components/ItemSelectionContentEdit.jsx | 1631 | #ced | `borderColor={styleItem.id === selectedStyleData?.id ? '#1a73...` |
| frontend/src/components/LoginPreview.jsx | 43 | #667 | `const headerBg = config.headerBg || '#667eea'...` |
| frontend/src/components/LoginPreview.jsx | 46 | #0e1 | `() => getOptimalColors(config.backgroundColor || '#0e1446'),...` |
| frontend/src/components/LoginPreview.jsx | 111 | #0e1 | `bg={config.backgroundColor || '#0e1446'}...` |
| frontend/src/components/NeutralModal.jsx | 25 | #fff | `if (!backgroundColor || typeof backgroundColor !== 'string')...` |
| frontend/src/components/NeutralModal.jsx | 27 | #fff | `if (hex.length !== 6) return '#ffffff'...` |
| frontend/src/components/NeutralModal.jsx | 32 | #2d3 | `return luminance > 0.5 ? '#2d3748' : '#ffffff'...` |
| frontend/src/components/NeutralModal.jsx | 32 | #fff | `return luminance > 0.5 ? '#2d3748' : '#ffffff'...` |
| frontend/src/components/NeutralModal.jsx | 37 | #0f1 | `if (!value) return customization?.primaryColor || '#0f172a'...` |
| frontend/src/components/NeutralModal.jsx | 43 | #0f1 | `return customization?.primaryColor || '#0f172a'...` |
| frontend/src/components/TermsModal.jsx | 29 | #fff | `if (!backgroundColor) return '#ffffff'...` |
| frontend/src/components/TermsModal.jsx | 31 | #fff | `if (hex.length !== 6) return '#ffffff'...` |
| frontend/src/components/TermsModal.jsx | 36 | #2d3 | `return luminance > 0.5 ? '#2d3748' : '#ffffff'...` |
| frontend/src/components/TermsModal.jsx | 36 | #fff | `return luminance > 0.5 ? '#2d3748' : '#ffffff'...` |
| frontend/src/components/TermsModal.jsx | 41 | #2d3 | `const isLight = textColor === '#2d3748'...` |
| frontend/src/components/TermsModal.jsx | 48 | #0d6 | `bg: isLight ? '#0d6efd' : '#ffffff',...` |
| frontend/src/components/TermsModal.jsx | 48 | #fff | `bg: isLight ? '#0d6efd' : '#ffffff',...` |
| frontend/src/components/TermsModal.jsx | 49 | #fff | `color: isLight ? '#ffffff' : backgroundColor,...` |
| frontend/src/components/TermsModal.jsx | 50 | #0d6 | `border: isLight ? '#0d6efd' : '#ffffff',...` |
| frontend/src/components/TermsModal.jsx | 50 | #fff | `border: isLight ? '#0d6efd' : '#ffffff',...` |
| frontend/src/components/TermsModal.jsx | 52 | #0b5 | `bg: isLight ? '#0b5ed7' : 'rgba(255, 255, 255, 0.9)',...` |
| frontend/src/components/TermsModal.jsx | 53 | #fff | `color: isLight ? '#ffffff' : backgroundColor,...` |
| frontend/src/components/TermsModal.jsx | 57 | #dc3 | `bg: isLight ? '#dc3545' : '#ef4444',...` |
| frontend/src/components/TermsModal.jsx | 57 | #ef4 | `bg: isLight ? '#dc3545' : '#ef4444',...` |
| frontend/src/components/TermsModal.jsx | 58 | #fff | `color: '#ffffff',...` |
| frontend/src/components/TermsModal.jsx | 59 | #dc3 | `border: isLight ? '#dc3545' : '#ef4444',...` |
| frontend/src/components/TermsModal.jsx | 59 | #ef4 | `border: isLight ? '#dc3545' : '#ef4444',...` |
| frontend/src/components/TermsModal.jsx | 61 | #bb2 | `bg: isLight ? '#bb2d3b' : '#dc2626',...` |
| frontend/src/components/TermsModal.jsx | 61 | #dc2 | `bg: isLight ? '#bb2d3b' : '#dc2626',...` |
| frontend/src/components/TermsModal.jsx | 62 | #fff | `color: '#ffffff',...` |
| frontend/src/components/TermsModal.jsx | 73 | #fff | `return trimmed || '#ffffff'...` |

... and 285 more

**Fix:** Replace hex colors with Chakra tokens:
```jsx
// BAD
<Box bg="#321fdb" color="#ffffff" />

// GOOD
<Box bg="blue.600" color="white" />
// OR with color mode
<Box bg={useColorModeValue('blue.600', 'blue.400')} />
```

### 2. Inline Style Props (247)

**Playbook Rule:** Use Chakra props instead of style={{}} (Step 1)

| File | Line | Code |
|------|------|------|
| frontend/src/components/BrandLogo.jsx | 15 | `style={{ ...EMPTY_STYLE, width: size, height: size }}` |
| frontend/src/components/withDynamicContrast.jsx | 238 | `style={{` |
| frontend/src/pages/auth/SignupPage.jsx | 46 | `<div style={{ maxWidth: '400px' }}>` |
| frontend/src/pages/auth/SignupPage.jsx | 114 | `style={{ minHeight: 44, minWidth: 44 }}` |
| frontend/src/pages/auth/SignupPage.jsx | 121 | `<button type="submit" className="btn btn-primary" style={{ minHeight: 44 }}>` |
| frontend/src/pages/customers/AddCustomerForm.jsx | 42 | `style={{` |
| frontend/src/pages/customers/AddCustomerForm.jsx | 79 | `style={{` |
| frontend/src/pages/customers/AddCustomerForm.jsx | 97 | `style={{` |
| frontend/src/pages/customers/AddCustomerForm.jsx | 146 | `style={{` |
| frontend/src/pages/customers/AddCustomerForm.jsx | 162 | `style={{` |
| frontend/src/pages/customers/AddCustomerForm.jsx | 314 | `<Container fluid className="add-new-customer bg-body" style={{ minHeight: '100vh' }}>` |
| frontend/src/pages/customers/AddCustomerForm.jsx | 324 | `style={{` |
| frontend/src/pages/customers/AddCustomerForm.jsx | 343 | `style={{` |
| frontend/src/pages/customers/AddCustomerForm.jsx | 630 | `style={{` |
| frontend/src/pages/customers/AddCustomerForm.jsx | 644 | `style={{` |
| frontend/src/pages/customers/AddCustomerForm.jsx | 657 | `style={{ width: '16px', height: '16px' }}` |
| frontend/src/pages/customers/CustomerForm.jsx | 208 | `<div style={{ marginBottom: 'var(--sp-3)' }}>` |
| frontend/src/pages/customers/CustomerForm.jsx | 224 | `style={{ minHeight: '44px' }}` |
| frontend/src/pages/customers/CustomerForm.jsx | 234 | `<div style={{ marginBottom: 'var(--sp-3)' }}>` |
| frontend/src/pages/customers/Customers_broken.jsx | 128 | `<Container fluid className="customer-listing" style={{ backgroundColor: '#f8fafc', minHeight: '100vh` |
| frontend/src/pages/customers/Customers_broken.jsx | 130 | `<StandardCard className="-0 -sm" style={{ background: customization.headerBg || '#321fdb', color: cu` |
| frontend/src/pages/customers/Customers_broken.jsx | 143 | `style={{` |
| frontend/src/pages/customers/Customers_broken.jsx | 164 | `<InputLeftAddon style={{ background: 'none', border: 'none' }}>` |
| frontend/src/pages/customers/Customers_broken.jsx | 175 | `style={{` |
| frontend/src/pages/customers/Customers_broken.jsx | 189 | `style={{` |
| frontend/src/pages/customers/Customers_broken.jsx | 231 | `<div style={{ overflowX: 'auto' }}>` |
| frontend/src/pages/customers/Customers_broken.jsx | 233 | `<Thead style={{ backgroundColor: '#f8f9fa' }}>` |
| frontend/src/pages/customers/Customers_broken.jsx | 241 | `style={{ cursor: 'pointer', userSelect: 'none' }}` |
| frontend/src/pages/customers/Customers_broken.jsx | 246 | `<span style={{ fontSize: 'xs', opacity: 0.7 }}>` |
| frontend/src/pages/customers/Customers_broken.jsx | 254 | `style={{ cursor: 'pointer', userSelect: 'none' }}` |
| frontend/src/pages/customers/Customers_broken.jsx | 259 | `<span style={{ fontSize: 'xs', opacity: 0.7 }}>` |
| frontend/src/pages/customers/Customers_broken.jsx | 288 | `<Tr key={cust.id} style={{ transition: 'all 0.2s ease' }}>` |
| frontend/src/pages/customers/Customers_broken.jsx | 293 | `style={{` |
| frontend/src/pages/customers/Customers_broken.jsx | 316 | `style={{` |
| frontend/src/pages/customers/Customers_broken.jsx | 329 | `style={{` |
| frontend/src/pages/customers/Customers_broken.jsx | 347 | `style={{` |
| frontend/src/pages/customers/Customers_broken.jsx | 363 | `style={{` |
| frontend/src/pages/customers/Customers_broken.jsx | 414 | `style={{` |
| frontend/src/pages/customers/Customers_broken.jsx | 441 | `style={{` |
| frontend/src/pages/customers/Customers_broken.jsx | 454 | `style={{` |
| frontend/src/pages/customers/Customers_broken.jsx | 473 | `style={{` |
| frontend/src/pages/customers/Customers_broken.jsx | 489 | `style={{` |
| frontend/src/pages/customers/Customers_broken.jsx | 509 | `style={{` |
| frontend/src/pages/customers/Customers_broken.jsx | 517 | `style={{` |
| frontend/src/pages/customers/Customers_broken.jsx | 533 | `style={{` |
| frontend/src/pages/customers/Customers_broken.jsx | 596 | `style={{` |
| frontend/src/pages/customers/Customers_broken.jsx | 623 | `style={{` |
| frontend/src/pages/customers/Customers_broken.jsx | 636 | `style={{` |
| frontend/src/pages/customers/Customers_broken.jsx | 655 | `style={{` |
| frontend/src/pages/customers/Customers_broken.jsx | 671 | `style={{` |

... and 197 more

**Fix:** Convert to Chakra props:
```jsx
// BAD
<Box style={{ backgroundColor: 'red', fontSize: '14px' }} />

// GOOD
<Box bg="red.500" fontSize="sm" />
```

### 3. Spacing Inconsistencies (412)

**Playbook Rule:** Use spacing={4} for mobile cards, spacing={6} for grids (Step 8.2)

| File | Line | Value | Code |
|------|------|-------|------|
| frontend/src/components/EditManufacturerModal.jsx | 139 | gap=3 | `<ModalFooter gap={3}>...` |
| frontend/src/components/FileViewerModal.jsx | 165 | 3 | `<HStack spacing={3} align="center">...` |
| frontend/src/components/FileViewerModal.jsx | 216 | 3 | `<HStack spacing={3} align="center">...` |
| frontend/src/components/ItemSelectionContent.jsx | 1601 | 2 | `<HStack spacing={2} align="center">...` |
| frontend/src/components/ItemSelectionContent.jsx | 1635 | 2 | `spacing={2}...` |
| frontend/src/components/ItemSelectionContent.jsx | 1693 | 2 | `<Stack className="styles-compact-list" spacing={2}>...` |
| frontend/src/components/ItemSelectionContent.jsx | 1874 | 3 | `spacing={3}...` |
| frontend/src/components/ItemSelectionContent.jsx | 1504 | gap=5 | `gap={5}...` |
| frontend/src/components/ItemSelectionContent.jsx | 1520 | gap=3 | `gap={3}...` |
| frontend/src/components/ItemSelectionContentEdit.jsx | 1449 | 2 | `<HStack spacing={2} align="center">...` |
| frontend/src/components/ItemSelectionContentEdit.jsx | 1483 | 2 | `spacing={2}...` |
| frontend/src/components/ItemSelectionContentEdit.jsx | 1531 | 2 | `<Stack className="styles-compact-list" spacing={2}>...` |
| frontend/src/components/ItemSelectionContentEdit.jsx | 1716 | 3 | `spacing={3}...` |
| frontend/src/components/ItemSelectionContentEdit.jsx | 1337 | gap=5 | `gap={5}...` |
| frontend/src/components/ItemSelectionContentEdit.jsx | 1353 | gap=3 | `gap={3}...` |
| frontend/src/components/LoadingSkeleton.jsx | 16 | 3 | `<Stack spacing={3}>...` |
| frontend/src/components/LoadingSkeleton.jsx | 50 | 3 | `<Stack spacing={3}>...` |
| frontend/src/components/LoadingSkeleton.jsx | 57 | 2 | `<HStack spacing={2}>...` |
| frontend/src/components/LoginPreview.jsx | 113 | 3 | `<Stack spacing={3} textAlign="center" maxW="md">...` |
| frontend/src/components/LoginPreview.jsx | 141 | 1 | `<Stack spacing={1}>...` |
| frontend/src/components/LoginPreview.jsx | 200 | 1 | `<Stack spacing={1}>...` |
| frontend/src/components/LoginPreview.jsx | 229 | 1 | `<Stack spacing={1}>...` |
| frontend/src/components/LoginPreview.jsx | 239 | 1 | `<Stack spacing={1} fontSize='sm' color='gray.600'>...` |
| frontend/src/components/LoginPreview.jsx | 241 | 1 | `<Stack spacing={1} pl={2}>...` |
| frontend/src/components/LoginPreview.jsx | 249 | 3 | `<SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>...` |
| frontend/src/components/LoginPreview.jsx | 259 | 3 | `<SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>...` |
| frontend/src/components/LoginPreview.jsx | 277 | 3 | `<SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>...` |
| frontend/src/components/LoginPreview.jsx | 327 | gap=2 | `<Flex justify='center' wrap='wrap' gap={2}>...` |
| frontend/src/components/PageErrorBoundary.jsx | 38 | 2 | `<Stack spacing={2}>...` |
| frontend/src/components/PageErrorBoundary.jsx | 59 | 3 | `<Stack direction={{ base: 'column', md: 'row' }} spacing={3}...` |
| frontend/src/components/PageHeader.jsx | 116 | 3 | `spacing={3}...` |
| frontend/src/components/PageHeader.jsx | 81 | gap=3 | `<Flex align="center" gap={3} mb={2}>...` |
| frontend/src/components/ProposalAcceptanceModal.jsx | 200 | gap=3 | `<ModalFooter gap={3}>...` |
| frontend/src/components/ResponsiveTable.jsx | 12 | 3 | `<Stack spacing={3}>...` |
| frontend/src/components/SecondaryToolbar.jsx | 24 | 2 | `<HStack spacing={2} align="center" minW="fit-content">...` |
| frontend/src/components/StyleCarousel.jsx | 32 | 3 | `<VStack align="stretch" spacing={3} className={className}>...` |
| frontend/src/components/StyleCarousel.jsx | 35 | 2 | `<HStack spacing={2}>...` |
| frontend/src/components/StyleCarousel.jsx | 53 | 3 | `spacing={3}...` |
| frontend/src/components/StyleCarousel.jsx | 90 | 2 | `<VStack spacing={2} align="stretch">...` |
| frontend/src/components/StyleMerger.jsx | 18 | 3 | `<Stack spacing={3}>...` |
| frontend/src/components/StyleMerger.jsx | 19 | 3 | `<Stack direction={{ base: 'column', sm: 'row' }} spacing={3}...` |
| frontend/src/components/TermsModal.jsx | 188 | gap=3 | `<ModalFooter gap={3}>...` |
| frontend/src/components/TileCard.jsx | 47 | 2 | `<VStack align="start" spacing={2}>...` |
| frontend/src/pages/auth/ForgotPasswordPage.jsx | 119 | 2 | `<VStack spacing={2} textAlign="center">...` |
| frontend/src/pages/auth/ForgotPasswordPage.jsx | 145 | 5 | `<VStack spacing={5} align="stretch">...` |
| frontend/src/pages/auth/LoginPage.jsx | 176 | 2 | `<VStack spacing={2} textAlign="center">...` |
| frontend/src/pages/auth/LoginPage.jsx | 202 | 5 | `<VStack spacing={5} align="stretch">...` |
| frontend/src/pages/auth/LoginPage.jsx | 257 | gap=2 | `gap={2}...` |
| frontend/src/pages/auth/RequestAccessPage.jsx | 198 | 0 | `<List spacing={0}>...` |
| frontend/src/pages/auth/ResetPasswordPage.jsx | 107 | 2 | `<VStack spacing={2} textAlign="center">...` |

... and 362 more

**Fix:** Use standard spacing values:
```jsx
// BAD
<Stack spacing={2}> or <HStack gap={3}>

// GOOD
<Stack spacing={4}> // Mobile cards
<SimpleGrid spacing={6}> // Grid layouts
```

### 4. Button Tap Target Violations (407)

**Playbook Rule:** All interactive elements >= 44×44px (Step 9)

| File | Line | Issue | Code |
|------|------|-------|------|
| frontend/src/components/EditManufacturerModal.jsx | 140 | Button missing minH="44px" for tap target | `<Button variant="outline" onClick={onClose} aria-label="Cancel editing manufacturer">` |
| frontend/src/components/EditManufacturerModal.jsx | 143 | Button missing minH="44px" for tap target | `<Button colorScheme="blue" type="submit" aria-label="Save manufacturer changes">` |
| frontend/src/components/ErrorBoundary.jsx | 31 | Button missing minH="44px" for tap target | `<Button onClick={() => window.location.reload()} colorScheme="brand">` |
| frontend/src/components/FileViewerModal.jsx | 309 | Button missing minH="44px" for tap target | `<Button colorScheme="brand" onClick={handleDownload} leftIcon={<Icon as={Download} />}>` |
| frontend/src/components/FileViewerModal.jsx | 320 | Button missing minH="44px" for tap target | `<Button colorScheme="brand" onClick={handleDownload} leftIcon={<Icon as={Download} />}>` |
| frontend/src/components/FileViewerModal.jsx | 340 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/components/FileViewerModal.jsx | 349 | Button missing minH="44px" for tap target | `<Button variant='outline' colorScheme='gray' onClick={onClose}>` |
| frontend/src/components/ItemSelectionContent.jsx | 1602 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/components/ItemSelectionContent.jsx | 1914 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/components/ItemSelectionContent.jsx | 1950 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/components/ItemSelectionContent.jsx | 2001 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/components/ItemSelectionContent.jsx | 1638 | IconButton missing minW/minH (should be 44px) | `<IconButton` |
| frontend/src/components/ItemSelectionContent.jsx | 1649 | IconButton missing minW/minH (should be 44px) | `<IconButton` |
| frontend/src/components/ItemSelectionContentEdit.jsx | 1450 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/components/ItemSelectionContentEdit.jsx | 1753 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/components/ItemSelectionContentEdit.jsx | 1787 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/components/ItemSelectionContentEdit.jsx | 1836 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/components/ItemSelectionContentEdit.jsx | 1486 | IconButton missing minW/minH (should be 44px) | `<IconButton` |
| frontend/src/components/ItemSelectionContentEdit.jsx | 1497 | IconButton missing minW/minH (should be 44px) | `<IconButton` |
| frontend/src/components/LoginPreview.jsx | 329 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/components/LoginPreview.jsx | 163 | IconButton missing minW/minH (should be 44px) | `<IconButton` |
| frontend/src/components/PageErrorBoundary.jsx | 60 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/components/PageErrorBoundary.jsx | 68 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/components/ProposalAcceptanceModal.jsx | 201 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/components/ProposalAcceptanceModal.jsx | 208 | Button missing minH="44px" for tap target | `<Button colorScheme='brand' type='submit' isLoading={isSubmitting}>` |
| frontend/src/components/StyleCarousel.jsx | 78 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/components/StyleCarousel.jsx | 36 | IconButton missing minW/minH (should be 44px) | `<IconButton` |
| frontend/src/components/StyleCarousel.jsx | 42 | IconButton missing minW/minH (should be 44px) | `<IconButton` |
| frontend/src/components/StyleMerger.jsx | 53 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/pages/auth/ForgotPasswordPage.jsx | 167 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/pages/auth/LoginPage.jsx | 284 | Button missing minH="44px" for tap target | `<Button type="submit" colorScheme="blue" size={{ base: 'md', lg: 'lg' }} w="full" maxW="400px">` |
| frontend/src/pages/auth/LoginPage.jsx | 237 | IconButton missing minW/minH (should be 44px) | `<IconButton` |
| frontend/src/pages/auth/RequestAccessPage.jsx | 412 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/pages/auth/ResetPasswordPage.jsx | 155 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/pages/admin/ContractorDetail.jsx | 79 | Button missing minH="44px" for tap target | `<Button mt={4} leftIcon={<ArrowLeft size={16} />} onClick={handleBack} colorScheme="blue">` |
| frontend/src/pages/admin/ContractorDetail.jsx | 96 | Button missing minH="44px" for tap target | `<Button mt={4} leftIcon={<ArrowLeft size={16} />} onClick={handleBack} colorScheme="blue">` |
| frontend/src/pages/admin/ContractorDetail.jsx | 109 | Button missing minH="44px" for tap target | `<Button onClick={handleBack} leftIcon={<ArrowLeft size={16} />} variant="outline" colorScheme="gray"` |
| frontend/src/pages/admin/Contractors.jsx | 276 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/pages/admin/Contractors.jsx | 309 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/pages/admin/LeadsPage.jsx | 293 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/pages/admin/LeadsPage.jsx | 416 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/pages/admin/LeadsPage.jsx | 491 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/pages/admin/LeadsPage.jsx | 641 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/pages/admin/LeadsPage.jsx | 530 | IconButton missing minW/minH (should be 44px) | `<IconButton size="lg" aria-label={t('common.close', 'Close')}` |
| frontend/src/pages/contracts/index.jsx | 372 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/pages/contracts/index.jsx | 379 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/pages/contracts/index.jsx | 489 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/pages/contracts/index.jsx | 589 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/pages/contracts/index.jsx | 599 | Button missing minH="44px" for tap target | `<Button` |
| frontend/src/pages/contracts/index.jsx | 682 | Button missing minH="44px" for tap target | `<Button` |

... and 357 more

**Fix:** Add minimum height:
```jsx
// BAD
<Button size="sm">Click</Button>
<IconButton aria-label="Icon" icon={<Icon />} />

// GOOD
<Button size="sm" minH="44px">Click</Button>
<IconButton minW="44px" minH="44px" aria-label="Icon" icon={<Icon />} />
```

### 5. Modal Structure Issues (68)

**Playbook Rule:** Modals must have ModalOverlay, scrollBehavior="inside" (Step 7)

| File | Line | Issue |
|------|------|-------|
| frontend/src/components/EditManufacturerModal.jsx | 72 | Modal missing scrollBehavior="inside" |
| frontend/src/components/ProposalAcceptanceModal.jsx | 150 | Modal missing scrollBehavior="inside" |
| frontend/src/components/TermsModal.jsx | 152 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/contracts/index.jsx | 726 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/orders/OrderDetails.jsx | 1036 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/orders/OrderDetails.jsx | 1067 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/orders/OrderDetails.jsx | 1082 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/payments/PaymentsList.jsx | 460 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/payments/PaymentsList.jsx | 492 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/payments/PaymentsList.jsx | 525 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/proposals/EditProposal.jsx | 948 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/proposals/EditProposal.jsx | 977 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/Resources/index.jsx | 1189 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/Resources/index.jsx | 1252 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/Resources/index.jsx | 1362 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/Resources/index.jsx | 1480 | Modal missing scrollBehavior="inside" |
| frontend/src/components/model/EditGroupModal.jsx | 70 | Modal missing scrollBehavior="inside" |
| frontend/src/components/model/EditManufacturerModal.jsx | 70 | Modal missing scrollBehavior="inside" |
| frontend/src/components/model/ModificationModal.jsx | 77 | Modal missing scrollBehavior="inside" |
| frontend/src/components/model/ModificationModalEdit.jsx | 77 | Modal missing scrollBehavior="inside" |
| frontend/src/components/model/PrintPaymentReceiptModal.jsx | 212 | Modal missing scrollBehavior="inside" |
| frontend/src/components/showroom/ShowroomModeToggle.jsx | 126 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/admin/ContractorDetail/ProposalsTab.jsx | 567 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/proposals/CreateProposal/FileUploadSection.jsx | 417 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/proposals/CreateProposal/ProposalSummary.jsx | 779 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/proposals/CreateProposal/ProposalSummary.jsx | 801 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/customization/LoginCustomizerPage.jsx | 946 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/customization/PdfLayoutCustomization.jsx | 784 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 1417 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 2056 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 2138 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 2235 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 2342 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 2452 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx | 3241 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx | 3265 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx | 3453 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx | 3598 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx | 3664 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx | 3741 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx | 3835 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx | 3907 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx | 4241 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx | 4306 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx | 4370 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx | 4497 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx | 4547 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx | 4611 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx | 4703 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx | 4804 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx | 4884 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx | 6309 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx | 6400 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx | 6490 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx | 6566 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx | 7189 | Modal missing ModalOverlay |
| frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx | 7189 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx | 7305 | Modal missing ModalOverlay |
| frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx | 7305 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/StylePicturesTab.jsx | 392 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/StylePicturesTab.jsx | 450 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/StylePicturesTab.jsx | 482 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/TypesTab.jsx | 1056 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/TypesTab.jsx | 1398 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/TypesTab.jsx | 1451 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/TypesTab.jsx | 1574 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/TypesTab.jsx | 1642 | Modal missing scrollBehavior="inside" |
| frontend/src/pages/settings/manufacturers/tabs/TypesTab.jsx | 1706 | Modal missing scrollBehavior="inside" |

**Fix:** Complete modal structure:
```jsx
<Modal isOpen={isOpen} onClose={onClose} size={{ base: 'full', md: 'lg' }} scrollBehavior="inside">
  <ModalOverlay />
  <ModalContent>
    <ModalHeader>Title</ModalHeader>
    <ModalCloseButton />
    <ModalBody>{content}</ModalBody>
  </ModalContent>
</Modal>
```

### 6. Legacy CSS & Bootstrap (122)

**Playbook Rule:** No custom CSS, use Chakra responsive props (Step 2)

| File | Line | Issue |
|------|------|-------|
| frontend/src/components/withDynamicContrast.jsx | 208 | 1 lines of custom CSS |
| frontend/src/components/withDynamicContrast.jsx | 235 | 1 lines of custom CSS |
| frontend/src/components/withDynamicContrast.jsx | 188 | Bootstrap class: ', containerElement =  |
| frontend/src/pages/auth/SignupPage.jsx | 61 | Bootstrap class: form-label |
| frontend/src/pages/auth/SignupPage.jsx | 77 | Bootstrap class: form-label |
| frontend/src/pages/auth/SignupPage.jsx | 93 | Bootstrap class: form-label |
| frontend/src/pages/auth/SignupPage.jsx | 110 | Bootstrap class: btn btn-outline-secondary |
| frontend/src/pages/auth/SignupPage.jsx | 121 | Bootstrap class: btn btn-primary |
| frontend/src/pages/contracts/index.jsx | 194 | 24 lines of custom CSS |
| frontend/src/pages/calender/index.jsx | 247 | 66 lines of custom CSS |
| frontend/src/pages/customers/AddCustomerForm.jsx | 315 | 3 lines of custom CSS |
| frontend/src/pages/customers/Customers_broken.jsx | 465 | Bootstrap class: customer-card-actions |
| frontend/src/pages/customers/Customers_broken.jsx | 647 | Bootstrap class: customer-card-actions |
| frontend/src/pages/customers/Customers_fixed.jsx | 266 | Bootstrap class: table-modern |
| frontend/src/pages/customers/Customers_fixed.jsx | 416 | Bootstrap class: card--compact |
| frontend/src/pages/profile/index.jsx | 160 | 6 lines of custom CSS |
| frontend/src/pages/payments/PaymentCancel.jsx | 14 | 3 lines of custom CSS |
| frontend/src/pages/payments/PaymentTest.jsx | 26 | 3 lines of custom CSS |
| frontend/src/pages/proposals/Proposals.jsx | 487 | 16 lines of custom CSS |
| frontend/src/pages/public/PublicProposalPage.jsx | 102 | 1 lines of custom CSS |
| frontend/src/components/model/PrintPaymentReceiptModal.jsx | 123 | 10 lines of custom CSS |
| frontend/src/pages/admin/ContractorDetail/ProposalsTab.jsx | 394 | Bootstrap class: table-wrap |
| frontend/src/pages/admin/ContractorDetail/ProposalsTab.jsx | 395 | Bootstrap class: table-modern |
| frontend/src/pages/admin/ContractorDetail/ProposalsTab.jsx | 481 | Bootstrap class: align-middle |
| frontend/src/pages/proposals/CreateProposal/ProposalSummary.jsx | 307 | 4 lines of custom CSS |
| frontend/src/pages/proposals/CreateProposal/ProposalSummary.jsx | 311 | Bootstrap class: quote-form-mobile |
| frontend/src/pages/proposals/CreateProposal/ProposalSummary.jsx | 336 | Bootstrap class: form-section |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 424 | 10 lines of custom CSS |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 423 | Bootstrap class: container-fluid |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 439 | Bootstrap class: global-mods-actions d-flex |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 480 | Bootstrap class: form-label |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 488 | Bootstrap class: form-label |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 499 | Bootstrap class: form-label |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 512 | Bootstrap class: form-label |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 564 | Bootstrap class: mb-2 d-flex align-items-center gap-2 |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 579 | Bootstrap class: ms-auto d-flex gap-1 |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 587 | Bootstrap class: icon-btn-44 |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 600 | Bootstrap class: icon-btn-44 |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 607 | Bootstrap class: row g-3 |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 609 | Bootstrap class: col-12 col-md-6 |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 611 | Bootstrap class: border rounded p-2 d-flex align-items-start position-relative |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 645 | Bootstrap class: position-absolute top-0 end-0 m-1 icon-btn-44 |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 677 | Bootstrap class: form-label |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 696 | Bootstrap class: form-label |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 723 | Bootstrap class: form-label |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 739 | Bootstrap class: form-label |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 771 | Bootstrap class: d-flex gap-2 mt-2 |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 843 | Bootstrap class: d-flex gap-2 mt-2 |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 915 | Bootstrap class: d-flex gap-2 mt-2 |
| frontend/src/pages/settings/globalMods/GlobalModsPage.jsx | 1018 | Bootstrap class: d-flex gap-2 mt-2 |

... and 72 more

**Fix:** Remove <style> tags and Bootstrap classes, use Chakra:
```jsx
// BAD
<div className="d-flex justify-content-between align-items-center">

// GOOD
<Flex justify="space-between" align="center">
```

## Priority Fix Order

1. **Import Issues** - Replace CoreUI imports with Chakra
2. **Hardcoded Colors** - Use Chakra color tokens
3. **Inline Styles** - Convert to Chakra props
4. **Legacy CSS** - Remove custom CSS and Bootstrap classes
5. **Spacing** - Standardize to playbook values
6. **Buttons** - Add minH="44px" for tap targets
7. **Modals** - Complete structure with ModalOverlay and scrollBehavior

## Next Steps

Run the fix script:
```bash
node scripts/fix-audit-violations.mjs
```

Or fix manually following the examples above.
