# COMPLETE DARK MODE INVESTIGATION MANIFEST
## Generated: Fri, Oct  3, 2025 12:24:53 AM

## EXECUTIVE SUMMARY
- **Total Hardcoded Colors Found: 529**
- **Files Without Dark Mode: 42**
- **Hardcoded Backgrounds: 80**
- **Hardcoded Text Colors: 415**
- **Hardcoded Border Colors: 53**

## FILES WITHOUT DARK MODE SUPPORT (42 FILES)

- **./components/AppBreadcrumb.jsx** - 3 hardcoded colors
- **./components/common/EmptyState.jsx** - 1 hardcoded colors
- **./components/contact/ContactInfoCard.jsx** - 7 hardcoded colors
- **./components/contact/ContactInfoEditor.jsx** - 1 hardcoded colors
- **./components/contact/MessageHistory.jsx** - 4 hardcoded colors
- **./components/contact/ThreadView.jsx** - 4 hardcoded colors
- **./components/ContentTile/index.jsx** - 2 hardcoded colors
- **./components/DataTable/ResponsiveTable.jsx** - 1 hardcoded colors
- **./components/EmbeddedPaymentForm.jsx** - 1 hardcoded colors
- **./components/ErrorBoundary.jsx** - 2 hardcoded colors
- **./components/FileViewerModal.jsx** - 3 hardcoded colors
- **./components/ItemSelectionContentEdit.jsx** - 26 hardcoded colors
- **./components/LoginPreview.jsx** - 1 hardcoded colors
- **./components/model/ModificationModal.jsx** - 3 hardcoded colors
- **./components/model/ModificationModalEdit.jsx** - 3 hardcoded colors
- **./components/model/PrintPaymentReceiptModal.jsx** - 2 hardcoded colors
- **./components/PageErrorBoundary.jsx** - 5 hardcoded colors
- **./components/pdf/DesktopPdfViewer.jsx** - 2 hardcoded colors
- **./components/pdf/MobilePdfViewer.jsx** - 1 hardcoded colors
- **./components/StyleCarousel.jsx** - 2 hardcoded colors
- **./components/StyleMerger.jsx** - 2 hardcoded colors
- **./layout/DefaultLayout.jsx** - 6 hardcoded colors
- **./pages/admin/ContractorDetail/CustomersTab.jsx** - 29 hardcoded colors
- **./pages/admin/ContractorDetail/OverviewTab.jsx** - 2 hardcoded colors
- **./pages/admin/ContractorDetail/ProposalsTab.jsx** - 1 hardcoded colors
- **./pages/admin/ContractorDetail.jsx** - 4 hardcoded colors
- **./pages/calender/index.jsx** - 3 hardcoded colors
- **./pages/payments/PaymentPage.jsx** - 5 hardcoded colors
- **./pages/payments/PaymentSuccess.jsx** - 3 hardcoded colors
- **./pages/proposals/CreateProposal/CustomerInfo.jsx** - 2 hardcoded colors
- **./pages/proposals/CreateProposal/FileUploadSection.jsx** - 14 hardcoded colors
- **./pages/proposals/CreateProposal/ProposalSummary.jsx** - 2 hardcoded colors
- **./pages/settings/manufacturers/EditManufacturer.jsx** - 1 hardcoded colors
- **./pages/settings/manufacturers/ManufacturersForm.jsx** - 25 hardcoded colors
- **./pages/settings/manufacturers/tabs/SettingsTab.jsx** - 17 hardcoded colors
- **./pages/settings/manufacturers/tabs/StylePicturesTab.jsx** - 8 hardcoded colors
- **./pages/settings/terms/TermsPage.jsx** - 2 hardcoded colors
- **./pages/settings/users/EditUser.jsx** - 14 hardcoded colors
- **./pages/settings/usersGroup/CreateUserGroup.jsx** - 21 hardcoded colors
- **./pages/settings/usersGroup/EditUserGroup.jsx** - 12 hardcoded colors
- **./routes/__audit__/index.jsx** - 11 hardcoded colors
- **./views/pages/page404/Page404.jsx** - 4 hardcoded colors

## CHAKRA COMPONENT ISSUES

### Text Component (212 instances)
components/common/EmptyState.jsx:20:      <Text color="gray.500" fontSize="sm">
components/contact/ContactInfoCard.jsx:12:      <Text fontSize="sm" color="gray.500">
components/contact/ContactInfoCard.jsx:15:      <Text fontWeight="semibold" color="gray.800" maxW="60%" textAlign="right" noOfLines={2}>
components/contact/ContactInfoCard.jsx:37:            <Text color="gray.500" fontSize="sm">
components/contact/ContactInfoCard.jsx:52:                <Text fontSize="sm" color="gray.500" mb={1}>
components/contact/ContactInfoCard.jsx:55:                <Text fontWeight="semibold" color="gray.800">
components/contact/MessageHistory.jsx:59:      <Text fontSize="sm" color="gray.500">
components/contact/MessageHistory.jsx:84:                <Text fontSize="xs" color="gray.500" noOfLines={1}>
components/contact/MessageHistory.jsx:124:                <Text fontSize="xs" color="gray.500">
components/contact/ThreadView.jsx:18:      <Text fontSize="xs" color="gray.500" mb={1}>
components/contact/ThreadView.jsx:86:            <Text fontSize="sm" color="gray.500">
components/contact/ThreadView.jsx:108:                  <Text fontSize="sm" color="gray.500">
components/DataTable/ResponsiveTable.jsx:28:                <Text fontSize="xs" color="gray.500" fontWeight="600" mb={1}>
components/DocsComponents.js:28:        <Text flex="1" color="gray.700" textAlign={{ base: 'center', xl: 'left' }}>
components/DocsIcons.js:24:      <Text flex="1" color="gray.700" textAlign={{ base: 'center', xl: 'left' }}>
components/ErrorBoundary.jsx:23:          <Text mb={4} color="gray.600">
components/ErrorBoundary.jsx:27:            <Text fontSize="sm" color="gray.500" mb={4} fontFamily="mono">
components/header/AppHeaderDropdown.js:68:                  <Text fontSize="xs" color="muted">
components/ItemSelectionContent.jsx:1915:                        <Text color="red.500" mt={1} mb={4}>
components/ItemSelectionContentEdit.jsx:1491:                                            <Text py={4} color="gray.500">
components/ItemSelectionContentEdit.jsx:1495:                                            <Text py={4} color="gray.500">
components/ItemSelectionContentEdit.jsx:1501:                                                    <Text py={4} textAlign="center" color="gray.500" fontSize="sm">
components/ItemSelectionContentEdit.jsx:1612:                                                                            <Text fontSize="xs" color="blue.500" mb="0.25rem">
components/ItemSelectionContentEdit.jsx:1737:                        <Text color="red.500" mt={1} mb={4}>
components/ItemSelectionContentEdit.jsx:1822:                            <Text color="gray.500" textAlign="center" py={3} fontSize="sm">
components/Loader.js:15:        <Text fontSize="sm" color="gray.500">
components/model/ModificationBrowserModal.jsx:422:              {config.customerUpload.required && <Text color="red.500">*</Text>}
components/model/ModificationModal.jsx:152:                  <Text fontSize="xs" color="gray.500" mt={2}>
components/model/ModificationModal.jsx:221:                      <Text fontSize="xs" color="gray.500" mt={1}>
components/model/ModificationModal.jsx:235:                  <Text fontSize="xs" color="gray.500" mt={2}>
components/model/ModificationModalEdit.jsx:152:                  <Text fontSize="xs" color="gray.500" mt={2}>
components/model/ModificationModalEdit.jsx:221:                      <Text fontSize="xs" color="gray.500" mt={1}>
components/model/ModificationModalEdit.jsx:235:                  <Text fontSize="xs" color="gray.500" mt={2}>
components/model/PrintPaymentReceiptModal.jsx:268:            <Text fontSize="sm" color="gray.600">
components/NotificationBell.js:342:                        <Text fontSize="xs" color="muted" noOfLines={2}>
components/NotificationBell.js:346:                      <Text fontSize="xs" color="muted" mt={1}>
components/PageErrorBoundary.jsx:45:                  <Text color="gray.600" fontSize="lg">
components/PageErrorBoundary.jsx:86:                <Text fontSize="sm" color="gray.500">
components/pdf/DesktopPdfViewer.jsx:84:            <Text color="red.500" fontSize="sm">
components/pdf/MobilePdfViewer.jsx:39:            <Text fontSize="sm" color="red.500">
components/showroom/ShowroomModeToggle.jsx:167:              <Text fontSize="xs" color="red.500" mt={1}>
helpers/notify.js:61:              <Text fontSize="sm" color="muted" mt={1}>
layout/DefaultLayout.jsx:130:          <Text color="muted" mb={4}>
pages/admin/ContractorDetail/CustomersTab.jsx:263:              <Text fontSize="sm" color="gray.600">
pages/admin/ContractorDetail/CustomersTab.jsx:282:                  <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wide">
pages/admin/ContractorDetail/CustomersTab.jsx:356:                                <Text fontSize="xs" color="gray.500">
pages/admin/ContractorDetail/CustomersTab.jsx:369:                              <Text fontSize="sm" color="gray.500">
pages/admin/ContractorDetail/CustomersTab.jsx:381:                              <Text fontSize="sm" color="gray.500">
pages/admin/ContractorDetail/CustomersTab.jsx:393:                              <Text fontSize="sm" color="gray.500">
pages/admin/ContractorDetail/CustomersTab.jsx:438:                                <Text fontSize="xs" color="gray.500">

### Box Component (31 instances)
components/AppBreadcrumb.jsx:37:    <Box px={{ base: 3, md: 4, lg: 6 }} py={2} bg="transparent">
components/contact/ContactInfoEditor.jsx:121:          <Box bg="gray.50" borderRadius="md" px={4} py={3} mb={6} borderWidth="1px" borderColor="gray.100">
components/ContentTile/index.jsx:115:            <Box color="gray.500" flexShrink={0} mt={0.5}>
components/DocsComponents.js:11:    <Box bg="blue.50" borderWidth="2px" borderColor="blue.500" borderRadius="md" mb={4}>
components/DocsExample.js:11:    <Box className="example" borderWidth="1px" borderRadius="md" overflow="hidden" bg="white" boxShadow="sm">
components/DocsIcons.js:7:  <Box bg="yellow.50" borderWidth="2px" borderColor="yellow.400" borderRadius="md" mb={4}>
components/PageErrorBoundary.jsx:37:                <Box color="red.500">
components/pdf/DesktopPdfViewer.jsx:76:      <Box flex="1" borderWidth="1px" borderRadius="md" bg="gray.50" overflow="auto" p={4}>
components/StyleCarousel.jsx:65:          <Box px={3} py={2} color="gray.500" fontSize="sm">
pages/proposals/CreateProposal/FileUploadSection.jsx:383:            <Box mt={6} p={4} borderRadius="lg" bg="blue.50" borderWidth="1px" borderColor="blue.100">
pages/proposals/CreateProposal/ManufacturerSelect.jsx:300:                                <Box position="relative" bg="gray.50" overflow="hidden" height="180px">
pages/settings/manufacturers/ManufacturersForm.jsx:150:      <Box border="2px dashed" borderColor="gray.300" borderRadius="lg" p={4} textAlign="center" position="relative" bg="gray.50">
pages/settings/manufacturers/tabs/SettingsTab.jsx:197:          <Box px={3} py={2} fontSize="xs" color="gray.500">
pages/settings/manufacturers/tabs/StylePicturesTab.jsx:487:                <Box mb={4} borderWidth="1px" borderRadius="md" p={3} bg="gray.50">
pages/settings/manufacturers/tabs/TypesTab.jsx:824:              <Box mb={4} p={3} bg="brand.50" borderRadius="md" border="1px" borderColor="brand.200">
pages/settings/users/CreateUser.jsx:21:        <Box p={2} borderRadius="md" bg="brand.50">
pages/settings/users/EditUser.jsx:155:                    <Box p={2} borderRadius="md" bg="brand.50">
pages/settings/users/EditUser.jsx:275:                    <Box p={2} borderRadius="md" bg="brand.50">
pages/settings/users/EditUser.jsx:357:                    <Box p={2} borderRadius="md" bg="brand.50">
pages/settings/users/EditUser.jsx:453:                    <Box p={2} borderRadius="md" bg="brand.50">
pages/settings/usersGroup/CreateUserGroup.jsx:216:                <Box w="24px" h="24px" bg="green.50" color="green.500" borderRadius="full" display="flex" alignItems="center" justifyContent="center">
pages/settings/usersGroup/CreateUserGroup.jsx:242:              <Box mb={4} p={3} borderRadius="md" bg="blue.50" border="1px solid" borderColor="blue.200">
pages/settings/usersGroup/CreateUserGroup.jsx:244:                  <Box w="32px" h="32px" bg={customization.headerBg || "purple.500"} color="white" borderRadius="full" display="flex" alignItems="center" justifyContent="center">
pages/settings/usersGroup/EditUserGroup.jsx:281:              <Box borderRadius="lg" bg="blue.50" borderWidth="1px" borderColor="blue.100" p={4}>
views/notifications/NotificationsPage.js:361:                            <Box mt={1} color="brand.500">
views/pages/page404/Page404.jsx:8:    <Box minH="100vh" display="flex" alignItems="center" bg="gray.50" role="main">
views/proposals/AdminProposalView.js:400:                    <Box bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.200" p={4}>

