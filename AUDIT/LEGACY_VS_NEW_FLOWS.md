# Legacy vs New Flow Audit

## Critical Regressions
- **Proposal lists never populate in the new UI.** `useProposals` now returns the raw Axios payload (`{ success, data, pagination }`), but `Proposals.jsx` still assumes it receives an array. Because `Array.isArray(proposalsData)` fails, the list renders empty and all optimistic updates operate on `undefined` (`frontend/src/queries/proposalQueries.js:25`; `frontend/src/pages/proposals/Proposals.jsx:54`; response shape defined in `controllers/proposalsController.js:461`).
- **Quote acceptance now points to a non-existent REST route.** `ItemSelectionStep` posts to `/api/proposals/:id/accept`, yet the server still exposes `/api/quotes/:id/accept`. Every acceptance attempt therefore 404s (`frontend/src/pages/proposals/CreateProposal/ProposalSummary.jsx:243`; `routes/apiRoutes.js:323`).
- **Payments regression (intent + apply).** The new Stripe intent call hits `/api/payments/:id/intent`, but Express registers `/payments/:id/stripe-intent`; manual apply now POSTs `/api/payments/:id/apply` with `{ method: ... }`, while the backend expects a PUT body containing `{ transactionId, paymentMethod }`. Result: checkout cannot initialise, and applying payments never updates correctly (`frontend/src/pages/payments/PaymentPage.jsx:174`; `routes/payments.js:390`; `frontend/src/queries/paymentsQueries.js:79`; `frontend/src/pages/payments/PaymentsList.jsx:229-233`; `routes/payments.js:345-372`).
- **React Query mutations reference routes the API never served.** `useCreateProposal`/`useUpdateProposal` target `/api/send-form-data-to-backend` and `/api/proposals/:id`; the legacy API still expects `/api/create-proposals` and `/api/update-proposals`, so adopting the new hooks would fail immediately (`frontend/src/queries/proposalQueries.js:225`, `241`; `routes/apiRoutes.js:299-302`).
- **Payments list pagination is incompatible with the API.** The new `usePayments` wraps the call in `useInfiniteQuery` and expects `pages[].data`, but the server returns `{ payments, pagination }`. The UI therefore renders an empty grid and never exposes pagination controls (`frontend/src/pages/payments/PaymentsList.jsx:98-99`; `frontend/src/queries/paymentsQueries.js:19-35`; `routes/payments.js:188-205`).

## Flow-by-Flow Notes

### Create Proposal (Steps 1–4)
- **Customer info options lost flexibility.** Legacy used `CreatableSelect` for location / lead source / type, letting reps add ad-hoc values (`origin/master:frontend/src/pages/proposals/CreateProposal/CustomerInfo.jsx`). The Chakra rewrite swaps in fixed `<Select>` lists, removing that ability (`frontend/src/pages/proposals/CreateProposal/CustomerInfo.jsx:332-409`).
- **Designer / customer creation logic parity.** Contractor scoping, auto-designer selection, and modal creation helpers were carried across (compare `createNewDesigner` in both versions), so behaviour matches legacy.
- **Manufacturer step UX parity with different tech.** Selection still hydrates `manufacturersData` and advances to step 3, but the React Hook Form submit guard now blocks the "Next" CTA until an option is chosen (`frontend/src/pages/proposals/CreateProposal/ManufacturerSelect.jsx:190-213`).
- **Design upload step still pulls `/styles-meta`.** The Chakra variant mirrors the filtering logic, including the fallbacks to `/uploads/manufacturer_catalogs`, so functionality matches legacy (`frontend/src/pages/proposals/CreateProposal/DesignUpload.jsx:66-150`).
- **Summary / save uses legacy API surface.** `sendToBackend` continues to call `/api/create-proposals` or `/api/update-proposals` through the compatibility export, so persistence works provided the legacy Redux thunk is still wired (`frontend/src/pages/proposals/CreateProposalForm.jsx:146-170`; `frontend/src/queries/proposalQueries.js:272-283`).

### Save & Accept / Quote Workflow
- **Immediate accept-from-create is broken.** The new confirm flow first re-saves a draft via the legacy endpoint then hits `/api/proposals/:id/accept`, which does not exist. Legacy used `acceptProposal` from the slice to call `/api/quotes/:id/accept` directly (`frontend/src/pages/proposals/CreateProposal/ProposalSummary.jsx:242-249`; `routes/apiRoutes.js:323`).
- **React Query status mutations assume array data.** `useUpdateProposalStatus` and `useAcceptProposal` optimistically map `old.map(...)`, but the cached value is the `{ success, data }` envelope. Without unwrapping `data`, the optimistic path becomes a no-op (`frontend/src/queries/proposalQueries.js:74-101`, `142-169`).
- **Share links / session handling unchanged.** The new list still posts to `/api/quotes/:id/sessions` when generating view tokens (see `handleCreateShareLink` in both versions), so that behaviour matches.

### Quote List / Retrieval
- **Initial fetch empty + downstream issues.** Because `useProposals` returns the payload object, the table, mobile cards, pagination, and tab counts all operate on `[]`. Actions like delete / status updates therefore also mutate empty caches (`frontend/src/pages/proposals/Proposals.jsx:54, 151, 262`; `frontend/src/queries/proposalQueries.js:25`).
- **Quick create / standard create buttons preserved.** The CTA layout reproduces the legacy pair of buttons and continues to navigate to `/quotes/create?quick=yes` / `/quotes/create` (`frontend/src/pages/proposals/Proposals.jsx:310-323`).

### Edit Proposal
- **Transport unchanged.** Saving still delegates to `sendFormDataToBackend`, so the backend receives the same payload shape (`frontend/src/pages/proposals/EditProposal.jsx:343-364`).
- **Optimistic React Query hooks unused.** The file keeps importing the legacy helper and never calls the new `useUpdateProposal`, so the misaligned REST endpoints noted above are presently dormant.

### Payments
- **Manual apply data mismatch.** UI sends `{ method: finalMethod }`, yet the controller expects `{ paymentMethod, transactionId }`; as a result, the recorded method stays `null` and the optimistic cache marks status `'applied'`—a value the API never emits (`frontend/src/pages/payments/PaymentsList.jsx:222-235`; `frontend/src/queries/paymentsQueries.js:79-104`; `routes/payments.js:345-372`).
- **Stripe intent call misses the route rename.** Backend renamed the helper to `/payments/:id/stripe-intent`; the new screen still posts `/payments/:id/intent`, so every attempt to render the PaymentElement fails (`frontend/src/pages/payments/PaymentPage.jsx:174`; `routes/payments.js:390-486`).
- **List pagination logic regressed.** Legacy Redux slice consumed `{ payments, pagination }`. The React Query port expects `paymentsData.pages?.flatMap(p => p.data)`, leaving the grid empty and the Paginator without totals (`frontend/src/pages/payments/PaymentsList.jsx:98-134`; `routes/payments.js:188-205`).
- **Config screen retains parity.** Stripe secret handling, gateway toggles, and JSON settings editing match the legacy behaviour (compare `PaymentConfiguration.jsx` files).

### User Management
- **Functional parity.** Validation, SweetAlert confirmations, and navigation guard mirror the CoreUI version (see `frontend/src/pages/settings/users/CreateUser.jsx:204-607` vs `origin/master`). Styling swaps to Chakra but API calls (`addUser`, `deleteUser`) and data requirements are unchanged, so no mismatches were found in this area.

## API Contract Summary
- Proposal collection endpoints still return `{ success, data, pagination }` (`controllers/proposalsController.js:461`), yet new React Query helpers assume array responses and define new RESTful routes the server does not expose (`frontend/src/queries/proposalQueries.js:225-242` vs `routes/apiRoutes.js:299-324`).
- Payments endpoints remain `PUT /payments/:id/apply` and `POST /payments/:id/stripe-intent`, while the new UI issues `POST /payments/:id/apply` with a different body and `POST /payments/:id/intent` (`frontend/src/queries/paymentsQueries.js:79`; `frontend/src/pages/payments/PaymentPage.jsx:174`; `routes/payments.js:345-486`).
- Legacy `/api/create-proposals` and `/api/update-proposals` are still authoritative (`routes/apiRoutes.js:299-302`); adopting the new `/api/proposals` endpoints would require backend support.

## Suggested Next Steps
1. Restore compatibility by unwrapping `response.data` in `useProposals`/`useOrders` (or change the controller to return bare arrays) and update optimistic caches to work on the envelope.
2. Repoint acceptance to `/api/quotes/:id/accept` (or add REST aliases server-side) before QA exercises ordering.
3. Align payments UI with the existing REST surface: call `/payments/:id/stripe-intent`, switch apply back to PUT, and send `{ paymentMethod, transactionId }`.
4. Either add `/api/proposals/:id` & `/api/send-form-data-to-backend` endpoints or remove the unused React Query mutations to avoid future regressions.
5. Reintroduce creatable selects for customer meta fields if ad-hoc values remain a business requirement.
