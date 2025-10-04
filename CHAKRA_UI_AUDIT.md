# Chakra UI Purity Audit

## Snapshot
- 260 React files analysed across `frontend/src`
- 85 files render exclusively with Chakra primitives (no raw tags or inline styles)
- 58 files mix Chakra with raw HTML, inline styles, or CSS classes
- 2 helper modules (`frontend/src/helpers/proposalPdfBuilder.js:199`, `frontend/src/helpers/pdfTemplateGenerator.js:369`) output handcrafted HTML for PDFs and are outside Chakra scope
- Remaining files are logic/helpers without rendered markup

## Global Non-Chakra Dependencies
- `sweetalert2` is still imported in 16 screens (e.g. `frontend/src/pages/settings/locations/CreateLocation.jsx:6`, `frontend/src/pages/proposals/Proposals.jsx:15`, `frontend/src/pages/orders/OrdersList.jsx:39`) and its stylesheet is registered globally in `frontend/src/index.jsx:12`; migrate these confirmations/toasts to Chakra `AlertDialog`, `Modal`, or `useToast`
- `simplebar-react` powers sidebar scrolling in `frontend/src/components/AppSidebarNav.js:5` with inline styles at `frontend/src/components/AppSidebarNav.js:515`; Chakra's `Box` + `overflowY` with `useScrollbarWidth` or `chakra(SimpleBar)` can replace it
- `yet-another-react-lightbox` provides the file preview overlay (`frontend/src/components/FileViewerModal.jsx:19`); consider a Chakra `Modal` + `Image`/`Video` stack with `react-use-gesture` if advanced zoom is required
- `react-lazy-load-image-component` is used for media cards (`frontend/src/components/AppSidebar.js:15`, `frontend/src/pages/proposals/CreateProposal/DesignUpload.jsx:23`); Chakra `Image` with `loading="lazy"` and skeleton states can cover the same behaviour
- Legacy SCSS for SimpleBar remains in `frontend/src/scss/vendors/simplebar.scss:1`; delete once scrolling moves to Chakra primitives

## High-Priority Component Refactors
- **Pagination stack** — `frontend/src/components/common/PaginationComponent.jsx:194` and `frontend/src/components/PaginationControls.js:31` render `<div>`/`<button>` elements with large inline style objects; rebuild with `Flex`, `Button`, and `IconButton`, lifting stateful hover styles into Chakra props so all pagination controls inherit the theme
- **Catalog mapping workspace** — `frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx:2850` onwards contains extensive inline styles (`style={{ maxHeight: '400px' }}`, manual borders, native checkboxes); replace wrappers with `Stack`, `Table`, `Checkbox`, `Accordion`, and Chakra `FormControl` to remove imperative styling and achieve theme parity
- **Global mods admin** — `frontend/src/pages/settings/globalMods/GlobalModsPage.jsx:614` mixes Chakra components with styled `<div>`/`<img>` nodes for gallery management; consolidate layout with `SimpleGrid`, `Card`, and Chakra `Image` while moving spacing rules into props
- **Data tables** — `frontend/src/components/DataTable/DataTable.jsx:30` still injects colours via `style={{ backgroundColor: headerBg }}`; convert to Chakra props (`bg`, `color`, `borderColor`) so theming works automatically
- **Contract viewer** — `frontend/src/pages/contracts/index.jsx:722` injects HTML via `dangerouslySetInnerHTML`; ensure the upstream HTML is Chakra-generated or provide Chakra-rendered templates instead of raw strings

## Forms Still Using Raw HTML Wrappers
- Customer onboarding form keeps a native `<form>` and inline overrides at `frontend/src/pages/customers/AddCustomerForm.jsx:77` and `frontend/src/pages/customers/AddCustomerForm.jsx:362`; swap to `chakra.form` or `Box` with `as="form"` and migrate the gradient/outline styles into Chakra props
- Location create/edit flows use `<form>` and SweetAlert (`frontend/src/pages/settings/locations/CreateLocation.jsx:226`, `frontend/src/pages/settings/locations/EditLocation.jsx:198`), plus button styling via `style={{ border: '1px solid ...' }}` at `frontend/src/pages/settings/locations/CreateLocation.jsx:211`; rely on Chakra `Button` variants and `AlertDialog` for confirmations
- Manufacturer creation uses a plain `<form>` in `frontend/src/pages/settings/manufacturers/ManufacturersForm.jsx:482`; replace with `chakra.form` and convert informational callouts (e.g. inline info rows) to `Alert`/`FormHelperText`

## Authentication Layout
- Auth pages still rely on scoped CSS classes (`frontend/src/pages/auth/LoginPage.jsx:11`, `frontend/src/pages/auth/ForgotPasswordPage.jsx:11`, `frontend/src/pages/auth/RequestAccessPage.jsx:11`); migrate these wrappers to Chakra `Flex`, remove `className`, and move layout styles into design tokens so dark mode behaves correctly

## Modal Review
- Chakra `Modal` is consistently used in shared wrappers (`frontend/src/components/NeutralModal.jsx:18`, `frontend/src/components/TermsModal.jsx:8`)
- SweetAlert2 remains the only non-Chakra modal/toast system; replacing those imports removes the last third-party modal UI

## Server-Rendered PDFs
- PDF builders (`frontend/src/helpers/proposalPdfBuilder.js:199`, `frontend/src/helpers/pdfTemplateGenerator.js:369`) compose raw HTML strings for document generation; they can remain outside Chakra but should be annotated to avoid confusion with client components during migration

## Suggested Migration Sequence
1. Remove `sweetalert2` (replace imports with Chakra `AlertDialog`/`useToast` and delete the CSS include)
2. Rebuild pagination controls and shared table wrappers to guarantee Chakra-only primitives for lists/tables
3. Refactor heavy admin workspaces (Catalog Mapping, Global Mods) to Chakra stacks and remove inline style objects
4. Update remaining forms to use `chakra.form` wrappers and Chakra-driven button styling
5. Replace residual third-party UI helpers (`SimpleBar`, `Lightbox`, lazy image component) with Chakra patterns and remove vendor styles
6. Run automated linting to catch any leftover `className`, `style={{` or raw tag usage and enforce via ESLint rule (e.g. `react/no-danger`, custom JSX pragma)
