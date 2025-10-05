# Button-Triggered Modals - Deep Audit
**Date:** 2025-10-05
**Purpose:** Complete structural and logic audit of all 40 button-triggered lightbox modals
**Scope:** UI elements, nested components, business logic, data flow

---

## TABLE OF CONTENTS
1. [Proposal/Contract Actions (7 modals)](#1-proposalcontract-actions)
2. [Modification Modals (3 modals)](#2-modification-modals)
3. [Manufacturer/Settings Modals (3 modals)](#3-manufacturersettings-modals)
4. [Catalog Management Modals (16 modals)](#4-catalog-management-modals)
5. [Style Pictures Tab (2 modals)](#5-style-pictures-tab)
6. [Global Mods Page (1 modal)](#6-global-mods-page)
7. [Payments Page (3 modals)](#7-payments-page)
8. [Other Action Modals (5 modals)](#8-other-action-modals)

---

## 1. PROPOSAL/CONTRACT ACTIONS

### 1.1 Email Proposal Modal
**File:** `frontend/src/components/model/EmailProposalModal.jsx`
**Size:** `xl` | `isCentered` | `scrollBehavior="inside"`
**Lines:** 350

#### UI Components
- **Form Inputs:**
  - Email address (Input, type="email", required, validated)
  - Email body (Textarea, 6 rows, required)
- **Switches/Checkboxes:**
  - "Send me a copy" (Switch, colorScheme="brand", default: true)
  - "Update customer email" (Checkbox, default: false)
- **Buttons:**
  - Cancel (outline, gray, motion.create)
  - Send Email (primary with custom colors, motion.create, shows spinner when loading)

#### State Management
```javascript
- loading (boolean) - Send operation in progress
- pdfCustomization (object) - Fetched from /api/settings/customization/pdf
- styleData (object) - Fetched from /api/manufacturers/{id}/styles-meta
- manufacturerNameData (object) - Fetched from /api/manufacturers/{id}
```

#### Business Logic
1. **Initialization:**
   - On modal open: reset form with defaults from `formData.customerEmail` and `formData.emailBody`
   - Fetch PDF customization settings
   - Fetch style data and manufacturer name based on first manufacturer in proposal

2. **PDF Generation:**
   - Uses `buildProposalPdfHtml()` helper
   - Includes: selected catalog items, custom columns, style metadata
   - Converts line breaks in email body to `<br />` tags

3. **Email Sending:**
   - POST to `/api/proposals/send-email`
   - Payload: email, body (HTML formatted), sendCopy, updateCustomerEmail, htmlContent, subject, attachmentFilename
   - Subject: "Your Quote {proposal_number}" or "Your Proposal"
   - Filename: "Quote-{proposal_number}.pdf" or "Proposal.pdf"

4. **Validation:**
   - Email: required, must match regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
   - Body: required

#### Data Dependencies
- `formData.customerEmail` - prefills email field
- `formData.emailBody` - prefills body field
- `formData.proposal_number` - used in subject/filename
- `formData.manufacturersData[0]` - for style/manufacturer data
- `formData.selectedCatalog` - catalog items count display

#### Custom Styling
- Header: Uses `customization.headerBg` or fallback to `brand.500/400`
- Header text: Calculated contrast color via `getContrastColor()`
- Primary button: Uses `customization.primaryColor` or falls back to headerBg
- Primary button text: Calculated contrast color

**⚠️ DO NOT MODIFY:**
- PDF generation logic (`buildProposalPdfHtml`)
- Email HTML formatting (line break conversion)
- Fetch sequence (must load in order: pdfCustomization → styleData → manufacturerName)

---

### 1.2 Print Proposal Modal
**File:** `frontend/src/components/model/PrintProposalModal.jsx`
**Size:** `{ base: 'full', md: '4xl' }` | `isCentered` | `scrollBehavior="inside"`
**Lines:** 684
**NESTED MODAL:** Preview Modal (6xl)

#### UI Components
- **Visibility Switches** (3):
  1. Show Proposal Items (Switch, default: true)
  2. Show Group Items (Switch, default: true)
  3. Show Price Summary (Switch, default: true)

- **Version Selection** (if multiple versions):
  - CheckboxGroup with individual checkboxes for each version
  - "Select All" / "Clear" buttons
  - Grid layout: 1 column mobile, 2 columns desktop

- **Column Selection:**
  - CheckboxGroup with column options:
    - No (number)
    - Qty (FIXED - always selected)
    - Item
    - Assembled
    - Hinge Side
    - Exposed Side
    - Price (FIXED - always selected)
    - Assembly Cost
    - Total
  - "Select All" / "Clear" buttons
  - Grid layout: 1 column mobile, 2 columns desktop
  - Fixed columns (Qty, Price) cannot be unchecked

- **Action Buttons:**
  - Preview (outline, gray, Eye icon)
  - Print (outline, brand, Printer icon)
  - Download PDF (primary, brand, Download icon, shows spinner when loading)

#### Nested Modal: Preview
**Size:** `{ base: 'full', md: '6xl' }`
**Trigger:** Click "Preview" button

**Components:**
- Iframe (794px width, 1120px min height)
- Contains rendered proposal HTML
- Close button
- Download PDF button (same as main modal)

**Logic:**
- Renders live preview using `buildProposalPdfHtml()`
- Updates when switches/checkboxes change
- Uses `srcDoc` attribute for iframe content

#### State Management
```javascript
- pdfCustomization (object) - PDF layout settings
- styleData (object) - Style metadata
- manufacturerNameData (object) - Manufacturer info
- isLoading (boolean) - PDF download in progress
- showPreview (boolean) - Preview modal visibility
- previewHtml (string) - Generated HTML for preview
```

#### Business Logic
1. **PDF Generation:**
   - Uses `buildProposalPdfHtml()` with options:
     - selectedColumns: user-selected columns
     - showProposalItems, showPriceSummary: from switches
     - selectedVersions: checked version names
     - includeCatalog: always true

2. **Print Function:**
   - Opens popup window with generated HTML
   - Triggers `window.print()`
   - Fallback: creates hidden iframe if popup blocked

3. **Download Function:**
   - POST to `/api/generate-pdf` with:
     - html: generated content
     - options: { format: 'A4', margins: 20mm all sides }
   - Returns PDF blob
   - Creates download link with filename "quote.pdf"

4. **Preview Function:**
   - Renders HTML in iframe
   - Auto-refreshes when options change
   - Maintains scroll position

#### Data Dependencies
- `formData.manufacturersData` - for versions and style/manufacturer data
- All props needed for PDF generation (passed to `buildProposalPdfHtml`)

#### Responsive Behavior
- Mobile: Single column layouts, full-width buttons, full-screen preview
- Desktop: Multi-column layouts, inline buttons, 6xl preview modal

**⚠️ DO NOT MODIFY:**
- PDF generation options (format: A4, margins: 20mm)
- Fixed columns logic (Qty, Price always included)
- Print window/iframe fallback mechanism
- Preview iframe sizing (794px = A4 width in pixels)

---

### 1.3 Proposal Acceptance Modal
**File:** `frontend/src/components/ProposalAcceptanceModal.jsx`
**Size:** `{ base: 'full', md: 'md', lg: 'lg' }` | `scrollBehavior="inside"` | `closeOnOverlayClick={!isSubmitting}`
**Lines:** 225

#### UI Components
- **Checkbox:**
  - "Use external signer" (disabled if isContractor=true)

- **Conditional External Signer Fields** (shown when checkbox checked):
  - External Signer Name (Input, optional)
  - External Signer Email (Input, type="email", optional, placeholder: "email@example.com")

- **Alert:** Warning alert for form errors (shown conditionally)

- **Buttons:**
  - Cancel (ghost variant)
  - Confirm (brand colorScheme, shows loading state)

#### State Management
```javascript
- isSubmitting (boolean) - Mutation in progress
- formError (string) - Validation/submission errors
- form values via react-hook-form:
  - isExternalAcceptance (boolean, default: false)
  - externalSignerName (string, default: '')
  - externalSignerEmail (string, default: '')
```

#### Business Logic
1. **Validation:**
   - If external acceptance enabled:
     - At least one of name OR email must be provided
     - If email provided, must match `/\S+@\S+\.\S+/` regex
   - Proposal must have valid ID

2. **Submission:**
   - Uses `acceptProposalMutation` from `useAcceptProposal()` hook
   - Payload:
     - id: proposal.id (required)
     - externalSignerName: trimmed name (if provided)
     - externalSignerEmail: trimmed email (if provided)
   - Success: shows success toast, calls `onAcceptanceComplete(result)`, closes modal
   - Error: shows error toast, sets formError

3. **Manufacturer Email Handling:**
   - If `result.manufacturerEmailStatus === 'failed'`:
     - Shows warning toast with error details
     - Duration: 4000ms

4. **Close Behavior:**
   - Resets form to defaults
   - Clears form error
   - Disabled during submission (closeOnOverlayClick={false})

#### Motion/Animation
- Uses `motion.div` for overlay and content
- Respects `prefers-reduced-motion` user setting
- Animations: fade in/out, scale 0.95 ↔ 1.0
- Duration: 0.2s

#### Data Dependencies
- `proposal.id` - required for acceptance
- `isContractor` - disables external signer option

**⚠️ DO NOT MODIFY:**
- Validation logic (at least name OR email required)
- Acceptance mutation payload structure
- Email regex pattern
- Manufacturer email failure handling (warning toast)
- Form reset behavior on close

---

### 1.4 Email Contract Modal
**File:** `frontend/src/components/model/EmailContractModal.jsx`
**Size:** `lg` | `isCentered` | `scrollBehavior="inside"`
**Lines:** 49

#### UI Components
- **Text:** Static message (no contracts available)
- **Button:** Close button (outline, gray, 44px min height)

#### Business Logic
**STUB/PLACEHOLDER MODAL** - No actual functionality implemented
Message: "No contracts available for selection. Please go to contract settings to add one."

**⚠️ NOTE:** This modal appears to be a placeholder. Full implementation pending.

---

### 1.5 Print Payment Receipt Modal
**File:** `frontend/src/components/model/PrintPaymentReceiptModal.jsx`
**Size:** `{ base: 'full', lg: 'lg' }` | `isCentered` | `scrollBehavior="inside"`
**Lines:** 300

#### UI Components
- **PageHeader:**
  - Title: "Preview receipt details"
  - Subtitle: "Download a branded PDF receipt for this payment."

- **Alert:** Error alert (shown if generation fails)

- **Info Display Box** (gray background, bordered):
  - Payment Amount (formatted currency)
  - Order (ID or "N/A")
  - Status
  - Payment Method (if available)
  - Paid Date (if available)

- **Notice Text:** Footer description of what receipt includes

- **Buttons:**
  - Cancel (outline)
  - Download Receipt (brand, shows spinner when loading)

#### State Management
```javascript
- isLoading (boolean) - PDF generation in progress
- error (string|null) - Error message
```

#### Business Logic
1. **Receipt HTML Generation:**
   - Function: `generateReceiptHtml({ payment, order, customization, t })`
   - Uses brand colors: `customization.headerBg` with contrast text
   - Calculates receipt number:
     - From `payment.details.receiptNumber` if exists
     - Otherwise: `RCP{YYYYMMDD}{payment.id}`
   - Builds order number:
     - From `order.order_number` if exists
     - From `order.snapshot.info.orderNumber` if exists
     - Otherwise: `{CompanyInitials}{YYYYMMDD}{order.id}`

2. **Currency Formatting:**
   - Uses `Intl.NumberFormat` with USD currency
   - Format: "$1,234.56"

3. **Date Formatting:**
   - Long format: "January 15, 2025"
   - Fallback: "--" if no date

4. **PDF Download:**
   - POST to `/api/payments/receipt` with:
     - paymentId, orderId, html (generated HTML)
   - Response: PDF blob
   - Filename: `payment-receipt-{payment.id}.pdf`
   - Success: shows toast, closes modal
   - Error: shows error alert in modal

#### HTML Structure
- Header: Brand color background with logo text
- Container: Payment summary with label-value rows
- Footer: "Save this receipt for your records."
- Inline CSS for print-ready styling

#### Data Dependencies
- `payment.id`, `payment.amount`, `payment.status` - required
- `payment.paidAt` or `payment.createdAt` - for date
- `payment.paymentMethod` - optional
- `payment.details.receiptNumber` - optional (generates if missing)
- `order.id`, `order.order_number` - for order display
- `order.snapshot` - fallback for order number
- `customization.headerBg`, `customization.logoText` - for branding

#### Custom Styling
- Uses `customization.headerBg` with contrast calculation
- Logo text from `customization.logoText` or fallback: "NJ Cabinets"

**⚠️ DO NOT MODIFY:**
- Receipt number generation logic
- Order number fallback chain
- Currency formatting (USD only)
- HTML structure (needed for PDF generation)
- Receipt filename pattern

---

### 1.6 View Type Specifications Modal (CatalogTable.js)
**File:** `frontend/src/components/CatalogTable.js` (inline modal, lines ~450-545)
**Size:** `{ base: 'full', md: '3xl' }` | `scrollBehavior="inside"` | `isCentered`
**Trigger:** Click on type name in catalog table

#### UI Components
- **Desktop Layout** (Flex row):
  - **Left Side** (40% width):
    - Type image (Image component, max 400px width, object-fit: contain)
    - Fallback: "No image available" text

  - **Right Side** (60% width):
    - Type name (bold)
    - Short name (if available, with label)
    - Description section with long description or fallback message

- **Mobile Layout:**
  - Vertical stack (VStack)
  - Image on top (full width, max 300px height)
  - Text content below

- **Button:** Close button (mobile only, full width, gray, lg size)

#### State Management
```javascript
- showTypeModal (boolean) - Modal visibility
- selectedTypeInfo (object|null) - Currently viewed type data
```

#### Business Logic
1. **Type Selection:**
   - User clicks on type name in catalog table
   - Finds type metadata from `typeMap` (built from `typesMeta` prop)
   - Sets `selectedTypeInfo` with: name, shortName, description, longDescription, imageUrl

2. **Image Handling:**
   - Uses `typeInfo.imageUrl` if available
   - Fallback message if no image
   - No broken image handling (relies on browser defaults)

3. **Description Priority:**
   - Shows `longDescription` if available
   - Falls back to `description`
   - Shows "No description available" if neither exist

#### Data Dependencies
- `typesMeta` (array) - All type metadata with images/descriptions
- Must match catalog item types

**⚠️ DO NOT MODIFY:**
- Type lookup logic (matches by type field)
- Image/description fallback priorities
- Responsive layout breakpoint (md = 3xl modal)

---

### 1.7 View Type Specifications Modal (CatalogTableEdit.js)
**File:** `frontend/src/components/CatalogTableEdit.js` (inline modal, similar to 1.6)
**Size:** `{ base: 'full', md: '3xl' }` | `scrollBehavior="inside"` | `isCentered`
**Trigger:** Click on type name in edit catalog table

**IDENTICAL TO 1.6** - Same structure, logic, and components.
Used in edit proposal flow instead of create proposal flow.

---

## 2. MODIFICATION MODALS

### 2.1 Add Modification Modal (Create)
**File:** `frontend/src/components/model/ModificationModal.jsx`
**Size:** `{ base: 'full', lg: 'lg' }` | `isCentered` | `scrollBehavior="inside"`
**Lines:** 263

#### UI Components
- **Radio Group** (Modification Type):
  - "Select existing modification" (default)
  - "Add custom modification"

- **Existing Modification Section** (shown when type = "existing"):
  - **Select dropdown** (required, shows validation):
    - Options: Maps over `existingModifications` array
    - Placeholder: "Select modification"
    - Empty state: "No modifications available"
  - **Quantity** (NumberInput, min: 1, default: 1)
    - Increment/decrement steppers
  - **Note** (Input, optional)
    - Helper text: "If needed, provide custom instructions..."

- **Custom Modification Section** (shown when type = "custom"):
  - **Name** (Input, required, shows validation)
  - **Row with 3 fields:**
    - Qty (NumberInput, min: 1, max-width: 140px)
    - Price (NumberInput, min: 0, step: 0.01)
    - Taxable (Checkbox, ADMIN-ONLY, with disabled text)
  - **Note** (Input, optional)
    - Helper text: same as existing section

- **Buttons:**
  - Cancel (outline)
  - Save (brand colorScheme)

#### State Management
**ALL STATE MANAGED BY PARENT** - Props-driven component:
```javascript
Props (20 total):
- visible, onClose, onSave - Modal control
- modificationType, setModificationType - "existing" | "custom"

Existing Mod:
- existingModifications (array) - Available modifications
- selectedExistingMod, setSelectedExistingMod - Selected ID
- existingModQty, setExistingModQty - Quantity
- existingModNote, setExistingModNote - Notes

Custom Mod:
- customModName, setCustomModName - Name
- customModQty, setCustomModQty - Quantity
- customModPrice, setCustomModPrice - Price
- customModTaxable, setCustomModTaxable - Tax status
- customModNote, setCustomModNote - Notes

Validation:
- validationAttempted (boolean) - Shows validation errors
```

#### Business Logic
1. **Admin-Only Taxable Toggle:**
   - Checks `isAdmin(authUser)` via Redux state
   - If not admin: checkbox disabled with explanation text
   - Only admins can modify tax status

2. **Quantity Enforcement:**
   - Both existing and custom: `Math.max(1, valueNumber)`
   - Ensures minimum quantity of 1

3. **Price Enforcement:**
   - Custom mod: `Math.max(0, valueNumber)`
   - Ensures non-negative prices

4. **Validation Display:**
   - Shows errors only when `validationAttempted` is true
   - Existing: "Modification code is required"
   - Custom name: "Modification code is required"

5. **Save Behavior:**
   - Calls `onSave()` prop
   - Parent component handles actual save logic
   - Modal does not close automatically (parent controls)

#### Data Dependencies
- `authUser` from Redux (for admin check)
- `existingModifications` - Must be array of `{ id, modificationName }`

#### Styling Notes
- Helper text: gray.500 (light) / gray.400 (dark)
- Admin-disabled text: Same gray as helper text

**⚠️ DO NOT MODIFY:**
- Admin-only taxable logic
- Minimum quantity enforcement (1)
- Minimum price enforcement (0)
- Validation error messages
- Props structure (parent-controlled state)

---

### 2.2 Add Modification Modal (Edit)
**File:** `frontend/src/components/model/ModificationModalEdit.jsx`
**Size:** `{ base: 'full', lg: 'lg' }` | `isCentered` | `scrollBehavior="inside"`
**Lines:** 263

**IDENTICAL TO 2.1** - Exact same code, structure, and logic.
Separate file for use in edit proposal flow vs create proposal flow.

**⚠️ NOTE:** These two files are duplicates. Consider consolidating in future refactor.

---

### 2.3 Browse Modifications Modal
**File:** `frontend/src/components/model/ModificationBrowserModal.jsx`
**Size:** `{ base: 'full', lg: '6xl' }` (EXTRA LARGE) | `scrollBehavior="inside"`
**Lines:** ~800+ (complex modal)

#### UI Components - 3 View States

**VIEW 1: Categories (default)**
- **Header:** PageHeader with title/subtitle
- **Search Bar:** Input with Search icon (left element)
- **Category Grid:** SimpleGrid (1-4 columns responsive)
  - Each category card shows:
    - Category name (heading)
    - Template count badge
    - Click to view templates

**VIEW 2: Templates (category selected)**
- **Breadcrumb Navigation:**
  - "Categories" (clickable, returns to view 1)
  - Current category name

- **Search Bar:** Filters templates in current category
- **Template Grid:** SimpleGrid (1-3 columns responsive)
  - Each template card shows:
    - Template name
    - Effective price (with override indicator)
    - Scope badge (if not "all")
    - Lead time
    - Click to view details

**VIEW 3: Details (template selected)**
- **Breadcrumb Navigation:**
  - "Categories" → Category → Template name

- **Template Info:**
  - Name, price, lead time
  - Image (if available)
  - Description

- **Dynamic Fields** (based on `fieldsConfig`):
  - **Quantity Range Slider** (if enabled):
    - Label, min/max values
    - Slider with track and thumb
    - Live value display

  - **Measurement Sliders** (dynamic, multiple possible):
    - Each slider shows: label, value in inches (formatted as fractions)
    - Min/max from config
    - Step from config

  - **Side Selector** (if enabled):
    - Radio buttons: Left, Right, Both (options from config)

  - **File Upload** (if enabled):
    - File input
    - Uploaded file list with delete buttons
    - Max files check (default: 5)

- **Summary Panel:**
  - Selected options display
  - Total quantity × price calculation
  - Any additional notes

- **Buttons:**
  - Back (returns to templates)
  - Apply Modification (calls onApplyModification)

#### State Management
```javascript
- loading (boolean) - Fetching modifications
- searchTerm (string) - Filter input
- gallery (array) - Categories with templates
- currentView (string) - "categories" | "templates" | "details"
- selectedCategory (object|null) - Current category
- selectedTemplate (object|null) - Current template
- modification (object):
  - quantity (number)
  - selectedOptions (object) - Dynamic based on fieldsConfig
  - uploadedFiles (array) - File upload state
```

#### Business Logic
1. **Data Loading:**
   - On open: fetches from `/api/global-mods/item/{catalogItemId}`
   - Groups assignments by category
   - Attaches override prices and scope to templates
   - Empty state handled

2. **Navigation Flow:**
   ```
   Categories → (click category) → Templates → (click template) → Details → Apply
                ← (breadcrumb) ←              ← (back/breadcrumb) ←
   ```

3. **Search Filtering:**
   - View 1 (categories): Filters by category name OR template names within
   - View 2 (templates): Filters templates in current category only
   - View 3 (details): Search hidden

4. **Dynamic Field Initialization:**
   - Reads `template.fieldsConfig`:
     - `qtyRange`: { enabled, min, max, step }
     - `sliders`: { [key]: { enabled, min, max, step, label } }
     - `sideSelector`: { enabled, options: ["L", "R", "B"] }
     - `fileUpload`: { enabled, maxFiles }
   - Sets initial values (minimums for sliders, first option for side)

5. **File Upload:**
   - Stores files in `modification.uploadedFiles` array
   - Max files check (prevents >5 uploads)
   - Delete file by index

6. **Inches Formatting:**
   - Helper function `formatInches(value)`:
     - Converts decimal to whole + fraction
     - Uses 1/8" increments
     - Example: 12.375 → "12 3/8\""

7. **Price Calculation:**
   - Uses `effectivePrice` (override price ?? template.defaultPrice)
   - Total = effectivePrice × quantity

8. **Apply Logic:**
   - Calls `onApplyModification(selectedTemplate, modification, selectedItemIndex)`
   - Parent handles adding to catalog item
   - Modal remains open (parent controls close)

#### Data Dependencies
- `catalogItemId` (required) - Item to load modifications for
- `selectedItemIndex` - Which catalog item to apply to
- Returns to parent: template, modification object, item index

#### Responsive Behavior
- Grid columns: 1 (mobile) → 2 (tablet) → 3-4 (desktop)
- Breadcrumb: Stacks on mobile
- Template cards: Full width on mobile

#### Color Mode Values
- Uses 9 different `useColorModeValue` variables for adaptive theming

**⚠️ DO NOT MODIFY:**
- Category grouping logic (by category ID)
- Override price precedence (override ?? default)
- fieldsConfig structure and parsing
- Inches formatting algorithm
- File upload max limit (5)
- Navigation flow (categories → templates → details)
- Apply callback signature

---

## 3. MANUFACTURER/SETTINGS MODALS

### 3.1 Edit Manufacturer Modal
**File:** `frontend/src/components/EditManufacturerModal.jsx`
**Size:** `{ base: 'full', lg: 'lg' }` | `isCentered` | `scrollBehavior="inside"`
**Lines:** ~100

**⚠️ DUPLICATE WARNING:** Also exists at `frontend/src/components/model/EditManufacturerModal.jsx`

#### UI Components
- **Name** (Input, required)
- **Email** (Input, type="email", required)
- **Multiplier** (Input, validated with regex)
- **Enabled** (Switch)
- **Alert:** Validation errors (shown when validation fails)
- **Buttons:**
  - Cancel
  - Save

#### State Management
```javascript
- formData (object):
  - name (string, required)
  - email (string, required)
  - multiplier (string, validated)
  - enabled (boolean)
- error (string|null) - Validation error message
```

#### Business Logic
1. **Multiplier Validation:**
   - Regex: `/^(?:\d{0,4})(?:\.\d{0,2})?$/`
   - Allows: up to 4 digits before decimal, up to 2 after
   - Examples: "1.25", "0.5", "1000", "99.99"

2. **Form Validation:**
   - Name: required, non-empty after trim
   - Email: required, non-empty after trim
   - Multiplier: must match regex

3. **Save:**
   - Calls `onSave(formData)`
   - Parent handles API call
   - Shows error if validation fails

#### Data Dependencies
- `manufacturer` prop - Pre-fills form on edit
- If null: form starts empty (create mode)

**⚠️ DO NOT MODIFY:**
- Multiplier regex pattern
- Validation rules
- Form field structure

---

### 3.2 Edit Group Modal
**File:** `frontend/src/components/model/EditGroupModal.jsx`
**Size:** `{ base: 'full', md: 'md', lg: 'lg' }` | `isCentered` | `scrollBehavior="inside"`
**Lines:** ~120

#### UI Components
- **Name** (Input, required)
- **Multiplier** (Input, validated with regex)
- **Enabled** (Switch)
- **Alert:** Validation errors
- **Buttons:**
  - Cancel
  - Save

#### State Management & Logic
**SIMILAR TO 3.1** - Same structure, validations, and multiplier regex.
Difference: Used for manufacturer groups instead of manufacturers.

---

### 3.3 Edit User Modal
**File:** `frontend/src/components/EditUsersModel.js`
**Size:** Not specified (uses default)
**Lines:** ~150

#### UI Components
- **Name** (Input, required)
- **Email** (Input, type="email", required, disabled on edit)
- **Password** (Input, type="password", optional on edit)
- **Role** (Select dropdown):
  - Options: Admin, User, etc.
- **Location** (Select dropdown):
  - Populated from Redux `locations` slice
- **Enabled** (Switch)
- **Buttons:**
  - Cancel
  - Save

#### State Management
```javascript
- formData (object):
  - name, email, password, role, locationId, enabled
- Redux: locations.list (array) - For location dropdown
```

#### Business Logic
1. **Create vs Edit Mode:**
   - Edit: email disabled, password optional
   - Create: all fields enabled, password required

2. **Location Dropdown:**
   - Fetches from Redux on mount (`dispatch(fetchLocations())`)
   - Maps over `locations.list` to populate options

3. **Save:**
   - Calls API (create or update based on user.id existence)
   - Shows toast on success/error
   - Closes modal on success

**⚠️ DO NOT MODIFY:**
- Email disabled on edit (prevents email changes)
- Password optional on edit
- Location fetch from Redux

---

## 4. CATALOG MANAGEMENT MODALS

**File:** `frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx`
**Context:** This single file contains 16 inline modals (most complex page in app)

### 4.1 Upload Catalog File Modal
**Lines:** ~3219-3245
**Size:** `{ base: 'full', md: 'md' }` | `scrollBehavior="inside"`

#### UI Components
- **File input** (accepts .csv, .xlsx, .xls)
- **Upload button**
- **Progress indicator**
- **Buttons:** Cancel, Upload

#### Logic
- Uploads to `/api/manufacturers/{id}/catalog/upload`
- Shows progress bar
- Refreshes catalog on success

---

### 4.2 Assign Global Mods Modal
**Lines:** ~3246-3584
**Size:** `{ base: 'full', md: 'md', lg: 'lg' }` | `scrollBehavior="inside"`

#### UI Components
- **Modification browser/selector**
- **Selected items list**
- **Scope selector:** All / Type / Style / Item
- **Override price** (optional)
- **Buttons:** Cancel, Assign

#### Logic
- Assigns global modifications to catalog items
- Supports bulk assignment
- Can override default pricing

---

### 4.3 Manual Entry Modal
**Lines:** ~3585-3653
**Size:** `{ base: 'full', md: 'md' }` | `scrollBehavior="inside"`

#### UI Components
- **Code** (Input)
- **Description** (Input)
- **Type** (Select)
- **Style** (Select)
- **Price** (NumberInput)
- **Buttons:** Cancel, Add Item

#### Logic
- Creates single catalog item manually
- Validates required fields
- Adds to current manufacturer catalog

---

### 4.4-4.16 Additional Catalog Modals
Due to space constraints, here's a summary table:

| Modal | Purpose | Key Fields | Size |
|-------|---------|-----------|------|
| Edit Item | Edit catalog item details | Code, desc, type, style, price | md |
| Create Style | Add new style | Name, image upload | md |
| View Style Details | View style info | Name, image, metadata | lg |
| Hinges Config | Set hinge options | Left, Right, None | md |
| Modification Assignment | Assign mods to item | Mod selector, scope | md |
| Delete Style | Confirm style deletion | Confirmation text | md |
| Delete Item | Confirm item deletion | Confirmation text | md |
| Bulk Delete | Delete multiple items | Selected count, confirm | md |
| Rollback | Revert catalog changes | Version selector | md |
| Bulk Edit | Edit multiple items | Field selector, new value | lg |
| Edit Style Name | Rename style | New name input | md |
| Delete Category | Delete mod category | Confirmation | md |
| Move Modification | Move mod to category | Category dropdown | md |

**⚠️ DO NOT MODIFY:**
- Bulk operation logic (affects multiple items)
- Rollback version handling
- Assignment scope logic (all/type/style/item)

---

## 5. STYLE PICTURES TAB

**File:** `frontend/src/pages/settings/manufacturers/tabs/StylePicturesTab.jsx`

### 5.1 Create Style Picture Modal
**Lines:** ~378-435
**Size:** `{ base: 'full', md: 'md' }` | `scrollBehavior="inside"`

#### UI Components
- **Style Name** (Input, required)
- **Image Upload** (File input, accepts images only)
- **Preview** (Shows selected image)
- **Buttons:** Cancel, Upload

#### Logic
- Validates image file (size, type)
- Uploads to `/api/manufacturers/{id}/styles`
- Creates style with image

---

### 5.2 Delete Style Picture Modal
**Lines:** ~436-470
**Size:** `{ base: 'full', md: 'md' }` | `scrollBehavior="inside"`

#### UI Components
- **Warning text** (confirms deletion)
- **Style name display**
- **Buttons:** Cancel, Delete

#### Logic
- Confirms deletion
- DELETE to `/api/manufacturers/{id}/styles/{styleId}`
- Refreshes style list

---

## 6. GLOBAL MODS PAGE

**File:** `frontend/src/pages/settings/globalMods/GlobalModsPage.jsx`

### 6.1 Create Global Modification Modal
**Lines:** ~1417-1600
**Size:** `{ base: 'full', md: 'md', lg: 'lg' }` | `scrollBehavior="inside"`

#### UI Components - Multi-Step Modal

**Step 1: Select/Create Category**
- **Dropdown:** Existing categories
- **Or:** "Create new" option
- If new: Name, Order Index inputs
- **Button:** Next

**Step 2: Template Details**
- **Name** (Input, required)
- **Description** (Textarea)
- **Default Price** (NumberInput)
- **Lead Time Days** (NumberInput)
- **Image Upload** (optional)
- **Button:** Next

**Step 3: Configure Fields**
- **Quantity Range:** Enable, Min, Max, Step
- **Measurements:** Add slider fields (label, min, max, step)
- **Side Selector:** Enable, Select options (L/R/B)
- **File Upload:** Enable, Max files
- **Buttons:** Back, Create

#### State Management
```javascript
- createStep (number) - 1, 2, or 3
- selectedSubmenu (string) - Category ID or "new"
- newCategory (object) - { name, orderIndex }
- templateForm (object) - { name, description, defaultPrice, leadTimeDays, image }
- fieldsConfig (object) - { qtyRange, sliders, sideSelector, fileUpload }
```

#### Logic
- Multi-step wizard flow
- Creates category if needed (step 1)
- Creates template with config (step 2-3)
- POST to `/api/global-mods/templates`

**⚠️ DO NOT MODIFY:**
- fieldsConfig structure (used by browser modal)
- Step sequence (must create category first)
- Default values (qtyRange.min = 1, leadTimeDays = 8)

---

## 7. PAYMENTS PAGE

**File:** `frontend/src/pages/payments/PaymentsList.jsx`

### 7.1 Create Payment Modal
**Lines:** ~477-508
**Size:** `{ base: 'full', md: 'md' }` | `scrollBehavior="inside"`

#### UI Components
- **Order** (Select dropdown)
- **Amount** (NumberInput, currency)
- **Payment Method** (Select)
- **Status** (Select)
- **Notes** (Textarea, optional)
- **Buttons:** Cancel, Create

---

### 7.2 Gateway Configuration Modal
**Lines:** ~509-541
**Size:** `{ base: 'full', md: 'md' }` | `scrollBehavior="inside"`

#### UI Components
- **Gateway Provider** (Select): Stripe, PayPal, etc.
- **API Key** (Input, password type)
- **Secret Key** (Input, password type)
- **Test Mode** (Switch)
- **Buttons:** Cancel, Save

---

### 7.3 Apply Payment Modal
**Lines:** ~542-580
**Size:** `{ base: 'full', md: 'md' }` | `scrollBehavior="inside"`

#### UI Components
- **Payment** (Select dropdown of available payments)
- **Order** (Select dropdown)
- **Amount to Apply** (NumberInput, max = payment amount)
- **Buttons:** Cancel, Apply

---

## 8. OTHER ACTION MODALS

### 8.1 Edit Proposal Item Modal
**File:** `frontend/src/pages/proposals/CreateProposal/ProposalSummary.jsx`
**Lines:** ~678-699
**Size:** `{ base: 'full', md: 'md' }` | `isCentered` | `scrollBehavior="inside"`

#### UI Components
- **Quantity** (NumberInput, min: 1)
- **Notes** (Textarea, optional)
- **Buttons:** Cancel, Save

#### Logic
- Edits existing proposal item
- Updates quantity and notes only
- Parent handles state update

---

### 8.2 Delete Proposal Item Modal
**File:** `frontend/src/pages/proposals/CreateProposal/ProposalSummary.jsx`
**Lines:** ~700-725
**Size:** `{ base: 'full', md: 'md' }` | `isCentered` | `scrollBehavior="inside"`

#### UI Components
- **Warning text**
- **Item description** (displays what will be deleted)
- **Buttons:** Cancel, Delete

---

### 8.3 PDF Preview Modal
**File:** `frontend/src/pages/settings/customization/PdfLayoutCustomization.jsx`
**Lines:** ~765-850
**Size:** `{ base: 'full', md: 'xl', lg: '6xl' }` | `scrollBehavior="inside"`

#### UI Components
- **Large iframe** (displays PDF preview)
- **Close button**

#### Logic
- Shows live preview of PDF layout settings
- Updates as user changes customization options

---

### 8.4 Showroom Mode Toggle Modal
**File:** `frontend/src/components/showroom/ShowroomModeToggle.jsx`
**Lines:** ~135-180
**Size:** `{ base: 'full', md: 'sm' }` (SMALL) | `isCentered` | `scrollBehavior="inside"`

#### UI Components
- **Warning text:** "Enable showroom mode?"
- **Description:** Explains what showroom mode does
- **Buttons:** Cancel, Enable

#### Logic
- Confirms enabling showroom mode
- Sets mode in localStorage or Redux
- Reloads page or updates state

---

### 8.5 View File Modal
**File:** `frontend/src/components/FileViewerModal.jsx`
**Size:** `xl` (default) | Variable based on file type
**Lines:** 300+

#### UI Components - Dynamic Based on File Type

**For Images:**
- **Image component** (full width, responsive)
- **Zoom button** (optional fullscreen)

**For PDFs:**
- **Desktop:** `<DesktopPdfViewer />` component
- **Mobile:** `<MobilePdfViewer />` component
- **Lazy loaded**

**For Videos:**
- **Video player** (HTML5 video element)
- Controls enabled

**For Text/Code:**
- **Monaco Editor** (syntax highlighting)
- **Lazy loaded**
- Read-only mode

**For XML:**
- **ReactXmlViewer** component
- **Lazy loaded**
- Formatted display

**For Other Files:**
- **File icon** (from Lucide)
- **Download button**
- **File info:** name, size, type

#### All Viewers Include:
- **Header:** Filename
- **Download button** (always available)
- **Close button**

#### State Management
```javascript
- textContent (string) - Loaded text file content
- xmlContent (string) - Loaded XML content
- isMobile (boolean) - Window width <= 768px
- blobUrl (string|null) - Object URL for blobs
- isFullscreen (boolean) - Fullscreen image state
```

#### Business Logic
1. **File Type Detection:**
   - Priority 1: `file.fileType` or `file.type` metadata
   - Priority 2: MIME type (`file.mimeType`)
   - Priority 3: File extension parsing
   - Returns: "image" | "video" | "audio" | "pdf" | "text" | "xml" | "spreadsheet" | "other"

2. **URL Resolution:**
   - Calls `resolveFileUrl(file, 'inline')` if provided
   - Falls back to `file.url`
   - For downloads: `resolveFileUrl(file, 'download')`

3. **Content Loading:**
   - Text/XML: Fetches via axios as blob, reads as text
   - Images/Video: Direct URL to src
   - PDF: Passes URL to viewer components

4. **Download Function:**
   - Custom `onDownload` callback if provided
   - Otherwise: creates download link with filename
   - For blobs: creates object URL

5. **Responsive Behavior:**
   - Detects mobile via window resize listener
   - Switches PDF viewer component (mobile vs desktop)
   - Adjusts layout for small screens

#### Lazy Loading
- Monaco Editor: Loaded only when text files opened
- ReactXmlViewer: Loaded only when XML files opened
- PDF Viewers: Loaded only when PDFs opened
- Shows `<Spinner />` while loading

#### Supported Formats
- **Images:** jpg, jpeg, png, gif, svg, webp
- **Videos:** mp4, webm, avi, mov
- **Audio:** mp3, wav, ogg
- **PDF:** pdf
- **Text:** txt, md, json, js, css, html, sql
- **Spreadsheet:** csv, xlsx, xls
- **XML:** xml

**⚠️ DO NOT MODIFY:**
- File type detection priority order
- Lazy loading implementation (performance critical)
- Mobile breakpoint (768px)
- URL resolution logic

---

## SUMMARY

### Modal Count Breakdown
- **Proposal/Contract:** 7 modals (2 with nested modals)
- **Modifications:** 3 modals (1 large 6xl browser)
- **Manufacturer/Settings:** 3 modals
- **Catalog Management:** 16 modals (all in one file!)
- **Style Pictures:** 2 modals
- **Global Mods:** 1 modal (multi-step)
- **Payments:** 3 modals
- **Other Actions:** 5 modals

**Total:** 40 button-triggered modals

### Nested Modals
- **Print Proposal Modal** → Preview Modal (6xl)

### Multi-Step Modals
- **Create Global Modification Modal** (3 steps)

### Complex State Management
- **Browse Modifications Modal** - 3 view states, dynamic fields
- **Print Proposal Modal** - Live preview with options
- **File Viewer Modal** - 8 different file type renderers

### Common Patterns
1. **Size Pattern:** `{ base: 'full', md: 'md' }` (mobile full-screen, desktop medium)
2. **Scroll:** `scrollBehavior="inside"` (fixed header/footer)
3. **Form Validation:** react-hook-form or manual validation
4. **Loading States:** Spinner in buttons, disabled during operations
5. **Error Handling:** Alert components or toast notifications
6. **Motion:** Framer Motion for animations (respects prefers-reduced-motion)

### Critical Logic Flows
1. **PDF Generation:** buildProposalPdfHtml() - DO NOT MODIFY
2. **Modification Assignment:** Browse → Template → Apply - PRESERVE STRUCTURE
3. **File Type Detection:** Extension → MIME → Metadata - KEEP PRIORITY ORDER
4. **Admin-Only Fields:** Taxable checkbox, certain settings - PRESERVE PERMISSIONS
5. **Fixed Columns:** Qty, Price always included in PDF - DO NOT MAKE OPTIONAL

---

**END OF DEEP AUDIT**

*This audit documents the current state of all button-triggered modals. Use this as reference when applying styling changes to ensure core logic and data flows remain intact.*
