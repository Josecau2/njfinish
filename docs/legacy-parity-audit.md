# Legacy Parity Audit (master -> njnewui)

## Summary
- Compared current `njnewui` branch against `master` focusing on API surfaces, routing, auth flows, middleware, CORS configuration, and supporting infrastructure.
- Express route definitions are unchanged; backend behaviour differences come from controller refinements (CORS headers, content types) and a new data association (`catalog_data_id`).
- Frontend was rebuilt on Chakra UI + React Query. Route coverage matches legacy with one new marketing page (`/3d-kitchen`), but one new API call (`POST /api/payments/receipt`) has no backend counterpart.
- Additional migration scripts and dependencies were introduced; ensure they are applied in production to keep schema and tooling aligned with code expectations.

## Methodology
1. Enumerated repo differences with `git diff master..HEAD`, isolating backend (`routes`, `controllers`, `middleware`, `config`, `models`) and frontend (`App`, routing, store, API helpers) changes.
2. Generated route inventories programmatically for both branches to confirm parity of Express endpoints and React Router paths.
3. Extracted frontend API usage per branch to spot new/removed HTTP calls.
4. Reviewed auth/session helpers, CORS setup, upload controllers, and critical UI flows (proposals, payments, navigation) for behavioural changes.

## Backend Assessment
### Routes & Controllers
- Express routers under `routes/` are byte-identical to `master`; no endpoints were added or removed ([script-based diff](../routes/apiRoutes.js)).
- `controllers/resourcesController.js` now emits plain-text error responses, adds cache headers, and mirrors request origin in `Access-Control-Allow-Origin`, improving cross-origin image loads but altering response format.
- `controllers/uploadServeController.js` resolves paths via `req.path` instead of `req.params[0]` and adds best-effort `Content-Type` plus stronger caching for uploads.

### CORS & Security Headers
- `config/env.js` appends default allowed origins for `app.njcabinets.com`/`api.njcabinets.com`. Ensure `CORS_ALLOWED_ORIGINS` environment override still reflects deployed hosts.
- `app.js` only changed whitespace, so global middleware, auth hooks, and CSP remain aligned with legacy.

### Auth & Middleware
- `middleware/auth.js`, session refresh helpers, and protected-route checks are unchanged. Token handling, scope enforcement, and upload auth wrappers retain legacy behaviour.

### Data Model & Migrations
- `models/ProposalSectionItem.js` introduces optional `catalog_data_id` (with association in `models/index.js`). Migration script lives in `scripts/migrations/20251006-add-catalog-data-id-to-proposal-items.js`, but `migrations/` directory is untouched. Run the new script (or backfill an Umzug migration) before deploying to avoid NULL reference errors when code expects the column.
- `utils/subTypeValidation.js` now returns `{ allRequirements: [] }` and the validator expects populated `catalog_data_id`; this depends on the migration above.

### Utilities & Dependencies
- `utils/htmlSanitizer.js` enables `allowVulnerableTags=true` while keeping transforms; validate that this still satisfies security requirements.
- Root `package.json` gains Chakra-related tooling, Playwright tests, Stripe hooks, and monitoring scripts. Be sure production build/test workflows install new dependencies.

## Frontend Assessment
### Routing & Navigation
- Route list in `frontend/src/routes.js` matches legacy after formatting, with one deliberate addition: `/3d-kitchen` (new placeholder page). Dev-only audit router remains gated behind `import.meta.env.DEV`.
- Navigation logic (`frontend/src/_nav.js`) mirrors legacy permission gating, swaps icons for Lucide, and surfaces the new `/3d-kitchen` entry.

### API Consumption
- React Query-based hooks replace the Redux `proposalSlice`; core endpoints (`/api/get-proposals`, `/api/quotes/:id/status`, `/api/create-proposals`, etc.) are unchanged.
- **Parity gap:** `frontend/src/components/model/PrintPaymentReceiptModal.jsx` now posts to `/api/payments/receipt`, but no backend route exists. Legacy modal hit `/api/generate-pdf`, which still exists server-side. Implement the new endpoint or revert to the legacy call before release.
- All other “new” paths are string-literal variations of existing routes (variable name changes). Legacy calls to `/api/form/:id` (simple proposal updates) were removed; ensure the new create/update workflow still satisfies that use case.
- `/api/user-role/:id` lookup was dropped; navigation now trusts the authenticated user object. Confirm that backend-supplied user payload exposes the same role metadata for contract groups.

### Auth & Session Handling
- `axiosInstance.js`, `ProtectedRoute`, `PublicRoute`, and `SessionRefresher` keep prior logic (formatting only). App bootstrap (`frontend/src/index.jsx`) now wraps the tree in `QueryClientProvider`, `ChakraProvider`, and a custom theme derived from brand metadata.
- Session expiry toasts were moved out of `index.js`; ensure Chakra-based notifications cover the old SweetAlert UX.

### UI & State Management
- CoreUI dependency set replaced with Chakra UI, `framer-motion`, and supporting styling layers (`styles/reset.css`, `theme/index`). Verify that Chakra’s SSR/portal requirements align with existing Next/static hosting.
- Redux store dropped `proposalSlice`; proposals/payments now rely on TanStack Query mutations with optimistic updates. Confirm analytics or consumers of Redux state don’t expect the removed slice keys.

### Internationalisation & Assets
- Locale files (`frontend/src/i18n/locales/en.json`, `es.json`) were greatly expanded to support new UI copy and accessibility labels. Ensure translation workflows ingest the new keys.

## Parity Gaps & Risks
- **Missing backend support for `/api/payments/receipt`** - blocks the new receipt modal. Either wire an Express handler or revert to the legacy `/api/generate-pdf` call before merging.
- **Schema change requires deployment action** - run `scripts/migrations/20251006-add-catalog-data-id-to-proposal-items.js` (or port it into the official migration pipeline) prior to promoting the branch.
- **`allowVulnerableTags` sanitizer flag** - double-check with security stakeholders that enabling this does not reintroduce XSS vectors dismissed by legacy settings.
- **Navigation role lookup change** - dropping `/api/user-role/:id` assumes the user payload already has consistent role data. Validate contractor/employee role switches still populate correctly.
- **UI library swap** - Chakra requires different styling tokens and theming. Smoke-test all critical flows (proposals, orders, payments, settings) for regressions compared to CoreUI layouts.

## Recommendations
1. Implement or revert the `/api/payments/receipt` endpoint before release; add a regression test in `tests/modals.spec.js` to cover receipt downloads.
2. Promote the `catalog_data_id` migration into the authoritative migrations directory and schedule it for production rollout.
3. Review sanitizer changes with security, documenting the rationale for `allowVulnerableTags` and adding tests if necessary.
4. Run end-to-end parity tests (quotes, contracts, payments, settings) to confirm Chakra-based components didn’t drop legacy behaviours (focus traps, role gating, responsive layouts).
5. Update operational playbooks to include new dependencies (`@tanstack/react-query`, Chakra) and monitoring scripts (`dev:monitor`, Playwright suite).

