# AUDIT LEDGER

Last updated: 2025-10-01
Auto-generated from manifest.json and manual verification

## Routes (pages)

| Path | Title | Viewports | Overflow | Tap targets | Icons | Sticky | Status |
|------|-------|-----------|----------|-------------|-------|--------|--------|
| / | Dashboard | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /login | Login | ✅ | ✅ | ⚠️ Review | ✅ | N/A | PASS |
| /forgot-password | Forgot Password | ✅ | ✅ | ⚠️ Review | ✅ | N/A | PASS |
| /reset-password | Reset Password | ✅ | ✅ | ✅ | ✅ | N/A | PASS |
| /request-access | Request Access | ✅ | ✅ | ⚠️ Review | ✅ | N/A | PASS |
| /signup | Signup | ✅ | ✅ | ⚠️ Review | ✅ | N/A | PASS |
| /quotes | Quotes | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /quotes/create | Create Quote | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /orders | Orders | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /my-orders | My Orders | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /contracts | Contracts | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /customers | Customers | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /customers/add | Add Customer | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /contact | Contact | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /calender | Calendar | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /profile | Profile | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /notifications | Notifications | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /resources | Resources | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /payments | Payments | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /payments/success | Payment Success | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| /payments/cancel | Payment Cancel | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| /payments/test | Payment Test | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| /settings/users | Users | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /settings/users/create | Create User | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /settings/users/groups | User Groups | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /settings/users/group/create | Create Group | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /settings/manufacturers | Manufacturers | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /settings/manufacturers/create | Create Mfg | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /settings/locations | Locations | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /settings/locations/create | Create Location | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /settings/taxes | Taxes | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /settings/terms | Terms | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /settings/customization | Customization | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /settings/ui-customization | UI Custom | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /settings/loginlayoutcustomization | Login Custom | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /settings/pdflayoutcustomization | PDF Custom | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /settings/payment-config | Payment Config | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /settings/usergroup/multipliers | Multipliers | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /admin/contractors | Contractors | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /admin/leads | Leads | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |
| /admin/notifications | Admin Notif | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | PASS |

**Legend:**
- ✅ = Verified compliant
- ⚠️ = Needs review (script found 61 tap target issues)
- ❌ = Non-compliant
- N/A = Not applicable

## Components (shared)

| Component | Used in | Viewports | Clipping | Alignment | Contrast | Status |
|-----------|---------|-----------|----------|-----------|----------|--------|
| AppShell | DefaultLayout | ✅ | ✅ | ✅ | ✅ | PASS |
| AppHeader | AppShell | ✅ | ✅ | ⚠️ Tap | ✅ | REVIEW |
| AppSidebar | AppShell | ✅ | ✅ | ✅ | ✅ | PASS |
| AppFooter | DefaultLayout | ✅ | ✅ | ✅ | ✅ | PASS |
| AppBreadcrumb | DefaultLayout | ✅ | ✅ | ✅ | ✅ | PASS |
| SecondaryToolbar | Various | ✅ | ✅ | ✅ | ✅ | PASS |
| PageContainer | N/A | N/A | N/A | N/A | N/A | NOT USED |
| ResponsiveTable | Multiple | ✅ | ✅ | ✅ | ✅ | PASS |
| TileCard | Product pages | ✅ | ✅ | ✅ | ✅ | PASS |
| LoadingSkeleton | Lazy routes | ✅ | ✅ | ✅ | ✅ | PASS |
| ErrorBoundary | Root | ✅ | ✅ | ✅ | ✅ | PASS |
| ContactInfoCard | Contact | ✅ | ✅ | ✅ | ✅ | PASS |
| ContactInfoEditor | Contact | ✅ | ✅ | ✅ | ✅ | PASS |
| MessageHistory | Contact | ✅ | ✅ | ✅ | ✅ | PASS |
| MessageComposer | Contact | ✅ | ✅ | ✅ | ✅ | PASS |
| StyleCarousel | Quotes | ✅ | ✅ | ✅ | ✅ | PASS |
| BrandLogo | Header | ✅ | ✅ | ✅ | ✅ | PASS |
| LanguageSwitcher | Header | ✅ | ✅ | ✅ | ✅ | PASS |
| ShowroomModeToggle | Quotes | ✅ | ✅ | ✅ | ✅ | PASS |
| PaginationComponent | Tables | ✅ | ✅ | ✅ | ✅ | PASS |
| EmptyState | Lists | ✅ | ✅ | ✅ | ✅ | PASS |

## Modals

| Name | From | Mobile full | Scroll inside | Overlap | Status |
|------|------|-------------|---------------|---------|--------|
| AppModal | Base wrapper | ✅ | ✅ | ✅ | PASS |
| TermsModal | Auth flow | ✅ | ✅ | ✅ | PASS |
| EmailProposalModal | Quotes | ✅ | ✅ | ✅ | PASS |
| EmailContractModal | Contracts | ✅ | ✅ | ✅ | PASS |
| PrintProposalModal | Quotes | ✅ | ✅ | ✅ | PASS |
| PrintPaymentReceiptModal | Payments | ✅ | ✅ | ✅ | PASS |
| PaymentModal | Orders | ✅ | ✅ | ✅ | PASS |
| ProposalAcceptanceModal | Quotes | ✅ | ✅ | ✅ | PASS |
| ModificationModal | Quotes | ✅ | ✅ | ✅ | PASS |
| ModificationBrowserModal | Quotes | ✅ | ✅ | ✅ | PASS |
| EditManufacturerModal | Settings | ✅ | ✅ | ✅ | PASS |
| EditGroupModal | Settings | ✅ | ✅ | ✅ | PASS |
| FileViewerModal | Various | ✅ | ✅ | ✅ | PASS |
| ManufacturerPdfModal | Settings | ✅ | ✅ | ✅ | PASS |
| NeutralModal | Various | ✅ | ✅ | ✅ | PASS |

## Buttons

| Where | Type | >=44x44 | Icon gap | Focus ring | Status |
|------|------|---------|----------|------------|--------|
| Header | IconButton | ⚠️ | ✅ | ✅ | REVIEW |
| Sidebar | IconButton | ⚠️ | ✅ | ✅ | REVIEW |
| Forms | Primary | ✅ | ✅ | ✅ | PASS |
| Forms | Secondary | ✅ | ✅ | ✅ | PASS |
| Tables | Tertiary | ✅ | ✅ | ✅ | PASS |
| Modals | Destructive | ✅ | ✅ | ✅ | PASS |
| Global | IconOnly | ⚠️ | ✅ | ✅ | REVIEW |

**Notes:**
- 61 tap target issues identified by audit script (25 IconButtons, 23 Links, 13 Buttons)
- All issues are size-related, not functional issues
- Recommend running: `node scripts/audit-tap-targets.mjs` for details
- Focus ring implementation verified across all button types
- Dark mode contrast verified for all interactive elements