# Designer Field Parity Audit

## Scope
- Compare legacy implementation (git `master` branch head) vs. current Chakra rewrite (`njnewui`) for the **Designer** field in both Create Proposal and Edit Proposal flows.
- Document front-end interactions, backend expectations, and data flow.
- Identify parity gaps and logical regressions. No code changes applied.

## Legacy Application (master)
### Create Proposal
- `frontend/src/pages/proposals/CreateProposal/CustomerInfo.jsx`
  - Admins (`hasPermission(...,'admin:users')`) see the designer combobox; contractors do not.
  - Auto-populates designer with the logged-in manufacturer or first available designer if none is selected.
  - `CreatableSelect` options are derived from users with role "Manufacturers".
  - `createNewDesigner` posts to `/api/users` to mint a real user account (role `Manufacturers`, temp email/password). The new user ID is stored in form state and Redux so the backend receives a numeric designer id.
  - Sales rep dropdown re-uses the same designer option list.
- `frontend/src/pages/proposals/CreateProposal/ProposalSummary.jsx`
  - Shows designer dropdown (CreatableSelect) bound to the same user-id options.
  - Validation via Yup requires designer for admins.

### Edit Proposal
- `frontend/src/pages/proposals/EditProposal.jsx`
  - On mount, GET `/api/designers` populates a `CreatableSelect` (no `onCreateOption`; only existing designers allowed).
  - Formik form sends designer user id back through proposal update actions.

### Backend expectations
- `routes/apiRoutes.js` exposes `GET /api/designers` -> `userGroupController.getDesingers`, which currently returns all users (legacy relied on front-end filtering to role `Manufacturers`).
- `models/Proposals.js` defines `designer` as `INTEGER`, foreign-keying into `users`.
- `controllers/proposalsController.js`
  - During create/update (`formData.designer`) values survive only when convertible to a number/date-like string; contractors' designer assignments are stripped.
  - Proposal fetch responses include eager-loaded `designerData` via Sequelize association.
  - Quote/contract exports resolve designer name through `User.findByPk(proposal.designer)`; therefore the field must reference a real user id.

## Current Application (njnewui)
### Create Proposal
- `frontend/src/pages/proposals/CreateProposal/CustomerInfo.jsx`
  - Designer options pulled from Redux `users` slice filtered to `role === 'Manufacturers'` (see line ~153).
  - Auto-population logic intentionally removed (`// Designer field should start empty...` around line 206), so the field starts blank even for designers.
  - `createNewDesigner` (line ~292) only appends a local option `{ value: trimmedName, label: trimmedName }`; no API call is made, and the new option is a plain string.
  - `handleSecondarySelect` writes the selected value straight into `formData.designer`; for existing designers this is a numeric string id, for new ones it is a free-form name.
  - Sales rep dropdown is cloned from the same designer choices.
- `frontend/src/pages/proposals/CreateProposal/ProposalSummary.jsx`
  - Chakra `<Select>` lists only `users` (line ~380). Custom designer strings created in the first step are not rehydrated (no extra option injected), so the summary select renders with an empty selection.

### Edit Proposal
- `frontend/src/pages/proposals/EditProposal.jsx`
  - Continues to call `/api/designers` (line ~284) and stores mapped `{ value: user.id, label: user.name }` entries.
  - UI switched to Chakra `<Select>` with a "+ Create New..." sentinel (`value="__create__"`)—selecting it toggles a text input (`isCreatingDesigner` block around lines 684-752).
  - Confirming the custom designer simply writes the trimmed text into `formData.designer`; no backend entity is created.
  - Clear button resets designer to empty string.

### Backend behavior with current payloads
- When `formData.designer` is a non-numeric string (for example `"Jane Smith"`), the normalization loop in `controllers/proposalsController.js` (lines ~238 and ~1040) treats it as an invalid date and coerces the field to `null`. Consequently, the designer assignment is dropped before persistence.
- Because the string does not match a `User` id, downstream joins (`designerData`) return `null`, and exports/email payloads fall back to `"N/A"`.

## Parity Gaps & Risks
1. **Custom designer creation not persisted**
   - Legacy created a real `Manufacturers` user via `/api/users` and stored its numeric id. The Chakra rewrite only stages an in-memory string, which the backend nulls out. Both Create and Edit flows therefore fail to honor "+ Create New" designers.
2. **Designer field can submit arbitrary strings**
   - `models/Proposals.js` still expects an `INTEGER`; providing strings may lead to silent coercion to `null` or database errors if validation tightens.
3. **Summary step loses custom designer option**
   - The Proposal Summary dropdown reads only from `users`; any designer name fetched/created client-side but not present in `users` disappears, making validation confusing and ultimately saving an empty designer.
4. **Auto-population parity**
   - Legacy defaulted designer for admins (login user or first designer) so form submission rarely failed validation. Chakra version leaves it empty after resetting state, increasing friction and diverging from legacy behavior.
5. **Backend `GET /api/designers` still returns all users**
   - Both versions rely on front-end filtering to constrain to manufacturer roles. There is an opportunity to tighten parity by filtering server-side if desired.

## Summary
- Legacy workflows rely on designer being a persisted user record; creation flows guarantee that by hitting `/api/users`.
- The current Chakra implementation allows free-form strings and never calls the user endpoint, so designer assignments for newly entered names are dropped before save, breaking parity.
- Edit proposal UI now exposes an inline text-entry mode that likewise never persists designers.
- To match legacy logic, the Chakra app must (a) create/select real `Manufacturers` users for designers, (b) keep designer defaults aligned, and (c) ensure summary/edit steps surface identical option sets.
