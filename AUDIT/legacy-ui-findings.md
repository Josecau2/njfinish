# Legacy UI Audit Findings

## Scope
- Reviewed the React frontend and supporting assets to flag any UI codepaths still relying on CoreUI, Bootstrap-era classes, or non-Chakra component libraries.

## CoreUI / Bootstrap Leftovers
- `legacy_LeadsPage.jsx:25` keeps the legacy CoreUI view alive with imports from `@coreui/react`; related icon packages remain in `legacy_LeadsPage.jsx:26` and `legacy_LeadsPage.jsx:27`.
- Bootstrap utility classes persist throughout the legacy Leads modal (e.g. `legacy_LeadsPage.jsx:363`, `legacy_LeadsPage.jsx:641`, `legacy_LeadsPage.jsx:711`).
- `frontend/src/scss/examples.scss:3`, `frontend/src/scss/examples.scss:6`, and `frontend/src/scss/examples.scss:7` still @use CoreUI Sass variables and mixins.

## Third-Party UI Dependencies Outside Chakra
- `frontend/src/components/AppSidebarNav.js:5`, `frontend/src/components/AppSidebarNav.js:6`, and `frontend/src/components/AppSidebarNav.js:437` rely on `simplebar-react` for sidebar scrolling.
- Creatable React Select remains wired in proposal creation (`frontend/src/pages/proposals/CreateProposal/CustomerInfo.jsx:5`, `frontend/src/pages/proposals/CreateProposal/ManufacturerSelect.jsx:4`, `frontend/src/pages/proposals/CreateProposal/ProposalSummary.jsx:38`).
- DatePicker styling persists (`frontend/src/pages/proposals/CreateProposal/ProposalSummary.jsx:41`, `frontend/src/pages/proposals/CreateProposal/ProposalSummary.jsx:49`, `frontend/src/pages/proposals/EditProposal.jsx:13`).
- SweetAlert2 is still used for modals/alerts (`frontend/src/pages/admin/LeadsPage.jsx:9`, `frontend/src/pages/settings/users/CreateUser.jsx:10`, `frontend/src/pages/proposals/Proposals.jsx:9`).
- FullCalendar remains a dependency for scheduling (`frontend/src/pages/calender/index.jsx:3`, `frontend/src/pages/calender/index.jsx:4`, `frontend/src/pages/calender/index.jsx:5`, `frontend/src/pages/calender/index.jsx:6`).

## Global CSS Pipeline & Legacy Stylesheets
- Entry point still loads layered CSS bundles before Chakra mounts (`frontend/src/index.jsx:8`, `frontend/src/index.jsx:9`, `frontend/src/index.jsx:10`, `frontend/src/index.jsx:11`, `frontend/src/index.jsx:12`, `frontend/src/index.jsx:13`).
- `frontend/src/main.css` (1065 lines) and `frontend/src/responsive.css` (3289 lines) carry broad overrides and Bootstrap-era selectors.
- Component-scoped styles such as `frontend/src/components/AppSidebar.module.css` (250 lines) and `frontend/src/components/ItemSelectionContent.css` (106 lines) remain tightly coupled to class-based markup.
- Zero-byte or unused remnants (`frontend/src/luxury-dashboard.css`, `frontend/src/njcabinets-theme.css`) are still present alongside numerous backup snapshots (e.g. `frontend/src/responsive.css.backup-phase8`).

## Class-Based Markup Hotspots
- Layout containers still use Bootstrap classes (`frontend/src/components/PaymentModal.jsx:8`, `frontend/src/pages/proposals/ProposalEditor.jsx:6`, `frontend/src/pages/quotes/Create/CreateQuote.jsx:5`).
- Public proposal flow mixes Chakra and Bootstrap badges (`frontend/src/pages/public/PublicProposalPage.jsx:81`, `frontend/src/pages/public/PublicProposalPage.jsx:93`, `frontend/src/pages/public/PublicProposalPage.jsx:101`, `frontend/src/pages/public/PublicProposalPage.jsx:114`).
- Catalog tooling leans on legacy class hooks (`frontend/src/components/CatalogTableEdit.js:286`, `frontend/src/components/CatalogTableEdit.js:288`, `frontend/src/components/CatalogTableEdit.js:319`, `frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx:2230`, `frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx:2540`).
- Settings dashboards continue to style via custom classes (`frontend/src/pages/settings/users/UserList.jsx:130`, `frontend/src/pages/settings/users/UserList.jsx:166`, `frontend/src/pages/settings/users/UserList.jsx:181`, `frontend/src/pages/settings/globalMods/GlobalModsPage.jsx:439`, `frontend/src/pages/settings/globalMods/GlobalModsPage.jsx:473`).

## Other Observations
- The legacy CoreUI implementation of leads persists as a 784-line file (`legacy_LeadsPage.jsx`).
- Numerous backup CSS snapshots (e.g. `frontend/src/responsive.css.backup`, `frontend/src/responsive.css.backup-phase5`, `frontend/src/responsive.css.backup-phase8`) remain in the repository and can be pruned once conversions are complete.

## Recommended Next Steps
1. Retire `legacy_LeadsPage.jsx` after confirming the Chakra rewrite covers all use cases, then uninstall remaining `@coreui/*` packages.
2. Replace third-party UI widgets (SweetAlert2, React Select, React DatePicker, SimpleBar) with Chakra-native patterns or internal components to reduce redundant styling systems.
3. Migrate the highlighted class-based layouts to Chakra primitives, allowing removal of the associated CSS modules and Bootstrap utility dependencies.
4. Consolidate or delete unused CSS bundles and historical backups to shrink the surface area for regression risk and simplify future audits.
