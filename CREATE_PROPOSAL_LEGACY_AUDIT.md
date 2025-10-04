# Create Proposal Legacy Feature Audit

## Scope
- Compared the legacy flow from `origin/master` against the current `njnewui` branch on 2025-02-14.
- Focused on the multi-step Create Proposal experience (`CustomerInfo`, `ManufacturerSelect`, `DesignUpload`, `ProposalSummary`).

## High-Risk Gaps
1. Customer lookup and linking removed
   - Legacy (`origin/master`) uses a searchable `CreatableSelect` that populates `customerId` and email when you pick an existing record, and allows inline creation via `/api/customers/add` (`frontend/src/pages/proposals/CreateProposal/CustomerInfo.jsx:211`).
   - Current branch downgraded the field to a plain text input and never uses the fetched `customerOptions` (`frontend/src/pages/proposals/CreateProposal/CustomerInfo.jsx:325`). `customerId` stays empty, emails no longer autofill, and teams cannot attach a quote to an existing customer without leaving the flow.

2. Inline customer creation UI missing
   - Legacy surfaced `onCreateOption` on the customer picker and showed progress while `/api/customers/add` ran (`frontend/src/pages/proposals/CreateProposal/CustomerInfo.jsx:235`).
   - Current code still defines `handleCreateCustomer`/`isCreatingCustomer`, but nothing in the UI triggers it (`frontend/src/pages/proposals/CreateProposal/CustomerInfo.jsx:188`). Users must exit the flow to add a customer.

3. Inline designer creation removed
   - Legacy lets admins spin up a designer account from the same step by typing a new name; it calls `/api/users` and refreshes the list (`frontend/src/pages/proposals/CreateProposal/CustomerInfo.jsx:298`).
   - Current branch swaps in a static Chakra `Select` and never exposes `createNewDesigner` (`frontend/src/pages/proposals/CreateProposal/CustomerInfo.jsx:240`), so the on-the-fly add flow is gone.

4. Free-form metadata entry restricted
   - Legacy relied on `CreatableSelect` for location, sales rep, lead source, and type, letting teams capture ad-hoc values (`frontend/src/pages/proposals/CreateProposal/CustomerInfo.jsx:483`, `:534`, `:560`).
   - Current branch hard-codes Chakra `Select` components with fixed lists (`frontend/src/pages/proposals/CreateProposal/CustomerInfo.jsx:428`, `:452`, `:470`). Unexpected sources or partner names can no longer be recorded during intake.

## Medium-Risk Behaviour Changes
- Manufacturer selection no longer advances automatically; users must click "Next" after choosing a card. Consider whether the extra click is intentional (`frontend/src/pages/proposals/CreateProposal/ManufacturerSelect.jsx:206`).
- File deletion confirmation now uses `window.confirm`, dropping the translated SweetAlert experience. This changes the tone and removes the descriptive copy (`frontend/src/pages/proposals/CreateProposal/FileUploadSection.jsx:238`).

## Suggested Next Steps
1. Reintroduce the legacy customer picker (search + create) or port it to Chakra Autocomplete while wiring `customerId` updates.
2. Restore inline designer creation or provide an explicit CTA that opens the add-designer modal.
3. Decide whether free-form lead source/type entry is still required; if so, use a creatable combobox.
4. Cover the regressions with integration tests around `sendFormDataToBackend` to ensure `customerId` and designer assignments persist.
