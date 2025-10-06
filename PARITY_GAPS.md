# Parity Gaps (Quotes / Orders / Proposals / Catalogs)

## 1. Reject & Archive from Quote Creation no longer returns to Quotes list
- **Location:** `frontend/src/pages/proposals/CreateProposalForm.jsx:280-293`
- **Legacy behavior:** After rejecting from the final step (`sendToBackend('2')`) the modal closed and the app navigated back to `/quotes`, showing the updated list.
- **Current behavior:** Success alert attaches `onConfirm` to `window.location.reload()`, which reloads the creation wizard instead of returning to the quotes table. Users stay on a cleared create form instead of seeing the archived quote in the list.
- **Fix:** Replace the `onConfirm` callback for the `'2'` action with navigation to `/quotes` (matching the legacy flow).

## 2. Catalog mapping destructive confirmations render `[object Object]` and bypass copy
- **Location:** `frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx:59-70` and usages (e.g. line 429, 1726, 5197).
- **Legacy behavior:** SweetAlert dialogs received a configuration object (title, body, labels) and displayed proper confirmation text before deletions, bulk assignments, or large uploads.
- **Current behavior:** New `askConfirm` helper expects positional arguments `(title, description, ...)`, but callers pass a single object. The dialog title becomes `[object Object]`, description is blank, and custom labels never render. End users have no meaningful prompt before confirming destructive actions.
- **Fix:** Update `askConfirm` to accept an options object (`{ title, description, confirmText, cancelText }`) or refactor callers to pass discrete arguments. Ensure the dialog renders the expected strings.

---

_Run comparison focused on quotes/proposals/orders/catalog flows; additional areas look visually updated but behaved like legacy during manual review._
