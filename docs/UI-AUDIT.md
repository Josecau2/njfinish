# UI Audit — Pages, Components, and Responsiveness (Sep 28, 2025)

This document inventories the current UI across key sections with a focus on desktop vs mobile behavior, state handling, and role-based visibility. It will grow incrementally until all areas are covered.

- Scope in this draft: Dashboard, Customers, Quotes/Proposals (list + create), Payments, Orders
- Next sections to add: Quotes/Proposals (edit flow), Settings (Manufacturers, Users/Groups, Locations, Taxes, Customization, Terms, Payment Config), Admin (Contractors, Leads, Notifications), Resources, Contact, Calendar

## Conventions
- Desktop vs Mobile: The app often renders separate DOM trees guarded by `.u-desktop` and `.u-mobile` utility classes.
- Sticky columns: First table column often uses `sticky-col` styling for date columns.
- Action density: Buttons ensure min-height ~44px for accessible touch targets.
- Role differences: Admin vs Contractor views differ for some cells, actions, and navigation entries.

---

## Dashboard

### Route and Navigation
- Route: `/dashboard` (default landing after login for non-contractors)
- Contractors: dashboard replaced by `ContractorDashboard` component

### Header
- PageHeader with title and two actions (right side):
  - Create new proposal (primary)
  - Create quick proposal (success)
- Mobile: header actions wrap; buttons maintain min-height 44px

### Content — Cards and Lists
- Stats row (3 cards)
  1) Active Proposals — big number with spinner fallback
  2) Active Orders — big number with spinner fallback
  3) Latest Product Updates — list group of updates (empty state text when none)
- Content row (3 cards)
  - Quick Links — list of external/internal/document/help links with per-item icon; opens in new tab
  - Recent Files — list of files with type icon, name, size, date
  - My Latest Proposals — list of up to 5 with status badge; View All Proposals button below

### Loading/Empty States
- Active metrics animate from 0 to target; spinner shown until data arrives
- Latest Product Updates shows centered muted empty text when list is empty

### Responsiveness
- Scoped styles for mobile: header actions wrap to full width; smaller stat number font on narrow screens
- Touch targets: `.btn` min-height 44px; `.btn-sm` min-height 40px

### Role/Conditional Behavior
- Contractors see `ContractorDashboard` instead of this admin/staff dashboard
- Latest Proposals tailored to current user

---

## Customers

### Routes and Navigation
- Routes
  - `/customers` → Customers list
  - `/customers/add` → Add customer form
  - `/customers/edit/:id` → Edit customer form (navigated with obfuscated path using noise + encoded id)
- Sidebar: Customers visible per permissions; create action gated by `customers:create`

### Customers List (`/customers`)
- Header
  - PageHeader with title/subtitle/icon (Users icon)
  - Right slot: “Add Customer” button wrapped with `PermissionGate(permission="customers:create")`
- Stats row (4 small cards)
  1) Total customers (text-primary)
  2) Active (not deleted) count (text-success)
  3) With Email count (text-warning)
  4) Filtered count (text-danger)
- Filters card
  - Search input with icon; filters by name/email (case-insensitive)
  - Items-per-page select: 5, 10, 25, 50
  - Count summary text (shows contractor group name when scoped)
- Desktop Table (8 columns)
  1) Location badge (Main)
  2) Name (sortable)
  3) Email (sortable)
  4) Phone (mobile/home fallback)
  5) Address (formatted from address, apt/suite, city, state, zip)
  6) Proposals count pill
  7) Orders count pill
  8) Actions (center): Edit and Delete buttons wrapped in `PermissionGate` with resource=item
- Mobile Cards
  - Top: name + “Main” badge
  - Contact info rows: email, phone, address with icons
  - Stats pills: proposals count, orders count
  - Actions: Edit and Delete buttons (permission-gated)
- Loading/Empty/Error
  - Loading: centered spinner + helper text
  - Empty: magnifier icon + “no results / try adjusting” helper
  - Error: danger alert with message
- Pagination
  - `PaginationComponent` shown when totalPages > 1; keeps itemsPerPage state

### Customers Form (`/customers/add`, `/customers/edit/:id`)
- Header
  - Title switches between Add and Edit; contractor group name shown when scoped
  - Right: “Back to Customers” light button with left arrow
- Validation
  - Required: Full Name
  - Phone requirement: at least one of Mobile or Home Phone
  - Email format validated when present
- Fields (grouped)
  - Identity: Full Name*, Email
  - Phones: Mobile, Home Phone (one required)
  - Address: Address, Apt/Suite, City, State, ZipCode
  - Business: Company Name, Customer Type (select: Residential, Commercial, Contractor, Sub Contractor)
  - Lead: Lead Source (select: Website, Referral, Google, Facebook, Phone Call, Walk-in, Other)
  - Defaults/Notes: Default Discount (0–100), Notes (textarea)
- Actions
  - Cancel (light)
  - Create/Update (primary) with spinner while saving
- Error banner: danger alert on top of form body when store.error set
- Responsiveness: buttons enforce min-height 44px

### Role/Conditional Behavior
- Contractor scope: list filtered by `contractorGroupId`; group name displayed in filter card; create/edit available based on permissions
- PermissionGate wraps per-row actions; destructive Delete confirmed via SweetAlert

---

## Quotes / Proposals

### Routes and Navigation
- Routes
  - `/quotes` → Proposals list
  - `/quotes/create` → Create proposal (supports quick mode with `?quick=yes`)
  - `/quotes/edit/:id` → Edit proposal (not covered here; see Next Steps)
- Sidebar: Quotes visible per permissions; contractors see scoped data

### Proposals List (`/quotes`)
- Header
  - PageHeader with title/subtitle/icon (Briefcase)
  - Right actions (permission `proposals:create`): New and Quick buttons
- Tabs (desktop segmented control, mobile chips)
  - Standard: All, draft, sent, accepted, rejected, expired
  - Legacy: Draft, Measurement Scheduled, Measurement done, Design done, Follow up 1/2/3, Proposal accepted/rejected
  - Counts displayed per tab; unused legacy tabs hidden (count 0)
- Filters/Search
  - Desktop: search input; “showing count of total” helper
  - Mobile: sticky toolbar with tab chips and search
- Desktop Table (6–7 columns)
  1) Date (sticky)
  2) Quote #
  3) Customer (clickable to edit customer)
  4) Description (muted)
  5) Designer (visible only when `canAssignDesigner`)
  6) Status pill (standard + legacy mapping)
  7) Actions: status-specific actions + Edit + Delete (admin or when not locked)
    - Status actions (vary by status):
      - draft: Send, Share
      - sent: Accept, Reject, Share
      - rejected/expired: Resend, Share
    - Contractors: internal-only actions filtered out (no Send/Share)
- Mobile Cards
  - Header: customer + status pill; meta: date, Quote #, designer (if visible), manufacturer (optional)
  - Description clamped to 2 lines
  - Actions: Send (if not locked), Edit, overflow menu with Delete and Share
  - Bottom sticky bar: Quick and New buttons (permission-gated)
- Pagination
  - `PaginationComponent` with itemsPerPage=10; applies to desktop table; mobile has Load More button for incremental list
- Empty/Loading/Error
  - Empty: icon + two-line helper
  - Error surfaced through SweetAlert on failed actions

### Role/Conditional Behavior
- Contractors: list automatically filtered by contractor group; cannot trigger Send/Share; acceptance flow ultimately navigates to My Orders
- Admins: can delete any quote (admin route used in backend); can see Designer column; can create share links
- All tab hides accepted/locked by default so accepted quotes “disappear” from active worklist

### Create Proposal (`/quotes/create`)
- Modes
  - Standard: step 1 starts at Customer Info
  - Quick: `?quick=yes` starts at step 2 (Manufacturer)
- Header
  - PageHeader shows current step title + step-of badge (current/4)
  - Right actions (only on step 4): Print (all users); Email and Contract (non-contractors only)
- Progress Bar
  - 4 equal steps with active progress line and step numbers (1–4)
- Steps (high-level)
  1) Customer Info — customer selection/details; Next/Back
  2) Manufacturer Select — manufacturer + options; Next/Back
  3) Design Upload — upload/import design and select style; Next/Back; shows spinner while fetching manufacturer details
  4) Proposal Summary — items grid/table, modifications, totals; primary actions via top-right buttons and send/save to backend
- Sticky Mobile Actions (steps 1–3)
  - Bottom bar with Back and Next buttons (min-height enforced)
- Modals
  - PrintProposalModal, EmailProposalModal, EmailContractModal
- Guards/Behavior
  - Unsaved changes guard: beforeunload + popstate confirm
  - Manufacturer fetch optimized (no catalog)

### Responsiveness
- Buttons min-height 44px; sticky bottom bar for primary navigation on small screens
- Progress bar and header adapt gracefully; action buttons wrap as needed

### Role/Conditional Behavior
- Contractors: email/contract actions hidden on step 4; create restricted by permissions
- Non-contractors: full action set; may see designer-related fields later in edit flow

---

### Edit Proposal (`/quotes/edit/:id`)

- Header
  - PageHeader with title “Edit Quote” and right-side action buttons: Print (all), Email and Contract (non-contractors only)
  - Badges: shows “Accepted/Locked” and/or “Locked” when status is accepted or is_locked=true; accepted+non-admin renders view-only

- Form (top section)
  - Designer select (CreatableSelect) visible and required only when user has admin:users permission
  - Description input (required)
  - Status select (CreatableSelect) with options: Draft, Follow up 1/2/3, Measurement Scheduled/Done, Design done, Proposal done/accepted/rejected
  - Dates: Date, Design Date, Measurement Date via DatePicker; follow-up dates present in code as commented-out legacy

- Versions bar
  - Horizontal badge list for manufacturer versions; shows versionName and costMultiplier summary; hidden for contractors
  - Per-version dropdown actions (admins/staff): Edit name, Delete, Duplicate; guarded for contractors (no-op)
  - Edit/Delete confirm modals with CoreUI CModal; duplicate copies version object with “Copy of …” name

- Tabs
  - Single tab “Items” renders ItemSelectionContentEdit with readOnly inferred from is_locked or accepted (unless admin)

- ItemSelectionContentEdit highlights
  - Pricing readiness gates: waits for user group multiplier, manufacturer multiplier, taxes, and catalog preload
  - Current style card (manufacturer name, style name, assembled switch). Assembled toggle updates includeAssemblyFee/isRowAssembled per row and totals
  - Other styles carousel with responsive items-per-page; selecting a new style remaps existing items; unavailable items marked red with $0 and preserved
  - Items grid/table (CatalogTableEdit downstream):
    - Row fields: qty, hingeSide, exposedSide, includeAssemblyFee toggle, unit price, assembly fee, total; per-row modifications with attachments
    - Duplicate items handled per row index so hinge/exposed changes don’t leak to siblings
    - Modifications: opens ModificationBrowserModal; supports existing and custom modifications; persists to formData.manufacturersData and selectedVersion items
  - Custom items: add/delete with taxable forced true for non-admins; amounts participate in totals
  - Summary calculation:
    - Uses snapshot-style summary: cabinets (items+custom), assemblyFee (respects per-row includeAssemblyFee), modificationsCost, deliveryFee, discount, tax, grandTotal
    - Applies user group and manufacturer multipliers idempotently; showroom multiplier support and fallbacks preserved for comparisons
  - Data fetching: taxes list, user multiplier (/api/user/multiplier), manufacturer styles-meta (/api/manufacturers/:id/styles-meta), catalog items for selected style (preloaded with includeDetails), styleswithcatalog for browse

- Actions footer
  - View-only banner when locked/accepted for non-admins
  - Otherwise: Save, Accept and Order, Reject and Archive
    - Accept runs validateProposalSubTypeRequirements on current selectedVersion items; blocks and shows missing requirements via SweetAlert
    - Backend interaction via sendFormDataToBackend with action: update/accept/reject; handles 400 validation with missingRequirements, 403 locked states, and generic errors
    - On success, toast and navigate back to /quotes

- Modals (top-level)
  - PrintProposalModal: Preview/Print/Download configurable columns; version selection available for non-contractors; responsive modal sizing
  - EmailProposalModal: Send proposal PDF; form with email/body, keep-a-copy, update customer email; uses /api/proposals/send-email
  - EmailContractModal: Placeholder informing to configure contracts in settings

- Responsiveness
  - Buttons in header/footer enforce 44px min-height
  - Versions badges are horizontally scrollable on mobile
  - Sticky bottom action bar on small screens with primary actions

- Role/Conditional Behavior
  - Contractors: cannot see versions bar or version actions; Email/Contract buttons hidden; edit/delete/duplicate version actions disabled; read-only if accepted/locked
  - Admins: can assign designer, can change style, edit version names, delete/duplicate versions, and accept/reject even after changes

---

## Payments

### Routes and Navigation
- Routes
  - `/payments` → PaymentsList
  - `/payments/:id` → PaymentPage
  - `/payments/:id/pay` → PaymentPage (explicit pay mode)
  - `/payments/success` → PaymentSuccess
  - `/payments/cancel` → PaymentCancel
  - `/settings/payment-config` → PaymentConfiguration (admin)
  - `/payments/test` → PaymentTest
- Sidebar
  - "Payments" nav item appears for users with `proposals:read`

### PaymentsList (`/payments`)
- Headers
  - PageHeader with title/subtitle/icon
  - Optional error CAlert banner
- Filters
  - Status Tabs (6): all, pending, processing, completed, failed, cancelled
    - Active tab highlighted; responsive grid (auto-fit; 3 columns <=576px; 2 columns <=480px)
- Toolbar
  - Search: by customer, contractor, transactionId
  - Right: count text; "Create Payment" button (admin only)
- Desktop Table (7 columns)
  1) Date (sticky)
  2) Customer (admin: contractor bold + customer; contractor: customer only)
  3) Order # (from order model, snapshot.info.orderNumber, or `#id` fallback)
  4) Amount + Gateway badge (Stripe/Manual)
  5) Status badge (Completed/Processing/Pending/Failed/Cancelled) + optional paid date
  6) Transaction ID (muted)
  7) Actions: Make Payment (stripe+pending), Apply (admin+manual+!completed) → SweetAlert with method selection and optional Check Number
- Mobile Cards (per payment)
  - Head: Customer + Status badge
  - Meta: Date; Amount + Gateway badge; Order #
  - Body: Transaction ID (optional)
  - Actions: Make Payment when applicable
- Empty/Loading
  - Desktop row placeholders and empty state with icon and helper text
- Pagination
  - Shows when list non-empty; bound to paymentsSlice.pagination

### PaymentPage (`/payments/:id` and `/payments/:id/pay`)
- Headers
  - PageHeader with title/subtitle/icon
- Unavailable state
  - When Stripe disabled: warning + Go Back
- Payment status messages
  - processing: info banner
  - completed: success banner (+ View Payments button)
  - failed: danger banner (+ Retry Payment)
- Errors
  - Intent initialization error alert with retry
- Receipt
  - Success alert with link when `receipt_url` present
- Main Card
  - Header: Payment Details + Order #; Right: Amount + currency
  - Body:
    - Spinner during intent init
    - Stripe PaymentElement (tabs layout) and Submit (Confirm Payment) button
    - Unavailable warning fallback
    - Action row: View Payments (on completed), Go Back
- Behavior
  - Uses `confirmPayment` with `return_url` → `/payments/success?paymentId=...`
  - Polling for status post-confirmation; SweetAlert dialogs for outcomes

### PaymentSuccess (`/payments/success`)
- Header: success
- Card: success icon, title, subtitle, optional Transaction ID alert; Actions → All Payments, Go Back

### PaymentCancel (`/payments/cancel`)
- Header: cancellation
- Card: title + friendly error; Actions → All Payments, Go Back

### PaymentConfiguration (`/settings/payment-config`)
- Header: Payment Configuration
- Error banner (dismissible)
- Settings Card
  - Top actions: Cancel (pristine-aware), Save Changes (spinner)
  - Fields
    - Provider select (Stripe | Custom)
    - Supported currencies (CSV input)
    - Stripe section (under Enable card payments switch):
      - Publishable key input
      - Secret key + Webhook secret radio groups: Keep/Replace/Clear with conditional password input
      - Security info alert
    - Custom provider fields (when not Stripe): Gateway URL (required), Embed Code (textarea)
    - Advanced Settings (JSON) textarea with validation
- Preview Card
  - Provider, currencies, Stripe publishable key text, card payments enabled flag, custom gateway url, and embed configured note

### PaymentTest (`/payments/test`)
- Header: Test Configuration
- Card: info alert, Transaction ID field, buttons to dispatch `paymentSuccess`/`paymentError` events and Go Back

---

## Orders

### Routes and Navigation
- Routes
  - `/orders` → AdminOrders → OrdersList (all orders; admin/standard)
  - `/my-orders` → MyOrders → OrdersList (mineOnly; contractors)
  - `/orders/:id` → OrderDetails (admin route)
  - `/my-orders/:id` → OrderDetails (contractor route)
- Sidebar
  - Contractors: single link to "My Orders"
  - Admin/standard: "Orders" group with "Orders" and "My Orders"

### OrdersList (both contexts)
- Header: PageHeader with context title/subtitle
- Toolbar
  - Search by customer name
  - Count text
- Desktop Table (8 columns)
  1) Date (sticky)
  2) Order #
  3) Customer (admin: contractor + end-customer; contractor: end-customer)
  4) Description (muted)
  5) Manufacturer (resolved from snapshot or store caches)
  6) Status badge (accepted/sent/draft)
  7) Payment status badge: Paid / Payment Required / Processing / Failed (+ paid date)
  8) Actions:
     - Make Payment (visible when payment required)
     - Download Invoice (visible when paid; opens PrintPaymentReceiptModal)
- Mobile Cards
  - Head: Title shows contractor+customer (admin) or customer (contractor); right column shows order status + payment status badges
  - Meta: Date, Manufacturer, Order #
  - Body: Description (muted)
  - Actions: Make Payment and Download Invoice (if applicable)
- Modals
  - PrintPaymentReceiptModal for paid orders
- Data fetching
  - Fetches orders (mineOnly flag) and payments; pre-warms manufacturers list/cache

### OrderDetails
- Header
  - Title: "Order Details — <display order number>"
  - Subtitle: Customer name when present; fallback overview text
  - Right Actions (admin only): View PDF, Download PDF, Resend Email, Delete Order; universal Back button
- Manufacturer Details (if available)
  - Style image (click to preview), Manufacturer name (robust resolution), Style name (guarded against mis-labeled manufacturer names)
- Summary Cards (3)
  - Order: Order #, ID, Date, Status, Accepted at
  - Customer: Name, Email, Phone, Address
  - Totals: Styles Subtotal, Assembly Fee, Modifications, Delivery Fee, Discount, Tax, Grand Total
- Items
  - Desktop table (8 columns): Item (name + modifications + attachments gallery), Specs thumbnail (clickable), Hinge Side, Exposed Side, Qty, Unit Price, Modifications, Total
  - Mobile list: compact item cards with thumbnail, mod summary, side badges, and totals
- Manufacturers breakdown
  - Grid of cards (per manufacturer) with style image and per-manufacturer totals
- Modals
  - Manufacturer PDF Viewer (object/iframe)
  - Image Preview
  - Notice modal (success/warning/error)
- Data rules
  - Snapshot-first parsing; display order number priority: model field > snapshot.info.orderNumber > `#id`

---

## Responsive Patterns Summary
- Separate desktop/mobile render trees: `.u-desktop` (tables) vs `.u-mobile` (cards)
- Sticky first column (`sticky-col`) used for date columns in list tables
- Payment tabs auto-fit grid with breakpoints
- Buttons and inputs target min-height ~44px
- Mobile cards surface the most important info and trim peripheral data

---

## Role-based/Conditional Visibility
- PaymentsList: Create Payment and Apply actions restricted to admins; customer cell rendering varies by role
- OrdersList: Payment action/buttons based on payment state; different customer rendering by role
- OrderDetails: PDF/Resend/Delete actions restricted to admins
- Sidebar: Orders group vs My Orders depends on role; Payments visible to proposals:read

---

## Settings

### Routes and Navigation
- Top-level: Settings is visible to admin/staff roles per permissions; most pages are admin-only
- Routes covered here:
  - Manufacturers: `/settings/manufacturers`, `/settings/manufacturers/create`, `/settings/manufacturers/edit/:id` (noisy obfuscated path for edit)
  - Users: `/settings/users`, `/settings/users/create`, `/settings/users/edit/:id` (noisy edit)
  - User Groups: `/settings/users/groups`, `/settings/users/group/create`, `/settings/users/group/edit/:id` (noisy edit)
  - Locations: `/settings/locations`, `/settings/locations/create`, `/settings/locations/edit/:id` (noisy edit)
  - Multipliers: `/settings/multipliers` (manu/user-group multipliers UI)
  - Payment Config: `/settings/payment-config` (covered in Payments section)

### Manufacturers
- List (`/settings/manufacturers`)
  - Desktop: searchable/sortable list with enable/disable switch per manufacturer; edit action navigates via noisy obfuscated path
  - Mobile: card layout with same switches and edit button
  - Data: Redux slice provides list; toggling calls `updateManufacturerStatus`
  - Empty/loading/error states: alerts/spinners shown appropriately
- Create (`/settings/manufacturers/create`)
  - Fields: Name (required), Pricing type toggle (MSRP vs Cost), Cost Multiplier, ETA fields, Logo upload, Catalog file upload
  - Validation: name required; file inputs validated by type/size client-side
  - Actions: Cancel (back to list), Create (spinner on submit); success redirects to list
  - Permissions: admin-only
- Edit (`/settings/manufacturers/edit/:id`)
  - Layout: tabbed editor
    - Tabs: Details, Settings, Catalog Mapping, Style Pictures, Types, Files History
  - Behavior: initial fetch avoids heavy catalog payload (`includeCatalog=false`); subsequent tabs fetch as needed
  - Actions: Save per-tab; back to list via header/back controls
  - Permissions: admin-only

### Users
- List (`/settings/users`)
  - Desktop table + mobile cards; search, pagination, and count chips
  - Actions: Edit, Delete; Add User and Add Group buttons in header
  - Role notes: admin/staff access only
- Create (`/settings/users/create`)
  - Sections: Account (email, password), Group select, Location select, Sales rep toggle, Personal address, Company address
  - Validation: email format, password rules, required group/location
  - Special flow: when email belongs to a soft-deleted user, SweetAlert offers “restore”
  - Actions: Cancel (dirty-check + confirm), Create (spinner)
- Edit (`/settings/users/edit/:id`)
  - Prefills data; optional password change; same required Group/Location
  - Actions: Cancel (dirty-check), Update (spinner)

### User Groups
- List (`/settings/users/groups`)
  - Desktop table columns: Name, Type badge (standard/contractor), Module toggles (Dashboard, Proposals, Customers, Resources), Actions (Edit)
  - Mobile cards: name + type badge; four module toggles; edit button
  - Toggles: enabled only for groups where `group_type==='contractor'`; disabled for standard groups
  - Data: uses normalized `allGroups` from `usersGroup` slice; fetch via `fetchUsers()`; update via `updateUser({ id, data: { modules } })`
  - Loading/error: centered spinner; error alert with message
- Create (`/settings/users/group/create`)
  - Fields: Name (required), Group Type (standard | contractor); when contractor, show Module Permissions block with four switches
  - UX: PageHeader with Back; sections with icons; min-height 44px on buttons; warnings/info cards
  - Validation: name required
  - Submit: dispatches `addUser`; SweetAlert feedback; redirects to groups list on success
  - Cancel: if dirty, SweetAlert confirm before navigating away
- Edit (`/settings/users/group/edit/:id`)
  - Fetch: loads group by id via `/api/usersgroups/:id`; pre-fills name, type, modules
  - Fields/Validation: same as create; module permissions visible only for contractor type
  - Submit: PUT to `/api/usersgroups/:id`; success SweetAlert then navigate to list
  - Cancel: dirty-check with SweetAlert

### Locations
- List (`/settings/locations`)
  - Header: PageHeader with icon and “Add Location” button
  - Search: by email or location name; stats chip shows total; helper shows filtered count
  - Desktop Table (responsive scroll on mobile):
    1) Index (#)
    2) Location Name
    3) Address
    4) Email (mailto link)
    5) Website (http/https normalized; opens new tab)
    6) Actions: Edit (noisy path), Delete (SweetAlert confirm)
  - Pagination: items-per-page select (5,10,15,20,25); showing-range helper; arrow controls
  - Data: Redux `locations` slice; `fetchLocations`, `deleteLocation`
  - States: loading spinner card; error alert card; empty state with icon and text
- Create (`/settings/locations/create`)
  - Fields: Location Name*, Address*, Website*, Email* (format validated), Phone*, Country*, Timezone*
  - Country/Timezone: lists from `countries-and-timezones`; timezone list is derived from selected country; auto-selects the first timezone; live “Current Time” field updates every second for the chosen timezone
  - Actions: Cancel (dirty-check + SweetAlert), Save (dispatch `addLocation` → success SweetAlert → redirect)
  - Accessibility: buttons min-height ~44px; labeled inputs; input groups with icons
- Edit (`/settings/locations/edit/:id`)
  - Fetch: `fetchLocationById(id)`; prefill then live “Current Time” for selected timezone
  - Fields/validation: same as create
  - Submit: `updateLocation({ id, data })` → success SweetAlert → redirect to list
  - Cancel: dirty-check with SweetAlert

### Multipliers
- Page (`/settings/multipliers`)
  - Purpose: manage user-group × manufacturer multipliers
  - Layout: table of user groups (excludes Admin group id=2) with per-group multiplier controls; edit via modal dialog
  - Data: integrates `manufacturersMultiplierSlice` and `userGroupSlice`; merges group data to show effective multipliers
  - Pagination: standard table pagination
  - Role: admin-only

### Settings — Role and Permission Notes
- Settings menu visibility is permission-gated; most pages are admin-only
- User Group module toggles are only active for contractor-type groups; standard groups have fixed module access
- Manufacturers, Multipliers, and Payment Config changes should be restricted to admin roles

---

## Next Steps (Planned)
- Extend audit to:
  - Settings (Taxes, Customization, Terms)
  - Admin (Contractors, Contractor Detail, Leads, Notifications)
  - Resources, Contact, Calendar
- Add per-page control counts (buttons, inputs, menus, modals) and explicit role-based condition notes.
