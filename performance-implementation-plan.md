# Performance Remediation Implementation Plan

> Goal: Apply the recommended optimizations without altering user-facing logic or breaking existing behavior.

## Phase 0 ? Preparation
- [ ] Snapshot current key user journeys (proposal create/edit, manufacturer settings) via manual notes or existing e2e recordings.
  - Guardrails:
    - [ ] Capture baseline load times and network call counts with the browser devtools performance panel.
    - [ ] Export current `npm run build:analyze` output for bundle-size comparison after changes.
- [ ] Create an isolated feature branch or draft PR to keep changes reviewable.
  - Guardrails:
    - [ ] Confirm branch starts from latest `main` and contains no unrelated worktree changes (`git status` clean).

## Phase 1 ? Frontend Fetch & Render Optimizations
- [x] Refactor `EditProposal.jsx` effects and logging.
  - Guardrails:
    - [x] Memoize `userInfo`/`loggedInUser` with `useMemo` and ensure console debug statements are wrapped in `if (import.meta.env.DEV)` blocks.
    - [x] Replace `window.location.reload()` with state updates or router navigation and validate save/reject flows still mutate data correctly via backend responses.
    - [ ] Run regression walkthrough of proposal edit (load, switch versions, accept/reject) comparing network waterfall to baseline.
- [x] Tighten dependencies in `DesignUpload.jsx` style-fetch effect.
  - Guardrails:
    - [x] Ensure effect depends only on manufacturer id (manual search QA pass still pending).
    - [x] Add debounced fetch or reuse cached data (devtools confirmation pending to ensure the request only fires when manufacturer changes).
- [x] Cache manufacturer metadata in `ProposalSummary.jsx`.
  - Guardrails:
    - [x] Dispatch `fetchManufacturerById` only for ids missing in `manufacturers.byId`.
    - [ ] Confirm summary tab still shows manufacturer data and acceptance flow works (accept order path to `/orders`).
- [x] Defer heavy modal bootstrapping (`PrintProposalModal.jsx`, `EmailProposalModal.jsx`).
  - Guardrails:
    - [x] Introduce lazy import via React.lazy/Suspense (first-open latency validation still pending against baseline).
    - [ ] Validate PDF/email preview content matches pre-change output via screenshot or HTML diff.
- [x] Add table virtualization to `ItemSelectionContent.jsx`/`CatalogTable.js`.
  - Guardrails:
    - [x] Confirm selection, modification, and grouping interactions behave identically (see notes: virtualization preserves handlers, still recommend quick manual smoke).
    - [x] Verify cleanup of event listeners on modal close using React profiler or console warnings (hook tears down scroll/resize observers when disabled).
- [x] Stabilize tab configuration in `EditManufacturer.jsx` and `TypesTab.jsx`.
  - Guardrails:
    - [x] Wrap tab arrays/renderers in `useMemo`/`useCallback` and ensure tab switch retains form state.

## Phase 2 ? State Management Hardening
- [ ] Introduce per-id loading flags in `manufacturersSlice.js`.
  - Guardrails:
    - [ ] Preserve existing selectors and action signatures to avoid breaking consumers.
    - [ ] Add unit test or story that loads two manufacturers sequentially without flicker.
- [ ] Refine `selectedVersionSlice.js` to avoid wholesale array replacements.
  - Guardrails:
    - [ ] Ensure new actions maintain backward compatibility; add migration layer if API changes.
    - [ ] Use React DevTools to verify components receive updated props without extra renders (check render count).
- [ ] Adopt React Query hooks in proposal edit/create flows.
  - Guardrails:
    - [ ] Replace manual axios calls incrementally, confirming optimistic updates still reflect server truth after mutation settle.
    - [ ] Run existing proposal-related tests or smoke manual flows to confirm no logic drift.

## Phase 3 ? Backend & Database Improvements
- [ ] Replace ad-hoc `console.log` with leveled logger in `proposalsController.js`.
  - Guardrails:
    - [ ] Confirm production log level defaults to `info` and verbose debug output only appears when explicitly enabled.
    - [ ] Ensure request/response payload formats remain unchanged (inspect API contract tests if available).
- [ ] Add pagination to `getContracts` and `manufacturerController.fetchManufacturer` endpoints.
  - Guardrails:
    - [ ] Maintain backward compatibility by defaulting to existing behavior when pagination params absent, emitting deprecation notice.
    - [ ] Update frontend consumers to handle paginated responses before enabling strict limits.
- [ ] Tune Sequelize connection pool and enable SSL when applicable.
  - Guardrails:
    - [ ] Verify connection settings via application startup logs and DB metrics.
    - [ ] Coordinate with ops to ensure SSL certificates exist; fallback safely if env vars missing.
- [ ] Add DB indices for customer email lookups and proposal status queries.
  - Guardrails:
    - [ ] Apply migrations in staging first; measure query plans before/after with `EXPLAIN`.
    - [ ] Confirm no deadlocks or migration regressions in production-like dataset.
- [ ] Define archival strategy for large JSON columns.
  - Guardrails:
    - [ ] Prototype export of aged `manufacturersData` snapshots; confirm downstream consumers (reports, PDFs) still work with archived data.
    - [ ] Document retention policy and automation triggers.

## Phase 4 ? Tooling & Regression Safety Nets
- [ ] Automate Lighthouse + bundle-size checks in CI.
  - Guardrails:
    - [ ] Set thresholds relative to current baseline to avoid false positives; document override process.
- [ ] Emit Web Vitals telemetry.
  - Guardrails:
    - [ ] Ensure metrics collection respects user privacy and can be disabled via config.
- [ ] Enable DB slow-query logging temporarily to capture post-change metrics.
  - Guardrails:
    - [ ] Rotate logs and disable once acceptable baseline established.

## Verification & Rollout
- [ ] Run full unit/integration test suite plus targeted e2e flows (proposals, manufacturers, orders).
  - Guardrails:
    - [ ] Tests must pass locally and in CI before merging; investigate any regression promptly.
- [ ] Perform canary deployment or staged rollout with monitoring on proposal latency and error rates.
  - Guardrails:
    - [ ] Set up alerting thresholds; include rollback plan if metrics degrade.
