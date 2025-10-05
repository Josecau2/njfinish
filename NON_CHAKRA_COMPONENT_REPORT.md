# Chakra Component Conversion Backlog

Generated via `scripts/find_non_chakra_components.py --root frontend/src --json`, filtering out non-component modules (stores, utils, API clients, etc.).

## Summary

- Total React-like files scanned: 257
- Files identified as components: 145
- Components already Chakra-only: 39
- Components needing cleanup: 106

### Issues by Reason (components only)

- **raw_html_tags**: 104
- **className_usage**: 5
- **missing @chakra-ui/react import**: 2
- **inline_style_usage**: 1

## Component Findings

- `components/AppFooter.js` — status: mixed; reasons: raw_html_tags
- `components/AppSidebar.js` — status: mixed; reasons: raw_html_tags
- `components/CatalogTable.js` — status: mixed; reasons: raw_html_tags
- `components/CatalogTableEdit.js` — status: mixed; reasons: raw_html_tags, inline_style_usage
- `components/DataTable/DataTable.jsx` — status: mixed; reasons: raw_html_tags
- `components/DocsComponents.js` — status: mixed; reasons: raw_html_tags
- `components/DocsIcons.js` — status: mixed; reasons: raw_html_tags
- `components/EditManufacturerModal.jsx` — status: mixed; reasons: raw_html_tags
- `components/EditUsersModel.js` — status: mixed; reasons: raw_html_tags
- `components/FileViewerModal.jsx` — status: mixed; reasons: raw_html_tags
- `components/ItemSelectionContent.jsx` — status: mixed; reasons: raw_html_tags
- `components/ItemSelectionContentEdit.jsx` — status: mixed; reasons: raw_html_tags
- `components/LanguageSwitcher.jsx` — status: mixed; reasons: raw_html_tags
- `components/LoginPreview.jsx` — status: mixed; reasons: raw_html_tags
- `components/NotificationBell.js` — status: mixed; reasons: raw_html_tags
- `components/PageErrorBoundary.jsx` — status: mixed; reasons: raw_html_tags
- `components/ProposalAcceptanceModal.jsx` — status: mixed; reasons: raw_html_tags
- `components/ResponsiveTable.jsx` — status: mixed; reasons: raw_html_tags
- `components/StyleCarousel.jsx` — status: mixed; reasons: raw_html_tags
- `components/StyleMerger.jsx` — status: mixed; reasons: raw_html_tags
- `components/TermsModal.jsx` — status: mixed; reasons: raw_html_tags
- `components/contact/ContactInfoEditor.jsx` — status: mixed; reasons: raw_html_tags
- `components/contact/MessageComposer.jsx` — status: mixed; reasons: raw_html_tags
- `components/contact/MessageHistory.jsx` — status: mixed; reasons: raw_html_tags
- `components/contact/ThreadView.jsx` — status: mixed; reasons: raw_html_tags
- `components/model/EditGroupModal.jsx` — status: mixed; reasons: raw_html_tags
- `components/model/EditManufacturerModal.jsx` — status: mixed; reasons: raw_html_tags
- `components/model/EmailContractModal.jsx` — status: mixed; reasons: raw_html_tags
- `components/model/EmailProposalModal.jsx` — status: mixed; reasons: raw_html_tags
- `components/model/ModificationBrowserModal.jsx` — status: mixed; reasons: raw_html_tags
- `components/model/ModificationModal.jsx` — status: mixed; reasons: raw_html_tags
- `components/model/ModificationModalEdit.jsx` — status: mixed; reasons: raw_html_tags
- `components/model/PrintPaymentReceiptModal.jsx` — status: mixed; reasons: raw_html_tags
- `components/model/PrintProposalModal.jsx` — status: mixed; reasons: raw_html_tags
- `components/showroom/ShowroomModeToggle.jsx` — status: mixed; reasons: raw_html_tags
- `components/ui/CButton.jsx` — status: mixed; reasons: raw_html_tags
- `pages/3dkitchen/ComingSoon.jsx` — status: mixed; reasons: raw_html_tags
- `pages/Resources/index.jsx` — status: mixed; reasons: raw_html_tags
- `pages/admin/ContractorDetail.jsx` — status: mixed; reasons: raw_html_tags
- `pages/admin/ContractorDetail/CustomersTab.jsx` — status: mixed; reasons: raw_html_tags
- `pages/admin/ContractorDetail/ProposalsTab.jsx` — status: mixed; reasons: raw_html_tags
- `pages/admin/ContractorDetail/SettingsTab.jsx` — status: mixed; reasons: raw_html_tags
- `pages/admin/Contractors.jsx` — status: mixed; reasons: raw_html_tags
- `pages/admin/LeadsPage.jsx` — status: mixed; reasons: raw_html_tags
- `pages/auth/ForgotPasswordPage.jsx` — status: mixed; reasons: raw_html_tags, className_usage
- `pages/auth/LoginPage.jsx` — status: mixed; reasons: raw_html_tags, className_usage
- `pages/auth/RequestAccessPage.jsx` — status: mixed; reasons: raw_html_tags, className_usage
- `pages/auth/ResetPasswordPage.jsx` — status: mixed; reasons: raw_html_tags, className_usage
- `pages/auth/SignupPage.jsx` — status: mixed; reasons: raw_html_tags, className_usage
- `pages/calender/index.jsx` — status: mixed; reasons: raw_html_tags
- `pages/contractor/ContractorDashboard.jsx` — status: mixed; reasons: raw_html_tags
- `pages/contracts/index.jsx` — status: mixed; reasons: raw_html_tags
- `pages/customers/AddCustomerForm.jsx` — status: mixed; reasons: raw_html_tags
- `pages/customers/CustomerForm.jsx` — status: mixed; reasons: raw_html_tags
- `pages/customers/Customers.jsx` — status: mixed; reasons: raw_html_tags
- `pages/customers/EditCustomerPage.jsx` — status: mixed; reasons: raw_html_tags
- `pages/dashboard/Dashboard.jsx` — status: mixed; reasons: raw_html_tags
- `pages/orders/OrderDetails.jsx` — status: mixed; reasons: raw_html_tags
- `pages/orders/OrdersList.jsx` — status: mixed; reasons: raw_html_tags
- `pages/payments/PaymentCancel.jsx` — status: mixed; reasons: raw_html_tags
- `pages/payments/PaymentConfiguration.jsx` — status: mixed; reasons: raw_html_tags
- `pages/payments/PaymentPage.jsx` — status: mixed; reasons: raw_html_tags
- `pages/payments/PaymentSuccess.jsx` — status: mixed; reasons: raw_html_tags
- `pages/payments/PaymentTest.jsx` — status: mixed; reasons: raw_html_tags
- `pages/payments/PaymentsList.jsx` — status: mixed; reasons: raw_html_tags
- `pages/profile/index.jsx` — status: mixed; reasons: raw_html_tags
- `pages/proposals/CreateProposal/CustomerInfo.jsx` — status: mixed; reasons: raw_html_tags
- `pages/proposals/CreateProposal/DesignUpload.jsx` — status: mixed; reasons: raw_html_tags
- `pages/proposals/CreateProposal/FileUploadSection.jsx` — status: mixed; reasons: raw_html_tags
- `pages/proposals/CreateProposal/ManufacturerSelect.jsx` — status: mixed; reasons: raw_html_tags
- `pages/proposals/CreateProposal/ProposalSummary.jsx` — status: mixed; reasons: raw_html_tags
- `pages/proposals/CreateProposalForm.jsx` — status: mixed; reasons: raw_html_tags
- `pages/proposals/EditProposal.jsx` — status: mixed; reasons: raw_html_tags
- `pages/proposals/Proposals.jsx` — status: mixed; reasons: raw_html_tags
- `pages/public/PublicProposalPage.jsx` — status: mixed; reasons: raw_html_tags
- `pages/settings/customization/CustomizationPage.jsx` — status: mixed; reasons: raw_html_tags
- `pages/settings/customization/LoginCustomizerPage.jsx` — status: mixed; reasons: raw_html_tags
- `pages/settings/customization/PdfLayoutCustomization.jsx` — status: mixed; reasons: raw_html_tags
- `pages/settings/globalMods/GlobalModsPage.jsx` — status: mixed; reasons: raw_html_tags
- `pages/settings/locations/CreateLocation.jsx` — status: mixed; reasons: raw_html_tags
- `pages/settings/locations/EditLocation.jsx` — status: mixed; reasons: raw_html_tags
- `pages/settings/locations/LocationList.jsx` — status: mixed; reasons: raw_html_tags
- `pages/settings/manufacturers/ManufacturersForm.jsx` — status: mixed; reasons: raw_html_tags
- `pages/settings/manufacturers/ManufacturersList.jsx` — status: mixed; reasons: raw_html_tags
- `pages/settings/manufacturers/tabs/CatalogMappingTab.jsx` — status: mixed; reasons: raw_html_tags
- `pages/settings/manufacturers/tabs/EditManufacturerTab.jsx` — status: mixed; reasons: raw_html_tags
- `pages/settings/manufacturers/tabs/FilesHistoryTab.jsx` — status: mixed; reasons: raw_html_tags
- `pages/settings/manufacturers/tabs/SettingsTab.jsx` — status: mixed; reasons: raw_html_tags
- `pages/settings/manufacturers/tabs/StylePicturesTab.jsx` — status: mixed; reasons: raw_html_tags
- `pages/settings/manufacturers/tabs/TypesTab.jsx` — status: mixed; reasons: raw_html_tags
- `pages/settings/multipliers/EditManuMultiplier.jsx` — status: mixed; reasons: raw_html_tags
- `pages/settings/multipliers/ManuMultipliers.jsx` — status: mixed; reasons: raw_html_tags
- `pages/settings/taxes/TaxesPage.jsx` — status: mixed; reasons: raw_html_tags
- `pages/settings/terms/TermsPage.jsx` — status: mixed; reasons: raw_html_tags
- `pages/settings/users/CreateUser.jsx` — status: mixed; reasons: raw_html_tags
- `pages/settings/users/EditUser.jsx` — status: mixed; reasons: raw_html_tags
- `pages/settings/users/UserList.jsx` — status: mixed; reasons: raw_html_tags
- `pages/settings/usersGroup/CreateUserGroup.jsx` — status: mixed; reasons: raw_html_tags
- `pages/settings/usersGroup/EditUserGroup.jsx` — status: mixed; reasons: raw_html_tags
- `pages/settings/usersGroup/UserGroupList.jsx` — status: mixed; reasons: raw_html_tags
- `routes/__audit__/index.jsx` — status: mixed; reasons: raw_html_tags
- `views/notifications/NotificationsPage.js` — status: mixed; reasons: raw_html_tags
- `views/pages/page404/Page404.jsx` — status: mixed; reasons: raw_html_tags
- `views/proposals/AdminProposalView.js` — status: mixed; reasons: raw_html_tags
- `pages/orders/AdminOrders.jsx` — status: no_chakra; reasons: missing @chakra-ui/react import
- `pages/orders/MyOrders.jsx` — status: no_chakra; reasons: missing @chakra-ui/react import

## Components Importing Non-Chakra UI Libraries

- None detected
