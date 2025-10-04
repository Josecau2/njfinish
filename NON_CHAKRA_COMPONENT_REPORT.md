# Non-Chakra Component Scan

Command: python scripts/find_non_chakra_components.py --root frontend/src

```
Chakra UI component audit summary
----------------------------------------
total               : 260
chakra_only         : 41
mixed               : 111
no_chakra           : 108
components_flagged  : 110

Flagged components:
----------------------------------------
mixed      | components/AppContent.js | reasons: inline_style_usage
mixed      | components/AppFooter.js | reasons: raw_html_tags
mixed      | components/AppSidebar.js | reasons: raw_html_tags
mixed      | components/AppSidebarNav.js | reasons: inline_style_usage
mixed      | components/CatalogTable.js | reasons: raw_html_tags, inline_style_usage
mixed      | components/CatalogTableEdit.js | reasons: raw_html_tags, inline_style_usage
mixed      | components/DocsComponents.js | reasons: raw_html_tags
mixed      | components/DocsIcons.js | reasons: raw_html_tags
mixed      | components/EditManufacturerModal.jsx | reasons: raw_html_tags
mixed      | components/EditUsersModel.js | reasons: raw_html_tags
mixed      | components/FileViewerModal.jsx | reasons: raw_html_tags
mixed      | components/ItemSelectionContent.jsx | reasons: raw_html_tags
mixed      | components/ItemSelectionContentEdit.jsx | reasons: raw_html_tags
mixed      | components/LanguageSwitcher.jsx | reasons: raw_html_tags
mixed      | components/LoginPreview.jsx | reasons: raw_html_tags
mixed      | components/NotificationBell.js | reasons: raw_html_tags
mixed      | components/PageErrorBoundary.jsx | reasons: raw_html_tags
mixed      | components/ProposalAcceptanceModal.jsx | reasons: raw_html_tags
mixed      | components/ResponsiveTable.jsx | reasons: raw_html_tags
mixed      | components/StyleCarousel.jsx | reasons: raw_html_tags
mixed      | components/StyleMerger.jsx | reasons: raw_html_tags
mixed      | components/TermsModal.jsx | reasons: raw_html_tags
mixed      | components/contact/ContactInfoEditor.jsx | reasons: raw_html_tags
mixed      | components/contact/MessageComposer.jsx | reasons: raw_html_tags
mixed      | components/contact/MessageHistory.jsx | reasons: raw_html_tags
mixed      | components/contact/ThreadView.jsx | reasons: raw_html_tags
mixed      | components/DataTable/DataTable.jsx | reasons: raw_html_tags, inline_style_usage
mixed      | components/model/EditGroupModal.jsx | reasons: raw_html_tags
mixed      | components/model/EditManufacturerModal.jsx | reasons: raw_html_tags
mixed      | components/model/EmailContractModal.jsx | reasons: raw_html_tags
mixed      | components/model/EmailProposalModal.jsx | reasons: raw_html_tags
mixed      | components/model/ModificationBrowserModal.jsx | reasons: raw_html_tags
mixed      | components/model/ModificationModal.jsx | reasons: raw_html_tags
mixed      | components/model/ModificationModalEdit.jsx | reasons: raw_html_tags
mixed      | components/model/PrintPaymentReceiptModal.jsx | reasons: raw_html_tags
mixed      | components/model/PrintProposalModal.jsx | reasons: raw_html_tags, inline_style_usage
mixed      | components/pdf/DesktopPdfViewer.jsx | reasons: raw_html_tags
mixed      | components/pdf/MobilePdfViewer.jsx | reasons: raw_html_tags
mixed      | components/showroom/ShowroomModeToggle.jsx | reasons: raw_html_tags
mixed      | components/ui/CButton.jsx | reasons: raw_html_tags
mixed      | pages/3dkitchen/ComingSoon.jsx | reasons: raw_html_tags
mixed      | pages/admin/ContractorDetail.jsx | reasons: raw_html_tags
mixed      | pages/admin/Contractors.jsx | reasons: raw_html_tags
mixed      | pages/admin/LeadsPage.jsx | reasons: raw_html_tags
mixed      | pages/admin/ContractorDetail/CustomersTab.jsx | reasons: raw_html_tags
mixed      | pages/admin/ContractorDetail/ProposalsTab.jsx | reasons: raw_html_tags
mixed      | pages/admin/ContractorDetail/SettingsTab.jsx | reasons: raw_html_tags
mixed      | pages/auth/ForgotPasswordPage.jsx | reasons: raw_html_tags, className_usage
mixed      | pages/auth/LoginPage.jsx | reasons: raw_html_tags, className_usage
mixed      | pages/auth/RequestAccessPage.jsx | reasons: raw_html_tags, className_usage
mixed      | pages/auth/ResetPasswordPage.jsx | reasons: raw_html_tags, className_usage
mixed      | pages/auth/SignupPage.jsx | reasons: raw_html_tags, className_usage
mixed      | pages/calender/index.jsx | reasons: raw_html_tags
mixed      | pages/contractor/ContractorDashboard.jsx | reasons: raw_html_tags
mixed      | pages/contracts/index.jsx | reasons: raw_html_tags
mixed      | pages/customers/AddCustomerForm.jsx | reasons: raw_html_tags, inline_style_usage
mixed      | pages/customers/CustomerForm.jsx | reasons: raw_html_tags
mixed      | pages/customers/Customers.jsx | reasons: raw_html_tags
mixed      | pages/customers/EditCustomerPage.jsx | reasons: raw_html_tags
mixed      | pages/dashboard/Dashboard.jsx | reasons: raw_html_tags
no_chakra  | pages/orders/AdminOrders.jsx | reasons: missing @chakra-ui/react import
no_chakra  | pages/orders/MyOrders.jsx | reasons: missing @chakra-ui/react import
mixed      | pages/orders/OrderDetails.jsx | reasons: raw_html_tags
mixed      | pages/orders/OrdersList.jsx | reasons: raw_html_tags, inline_style_usage
mixed      | pages/payments/PaymentCancel.jsx | reasons: raw_html_tags
mixed      | pages/payments/PaymentConfiguration.jsx | reasons: raw_html_tags
mixed      | pages/payments/PaymentPage.jsx | reasons: raw_html_tags
mixed      | pages/payments/PaymentsList.jsx | reasons: raw_html_tags
mixed      | pages/payments/PaymentSuccess.jsx | reasons: raw_html_tags
mixed      | pages/payments/PaymentTest.jsx | reasons: raw_html_tags
mixed      | pages/profile/index.jsx | reasons: raw_html_tags
mixed      | pages/proposals/CreateProposalForm.jsx | reasons: raw_html_tags, inline_style_usage
mixed      | pages/proposals/EditProposal.jsx | reasons: raw_html_tags
mixed      | pages/proposals/Proposals.jsx | reasons: raw_html_tags, inline_style_usage
mixed      | pages/proposals/CreateProposal/CustomerInfo.jsx | reasons: raw_html_tags
mixed      | pages/proposals/CreateProposal/DesignUpload.jsx | reasons: raw_html_tags, inline_style_usage
mixed      | pages/proposals/CreateProposal/FileUploadSection.jsx | reasons: raw_html_tags, inline_style_usage
mixed      | pages/proposals/CreateProposal/ManufacturerSelect.jsx | reasons: raw_html_tags, inline_style_usage
mixed      | pages/proposals/CreateProposal/ProposalSummary.jsx | reasons: raw_html_tags
mixed      | pages/public/PublicProposalPage.jsx | reasons: raw_html_tags
mixed      | pages/Resources/index.jsx | reasons: raw_html_tags
mixed      | pages/settings/customization/CustomizationPage.jsx | reasons: raw_html_tags
mixed      | pages/settings/customization/LoginCustomizerPage.jsx | reasons: raw_html_tags, inline_style_usage
mixed      | pages/settings/customization/PdfLayoutCustomization.jsx | reasons: raw_html_tags, inline_style_usage
mixed      | pages/settings/globalMods/GlobalModsPage.jsx | reasons: raw_html_tags, inline_style_usage
mixed      | pages/settings/locations/CreateLocation.jsx | reasons: raw_html_tags, inline_style_usage
mixed      | pages/settings/locations/EditLocation.jsx | reasons: raw_html_tags
mixed      | pages/settings/locations/LocationList.jsx | reasons: raw_html_tags
mixed      | pages/settings/manufacturers/ManufacturersForm.jsx | reasons: raw_html_tags, inline_style_usage
mixed      | pages/settings/manufacturers/ManufacturersList.jsx | reasons: raw_html_tags, inline_style_usage
mixed      | pages/settings/manufacturers/tabs/CatalogMappingTab.jsx | reasons: raw_html_tags, inline_style_usage
mixed      | pages/settings/manufacturers/tabs/EditManufacturerTab.jsx | reasons: raw_html_tags
mixed      | pages/settings/manufacturers/tabs/FilesHistoryTab.jsx | reasons: raw_html_tags
mixed      | pages/settings/manufacturers/tabs/SettingsTab.jsx | reasons: raw_html_tags
mixed      | pages/settings/manufacturers/tabs/StylePicturesTab.jsx | reasons: raw_html_tags, inline_style_usage
mixed      | pages/settings/manufacturers/tabs/TypesTab.jsx | reasons: raw_html_tags, inline_style_usage
mixed      | pages/settings/multipliers/EditManuMultiplier.jsx | reasons: raw_html_tags, inline_style_usage
mixed      | pages/settings/multipliers/ManuMultipliers.jsx | reasons: raw_html_tags
mixed      | pages/settings/taxes/TaxesPage.jsx | reasons: raw_html_tags
mixed      | pages/settings/terms/TermsPage.jsx | reasons: raw_html_tags, non_chakra_library_import
mixed      | pages/settings/users/CreateUser.jsx | reasons: raw_html_tags
mixed      | pages/settings/users/EditUser.jsx | reasons: raw_html_tags
mixed      | pages/settings/users/UserList.jsx | reasons: raw_html_tags
mixed      | pages/settings/usersGroup/CreateUserGroup.jsx | reasons: raw_html_tags
mixed      | pages/settings/usersGroup/EditUserGroup.jsx | reasons: raw_html_tags
mixed      | pages/settings/usersGroup/UserGroupList.jsx | reasons: raw_html_tags
mixed      | routes/__audit__/index.jsx | reasons: raw_html_tags
mixed      | views/notifications/NotificationsPage.js | reasons: raw_html_tags
mixed      | views/pages/page404/Page404.jsx | reasons: raw_html_tags
mixed      | views/proposals/AdminProposalView.js | reasons: raw_html_tags
```
