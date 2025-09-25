the backend is always running. do not ask to start it everytime you are going to do something. you can assume it is running.

## Testing Database Operations

### Working Method - Use Existing Debug Script Pattern
- Always model test scripts after existing scripts like `scripts/debug-list-orders.js`
- Use `const { ModelName } = require('./models');` to access Sequelize models
- Always wrap main logic in async function and call `process.exit(0)` at end
- Use yargs for command line arguments like existing scripts

### Testing Controller Functions
- Use direct controller function calls with mock req/res objects, not HTTP requests
- Edit acceptance: `POST /api/update-proposals` with `action: 'accept'` in formData
- Direct acceptance: `POST /api/quotes/:id/accept` with proposalId in params
- Controller functions expect specific request body structures:
  ```javascript
  // For updateProposal (edit acceptance)
  const mockReq = {
    body: {
      action: 'accept',
      formData: { id: proposalId }  // Note: formData wrapper required
    },
    user: { id: 1, name: 'Test Admin', email: 'admin@njcabinets.com' }
  };

  // For acceptProposal (direct acceptance)
  const mockReq = {
    params: { id: proposalId.toString() },
    body: {},  // No body data needed
    user: { id: 1, name: 'Test Admin', email: 'admin@njcabinets.com', group_id: 1, group: { type: 'admin' } }
  };
  ```
- Mock response with json() method and status() chain for error handling

### Database Access Patterns
- Use `node scripts/debug-list-orders.js --proposal ID` to check orders for proposals
- Use `node find-drafts.js` to find testable draft proposals (unlocked)
- Accepted proposals are locked and cannot be re-accepted
- Server port is 8080 (from .env PORT=8080)
- Main server file is `index.js` not `app.js`

### Verified Working Acceptance Flows (Both Fixed!)
1. **Edit acceptance**: `updateProposal` function creates orders when action="accept"
   - Test with: `node scripts/test-edit-acceptance.js --proposal DRAFT_ID`
   - Frontend uses: `POST /api/update-proposals` with action in formData
2. **Direct acceptance**: `acceptProposal` function creates orders
   - Test with: `node scripts/test-direct-acceptance.js --proposal DRAFT_ID`
   - Frontend uses: `POST /api/quotes/:id/accept`
3. **Verify both**: `node scripts/debug-list-orders.js --proposal ID`

### Common Issues Fixed
- Variable scope: actualManufacturerName/actualStyleName must be declared outside conditional blocks
- Null grand_total_cents: Use proposals with valid pricing data for testing
- formData structure: Edit flow requires action inside formData object

#### Admin Login Immediately Logs Out (Token/Authorization Missing on First Requests)
**Problem**: After logging in as admin, the first dashboard API calls (`/dashboard/counts`, `/dashboard/latest-proposals`) hit the backend without an `Authorization` header. Backend logs showed:
```
[AUTH DEBUG] verifyTokenWithGroup called for: /dashboard/counts
[AUTH DEBUG] Authorization header exists: false
[AUTH DEBUG] Token extracted: null
```
While other requests like `/notifications/unread-count` carried the token correctly. Contractors did not experience this issue.

**Root Cause**: A first-frame race right after login. The admin dashboard dispatched thunks immediately on mount, sometimes before the token was visible to the axios interceptor. Contractor flows naturally delayed/serialized early requests, avoiding the race.

**Solution (that worked)**:
1. Harden axios request interceptor to retry token read briefly when null:
    - If `getFreshestToken()` returns null, wait ~10ms and try again before sending the request.
2. Make admin thunks tolerant of first-frame races:
    - In `dashboardSlice.js`, pass `{ __suppressAuthLogout: true }` to initial dashboard GETs so a transient 401 doesn’t trigger global logout.
3. Ensure token retrieval is robust:
    - `authToken.getFreshestToken()` validates memory/local/session tokens and cleans expired ones; login uses `installTokenEverywhere()` to set memory + both storages.
4. Optionally, gate initial admin dispatches on token presence (Dashboard.jsx already includes a short wait loop).

**Files touched**:
- `frontend/src/helpers/axiosInstance.js` (retry token in request interceptor)
- `frontend/src/store/slices/dashboardSlice.js` (use `__suppressAuthLogout` on first calls)
- `frontend/src/utils/authToken.js` (tightened validation/selection logic)

**Backend confirmation**: After fix, backend shows `Authorization header exists: true` for dashboard endpoints immediately after login.

#### Modifications Not Saving in Create Proposals (Critical Fix)
**Problem**: In CreateProposalForm.jsx/ItemSelectionContent.jsx, modifications were stored in a separate `modificationsMap` state but were not being merged into the `manufacturersData` when saving. This caused modifications to be lost during proposal creation (action="0" save operations).

**Root Cause**: Create and Edit components used different approaches:
- **Edit component** (`ItemSelectionContentEdit.jsx`): Directly stored modifications on items array in manufacturersData
- **Create component** (`ItemSelectionContent.jsx`): Stored modifications in separate `modificationsMap` with keys like `row_${index}`

**Solution**: Updated Create component to match Edit component approach:
1. **Modified updateModification function** to directly update both `tableItems` AND `manufacturersData`:
   ```javascript
   // Update manufacturersData directly like in Edit component
   setFormData(prev => {
       const md = Array.isArray(prev.manufacturersData) ? [...prev.manufacturersData] : [];
       const vIdx = md.findIndex(manufacturer => manufacturer.versionName === selectVersion?.versionName);
       if (vIdx !== -1 && md[vIdx].items) {
           const items = Array.isArray(md[vIdx].items) ? [...md[vIdx].items] : [];
           if (rowIndex >= 0 && rowIndex < items.length) {
               items[rowIndex] = { ...items[rowIndex], modifications: updatedModifications };
           }
           md[vIdx] = { ...md[vIdx], items };
       }
       return { ...prev, manufacturersData: md };
   });
   ```

2. **Removed complex mapping logic** from useEffect that was trying to merge modificationsMap with items

#### Hinge/Exposed Side Independence for Duplicate Items (Critical Fix)
**Problem**: In Create Proposal, when having multiple items with the same product code (e.g., multiple B12 cabinets), selecting hinge side or exposed side on one item would mirror to all other items with the same code. This should be independent for each row.

**Root Cause**: Create component's `updateHingeSide`, `updateExposedSide`, `updateQty`, `toggleRowAssembly`, and `handleDelete` functions used `findIndex` with item ID matching, which finds the first occurrence of duplicate items rather than the specific row.

**Original problematic pattern**:
```javascript
const updateHingeSide = (index, selectedSide) => {
    const viewItem = filteredItems[index];
    const targetIdx = prevItems.findIndex((it) => it?.id === viewItem?.id && it?.selectVersion === viewItem?.selectVersion);
    // This finds FIRST occurrence, not the specific row clicked
}
```

**Solution**: Map display index to correct table index by counting occurrences:
```javascript
const updateHingeSide = (index, selectedSide) => {
    const viewItem = filteredItems[index];

    // Count how many items with the same ID we've seen before this filtered index
    let seenCount = 0;
    for (let i = 0; i < index; i++) {
        if (filteredItems[i]?.id === viewItem.id && filteredItems[i]?.selectVersion === viewItem.selectVersion) {
            seenCount++;
        }
    }

    // Find the nth occurrence of this item in tableItems
    let foundCount = 0;
    let targetIdx = -1;
    for (let i = 0; i < prevItems.length; i++) {
        if (prevItems[i]?.id === viewItem?.id && prevItems[i]?.selectVersion === viewItem?.selectVersion) {
            if (foundCount === seenCount) {
                targetIdx = i;
                break;
            }
            foundCount++;
        }
    }
    // Now update the correct specific instance
}
```

**Fixed Functions**: `updateHingeSide`, `updateExposedSide`, `updateQty`, `toggleRowAssembly`, `handleDelete`

#### Hinge/Exposed Side Data Not Saving in Create Proposals (Critical Fix)
**Problem**: In Create Proposal, hinge side and exposed side selections were working for display/interaction but were not being saved to `formData.manufacturersData` when the proposal was saved, unlike the Edit component.

**Root Cause**: Create component's functions (`updateHingeSide`, `updateExposedSide`, `updateQty`, `toggleRowAssembly`, `handleDelete`) were only updating local state (`tableItems`) and Redux, but missing the crucial `setFormData` call to update `manufacturersData`.

**Solution**: Copy the formData update logic from Edit component to all affected functions in Create component:
```javascript
// After updating tableItems, also update formData.manufacturersData
setFormData(prev => {
    const md = Array.isArray(prev?.manufacturersData) ? [...prev.manufacturersData] : [];
    const vIdx = md.findIndex(m => m.versionName === selectVersion?.versionName);
    if (vIdx !== -1) {
        const items = Array.isArray(md[vIdx].items) ? [...md[vIdx].items] : [];
        // Find correct item using same duplicate-handling logic as tableItems
        // Update the item in formData
        md[vIdx] = { ...md[vIdx], items };
    }
    return { ...prev, manufacturersData: md };
});
```

**Affected Functions**: `updateHingeSide`, `updateExposedSide`, `updateQty`, `toggleRowAssembly`, `handleDelete`

**Key Insight**: When frontend issues differ between Create and Edit flows, copy the working Edit component approach exactly rather than trying to create custom mapping logic.

### Hinge/Exposed Side Data in Order Snapshots (Critical Implementation)
**Requirement**: When a proposal is accepted and converted to an order, the hinge side and exposed side selections must be preserved in the order snapshot for production reference.

**Implementation**: Updated `controllers/proposalsController.js` to include hinge/exposed side data in order snapshots:
```javascript
// In item mapping functions (acceptProposal and updateProposal):
return ({
    id: item.id || item.itemId,
    name: item.name || item.itemName || item.description,
    sku: item.sku || item.code,
    price: toNum(item.price || item.cost || item.unitPrice || 0),
    quantity: Number(item.quantity || item.qty || 1),
    total: toNum(item.total || item.totalPrice || (item.price * item.quantity) || 0),
    taxable: Boolean(item.taxable ?? item.isTaxable ?? true),
    category: item.category || item.type,
    dimensions: item.dimensions || item.size,
    notes: item.notes || item.description || item.comments,
    modifications: normalizedMods,
    modificationsTotal: normalizedMods.reduce((s, m) => s + (m.price * (m.qty || 1)), 0),
    hingeSide: item.hingeSide || null,           // ADDED: Preserve hinge side selection
    exposedSide: item.exposedSide || null,       // ADDED: Preserve exposed side selection
    includeAssemblyFee: Boolean(item.includeAssemblyFee), // ADDED: Assembly fee flag
    isRowAssembled: Boolean(item.isRowAssembled)           // ADDED: Row assembly status
});
```

**Testing**: Use `node scripts/test-hinge-exposed-side-snapshot.js --proposal PROPOSAL_ID` to verify that hinge/exposed side selections are properly captured in order snapshots.

**Affected Functions**: Both `acceptProposal` and `updateProposal` (accept action) now preserve these critical cabinet specification fields in the order snapshot.

### Admin-Only Discount Access (Security Feature)
**Requirement**: Only admin users should be able to apply discounts to proposals. Contractors should not have access to discount fields.

**Implementation**: Updated both `ItemSelectionContent.jsx` and `ItemSelectionContentEdit.jsx` to wrap discount input fields with admin permission checks:
```jsx
{isUserAdmin && (
    <tr>
        <th className="bg-light">{t('proposalUI.summary.discountPct')}</th>
        <td className="text-center">
            <input type="number" /* discount input */ />
        </td>
    </tr>
)}
```

**Security Note**: The `isUserAdmin` variable uses the `isAdmin()` helper function which checks for 'admin' or 'super_admin' roles. Contractors with role 'contractor' cannot access discount functionality, ensuring pricing integrity.

### Visibility Rules: Quotes and Orders (Enforced)
- Non-admin users must see only their own data:
    - Contractors: only proposals they created and orders belonging to their contractor group.
    - Non-admin staff: only proposals they accepted and orders they accepted.
- Admins can see all quotes and all orders; they can optionally filter by group or self-scope with `mine=true`.

Implementation references:
- Quotes listing and details: `controllers/proposalsController.js`
    - Listing scope in `getProposal()` uses role checks to apply `created_by_user_id` (contractors) or `accepted_by` (staff). Admins can see all or filter.
    - Details scope in `getProposalById()` blocks contractors from others' proposals and blocks staff from proposals not accepted by them; admins bypass.
- Orders listing and details: `controllers/ordersController.js`
    - Listing scope in `listOrders()` allows admins full access; contractors are scoped to `owner_group_id`; staff scoped by `accepted_by_user_id`.
    - Details scope in `getOrder()` enforces the same.

Verification scripts:
- `node scripts/test-orders-permissions.js` (requires ADMIN_JWT and CONTRACTOR_JWT)
- `node scripts/test-quotes-permissions.js` (requires ADMIN_JWT, CONTRACTOR_JWT, STAFF_JWT)

## Migrations (Umzug + Sequelize) — Required Conventions

These rules prevent common breakages during container builds and ensure migrations are idempotent and reversible.

1) Function signature and parameters
- Always export functions with the exact Sequelize/Umzug signature:
    ```js
    module.exports = {
        async up(queryInterface, Sequelize) { /* ... */ },
        async down(queryInterface, Sequelize) { /* ... */ }
    }
    ```
- Do NOT call `sequelize.getQueryInterface()` or import/instantiate Sequelize inside migrations. Use the provided `queryInterface` and `Sequelize` parameters only.

2) DataTypes source
- Use `Sequelize.DataTypes` (from the provided parameter), e.g.:
    ```js
    const { DataTypes } = Sequelize;
    await queryInterface.addColumn('manufacturers', 'autoEmailOnAccept', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    });
    ```
- Do NOT import DataTypes from `sequelize` directly.

3) Idempotency and safe checks
- Before adding/removing columns, describe the table and check current schema:
    ```js
    const table = await queryInterface.describeTable('manufacturers').catch(() => null);
    if (!table) return; // Table missing in some envs — skip safely
    if (!table.orderEmailSubject) {
        await queryInterface.addColumn('manufacturers', 'orderEmailSubject', {
            type: DataTypes.STRING(255),
            allowNull: true,
        });
    }
    ```
- For `down`, also check existence before removing to avoid throwing on partially-migrated envs:
    ```js
    if (table.orderEmailSubject) {
        await queryInterface.removeColumn('manufacturers', 'orderEmailSubject');
    }
    ```

4) Reversibility
- Every `up` change should have a corresponding `down` reversal when practical (e.g., remove columns that were added). Keep both directions idempotent with `describeTable` checks.

5) File naming and ordering
- Place files under `scripts/migrations/` with sortable names, e.g. `20251005-XXXX-description.js` or `YYYYMMDDHHmm-description.js`.
- Umzug runs in filename order; use a timestamp prefix to guarantee correct sequencing.

6) Avoid risky operations on large tables
- Adding non-null columns without defaults can lock tables. Prefer:
    - Add as nullable + default, backfill in batches (if needed), then alter to non-null.
    - Or keep nullable when acceptable for flexibility.

7) Do not import application models
- Migrations must not import anything from `models/` or use model instances. Use only `queryInterface` and `Sequelize.DataTypes`.

8) Local testing and verification
- Run migrations locally via `node scripts/migrate.js up` and verify schema with `node check-schema.js` or `node check-table-structures.js`.
- Rerunnable: `up` should be a no-op on a database that already has the changes.

9) Backup notes during migration
- Our migration runner performs a pre-migration backup with `mysqldump` using `--no-tablespaces` to avoid requiring the `PROCESS` privilege. This is handled automatically in `scripts/migrate.js`.

10) Minimal template to copy
```js
'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const { DataTypes } = Sequelize;
        const table = await queryInterface.describeTable('manufacturers').catch(() => null);
        if (!table) return; // safe early exit if table missing

        if (!table.orderEmailSubject) {
            await queryInterface.addColumn('manufacturers', 'orderEmailSubject', {
                type: DataTypes.STRING(255),
                allowNull: true,
            });
        }
        if (!table.orderEmailTemplate) {
            await queryInterface.addColumn('manufacturers', 'orderEmailTemplate', {
                type: DataTypes.TEXT('long'),
                allowNull: true,
            });
        }
        if (!table.orderEmailMode) {
            await queryInterface.addColumn('manufacturers', 'orderEmailMode', {
                type: DataTypes.ENUM('pdf', 'plain', 'both'),
                allowNull: false,
                defaultValue: 'pdf',
            });
        }
        if (!table.autoEmailOnAccept) {
            await queryInterface.addColumn('manufacturers', 'autoEmailOnAccept', {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            });
        }
    },

    async down(queryInterface, Sequelize) {
        const table = await queryInterface.describeTable('manufacturers').catch(() => null);
        if (!table) return;

        if (table.autoEmailOnAccept) {
            await queryInterface.removeColumn('manufacturers', 'autoEmailOnAccept');
        }
        if (table.orderEmailMode) {
            await queryInterface.removeColumn('manufacturers', 'orderEmailMode');
        }
        if (table.orderEmailTemplate) {
            await queryInterface.removeColumn('manufacturers', 'orderEmailTemplate');
        }
        if (table.orderEmailSubject) {
            await queryInterface.removeColumn('manufacturers', 'orderEmailSubject');
        }
    }
};
```

Following these conventions will prevent runtime errors like "Cannot read properties of undefined (reading 'describeTable')" and privilege-related backup failures, and will keep migrations safe across dev/prod environments.