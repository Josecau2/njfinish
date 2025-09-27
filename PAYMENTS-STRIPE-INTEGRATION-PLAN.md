# Stripe Payments Integration - End-to-End Plan (Authoritative)

This document is the single source of truth for implementing Stripe payments using Payment Intents. It enumerates all components, exact changes, conventions, and acceptance criteria. Follow Microsoft Copilot instructions and our repo conventions.

Last updated: 2025-09-27
Owner: Payments/Orders

## Goals and scope

- Accept card payments via Stripe for each Order. Amount charged must match the Order grand total (parts, assembly, modifications, delivery/shipping, discounts, tax) using integer cents to avoid rounding errors.
- Use Stripe Payment Intents with webhooks as the source of truth for the final payment status; frontends only reflect what the backend already knows.
- Keep existing manual "Apply Payment" flow for checks/cash; Stripe support is additive and must coexist.
- Provide auditable, idempotent server-side payment handling with minimal sensitive data exposure.

Out of scope (Phase 2): partial payments/deposits, refunds, surcharges, ACH, subscription billing, invoice-based flows.

## Current system assessment

- `Payment.amount` is stored as `DECIMAL(10,2)` and computed in multiple places (Order hook, manual create UI), which risks drift against Stripe’s integer amounts.
- Orders auto-create a single pending payment after acceptance, but the hook divides cents into dollars (`grand_total_cents / 100`), losing source precision (models/Order.js:164).
- The payment page renders an arbitrary embed snippet and manually calls `updatePaymentStatus` to mark Stripe payments complete (frontend/src/pages/payments/PaymentPage.jsx:51,88).
- `/api/payments` exposes manual status updates and a generic webhook endpoint that trusts arbitrary JSON and lacks Stripe signature validation (routes/payments.js:233,273).
- Payment configuration stores an `embedCode` and `gatewayUrl`; there is no notion of publishable key, feature flag, or different handling per gateway (routes/paymentConfig.js:20).
- Stripe SDK is installed in both workspaces, but there is no shared client helper, raw webhook parsing, or Elements integration.

## Target architecture overview

- Source of truth for Stripe charge amount: `orders.grand_total_cents` and `orders.currency`. All downstream code uses integer cents.
- One Stripe-backed `payments` row per order in Phase 1. `payments.gateway` distinguishes Stripe vs manual entries (future phases can allow multiple rows).
- Backend owns amount computation and generates/updates Payment Intents. Frontend never supplies an amount.
- Webhooks finalize payment status transition (`completed` or `failed`). Frontend polls or subscribes to updates; no optimistic success writes.
- Manual “Apply Payment” is limited to `gateway='manual'` rows to prevent bypassing Stripe for card payments.

## Data model and migrations

Conventions: Place migrations in `scripts/migrations/` with timestamp prefix. Use Umzug/Sequelize signatures (`async up/down`). Use `describeTable` guards so migrations are idempotent and reversible. Do not import models inside migrations; use `queryInterface` and `Sequelize.DataTypes`.

### Payments table adjustments

Create `scripts/migrations/20250927-1300-payments-add-stripe-columns.js`:
- Up:
  - Add `amount_cents` (INTEGER, allowNull false) defaulting to 0, then backfill from existing `amount` (`Math.round(amount * 100)`).
  - Add `gateway` (ENUM: `['stripe', 'manual']`, default `'manual'`). Backfill existing rows to `'manual'` except those with `transactionId`/`gatewayResponse` matching Stripe markers once we migrate data (safe assumption: mark `'manual'` initially and update when Stripe intent is created).
  - Add `receipt_url` (STRING) nullable.
  - Ensure a partial index or composite index for `(gateway, status)` to speed up list filters.
- Down: drop `receipt_url`, `gateway`, `amount_cents`. Clean up ENUM definitions (MySQL requires manual `DROP TYPE` equivalent if needed).

### Payment configuration adjustments

Create `scripts/migrations/20250927-1310-payment-config-add-publishable-key.js`:
- Up: add `stripePublishableKey` (STRING, allowNull true) to `payment_configurations`.
- Down: remove the column.

### Webhook idempotency table

Create `scripts/migrations/20250927-1320-processed-webhook-events.js`:
- Table: `processed_webhook_events`
  - `id` INT PK, `stripe_event_id` STRING unique, `type` STRING, `payment_id` INT NULL FK to `payments`, `received_at` DATETIME default now, `processed_at` DATETIME nullable, `payload` JSON/TEXT (truncated), timestamps.
- Add unique index on `stripe_event_id`.
- Down: drop table.

### Model updates after migrations

- Update `models/Payment.js` to expose `amount_cents`, `gateway`, `receipt_url`. Keep `amount` but treat it as read-only/coerced from cents.
- Adjust `Order` `afterCreate` hook to set both `amount_cents` and `amount` (derived from cents) when auto-creating payments (models/Order.js:164).
- Ensure serializers (`routes/payments.js`, `frontend/src/store/slices/paymentsSlice.js`) return both `amount` and `amount_cents` for backward compatibility.

## Backend changes

### Stripe client and environment

- Add `services/stripeClient.js` exporting a configured Stripe instance. Validate `STRIPE_SECRET_KEY` at startup; throw in production if missing, warn in dev.
- Update `.env.example` with `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`, optional `STRIPE_WEBHOOK_PATH_TOKEN`, and `STRIPE_WEBHOOK_TOLERANCE_SECONDS` (default 300).
- Update config loaders to surface `stripe.publishableKey` to clients only via dedicated public endpoint.

### Payment amount helper

- Create `utils/payments/amounts.js` with helpers:
  - `getOrderAmountCents(order)` -> { amount_cents, currency }
  - `formatCents(amount_cents)` -> decimal for display (backend only).
  - Functions must handle orders missing `grand_total_cents` by recomputing from snapshot fallback; add tests.

### Routes and controllers

- Refactor `/api/payments` routes:
  - Restrict `PUT /:id/status` to non-Stripe gateways. For Stripe payments, respond 409 with guidance.
  - Ensure listing endpoints include `gateway`, `amount_cents`, `receipt_url`, and only expose sanitized `gatewayResponse` (prune card data).

- New route `POST /api/payments/:id/stripe-intent`:
  - Auth: `verifyTokenWithGroup` + scoping: contractors limited to their orders; admins/staff as today.
  - Steps:
    1. Load payment + order using associations.
    2. Verify `gateway === 'stripe'` (upgrade existing pending payments during migration step when Stripe is enabled).
    3. Compute final { amount_cents, currency } via helper. If amount differs from stored `amount_cents`, update payment (keeping historical `amount` in sync).
    4. If `transactionId` exists, fetch existing intent. Update amount if allowed (by checking `amount_capturable` constraints); otherwise create a new intent and supersede the previous one (store old id in metadata or event log).
    5. Create/confirm Payment Intent with `automatic_payment_methods: { enabled: true }`, metadata containing `paymentId`, `orderId`, `order_number`, `user_id`, `group_id`.
    6. Persist: `transactionId`, `status = 'processing'` (or `pending` until webhook?), `gateway = 'stripe'`, `amount_cents` synced, `amount` derived, `gateway='stripe'`.
    7. Return `{ clientSecret, publishableKey }`.

- Webhook endpoint `POST /api/payments/stripe/webhook/:token?`:
  - Mount before `express.json()` using `express.raw({ type: 'application/json' })` (app.js adjustment).
  - Verify Stripe signature with configured tolerance and optional path token check.
  - Allowlist event types: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded` (future), others ignored but logged at debug.
  - Enforce idempotency using `processed_webhook_events` table.
  - Validate linkage: ensure `intent.id === payment.transactionId` and metadata IDs match; reject otherwise.
  - On success: update `status='completed'`, `paidAt=now`, `receipt_url` from latest charge receipt, persist a trimmed `gatewayResponse` (e.g., `id`, `status`, `charges[0].id`, `charges[0].receipt_url`, `charges[0].balance_transaction`).
  - On failure: update `status='failed'`, capture `last_payment_error.message`.
  - Return 200 for processed/ignored events. Surface `Stripe-Signature` errors as 400 without leaking secret values.

- Manual apply endpoint (`PUT /:id/apply`):
  - Require `gateway === 'manual'`. If Stripe, respond 409 instructing to retry card payment.
  - Ensure manual completion sets `paymentMethod` (check/cash/etc.), `gateway='manual'`.

- Payment creation (admin UI `POST /api/payments`):
  - When Stripe is active, default `gateway='stripe'`, set `amount_cents` via helper. For manual flows, allow `gateway='manual'`.
  - Validate duplicates: one pending Stripe payment per order.

- Public config endpoint `/api/payment-config/public`:
  - Return `publishableKey`, `gateway='stripe'`, feature flag for “card payments enabled”. Do not return `embedCode` for Stripe; embed code remains for legacy fallback until removed.
  - Update admin config endpoints to store secret key + webhook secret server-side only, publishable key separately.

### Middleware and setup

- Modify `app.js` to mount the Stripe webhook route with raw body parsing before global JSON middleware (app.js:44).
- Add health check/logging around Stripe key availability during startup; fail fast in production if misconfigured.
- Consider adding background job or cron (future) to reconcile failed/pending intents; document as post-MVP note.

## Frontend changes

- Install/use `@stripe/react-stripe-js` and `@stripe/stripe-js` (already in dependencies) to build UI.
- Add a global Stripe wrapper in `frontend/src/App.js` (or dedicated payment page) that loads `stripePublishableKey` via new public config endpoint before rendering payment UI.
- Replace embed snippet in `PaymentPage.jsx` with Stripe Elements form:
  - Fetch payment + config on load.
  - Call `POST /api/payments/:id/stripe-intent` to obtain client secret.
  - Render Elements (`PaymentElement` or CardElement) with submit button.
  - On submit, confirm payment using `stripe.confirmPayment` and handle errors (declines, authentication).
  - After confirmation success, show a spinner while polling `/api/payments/:id` until status is `completed` (or max retries). Display `receipt_url` link when present.
  - Move inline global handlers (`window.handlePaymentSuccess`) to React stateful flows; remove script injection.

- Update `PaymentsList.jsx` and related components:
  - Display `gateway` badges (Stripe/manual).
  - Show formatted amount using `amount_cents` where available.
  - Hide “Apply” action for Stripe payments; show “Make Payment” only when `gateway==='stripe'` and `status==='pending'`.

- Add success/cancel pages that poll payment detail and show final status, receipt, and order summary.
- Update localization keys (en/es) for new strings (gateway labels, card errors, Stripe instructions).

## DevOps & configuration

- Document new environment variables in `.env.example` and deployment guides.
- Update infrastructure/playbooks to register the webhook endpoint path (with optional secret suffix) in Stripe Dashboard.
- Ensure production secrets are stored securely (e.g., Azure Key Vault, AWS Secrets Manager) and injected at runtime.
- Consider feature flag (ENV `STRIPE_ENABLED=true`) preventing frontend from offering card payment until config complete.

## Security hardening

- Strictly verify Stripe signatures against raw request body with tolerance (reject stale events).
- Secret webhook path suffix to reduce unsolicited hits (`/api/payments/stripe/webhook/${token}`).
- Allowlist Stripe IPs only if feasible (optional future enhancement).
- Store only minimal gateway metadata; truncate logs to avoid PII/PAN leakage.
- Ensure manual status update endpoints enforce gateway checks and audit logging (who applied manual payment).
- Add rate limiting to intent creation endpoint (per user/order) to prevent abuse.
- Ensure CSRF coverage remains unaffected; all new endpoints use JWT auth or secret tokens.

## Testing plan

### Automated

- Unit tests for `utils/payments/amounts.js` covering various order snapshots (complete data, missing fields, rounding).
- Integration tests for `POST /api/payments/:id/stripe-intent` (mock Stripe SDK) verifying amount sync, metadata, idempotency when amount changes, permission scoping.
- Integration tests for webhook handler: success, failure, signature mismatch, duplicate event.
- Tests ensuring manual apply rejects Stripe payments and still works for manual ones.
- Tests for public config endpoint to ensure publishable key exposure only when set.

### Manual / E2E (using Stripe test keys)

- Happy path: Accept proposal -> Order created -> Payment auto-created (pending, gateway=stripe) -> `Make Payment` -> pay with 4242 card -> webhook sets status completed -> UI shows receipt link.
- Decline path: use `4000 0000 0000 9995` (insufficient funds) -> webhook marks failed -> UI surfaces friendly retry message.
- 3DS path: use `4000 0027 6000 3184` to confirm authentication flow works.
- Manual apply path: mark payment as manual, ensure check/cash flow still works and UI disables card-specific controls.
- Permission checks: contractor only sees their group’s payments, cannot fetch others’ client secrets.
- Resilience: change order total before payment confirmation; intent recalculates amount or issues new intent.
- Webhook replay: resend event via Stripe CLI to verify idempotency table prevents duplicate status changes.

## Rollout plan

1. Ship migrations and model updates behind feature flag (`STRIPE_ENABLED`).
2. Deploy backend with new endpoints (intent, webhook, config) and config gating (flag false by default).
3. Configure Stripe secrets in non-prod; run integration tests using Stripe CLI.
4. Enable flag in staging; run E2E flows (success, failure, manual apply).
5. Register production webhook endpoint and secrets.
6. Enable flag in production after sanity checks; monitor logs/events closely for first transactions.
7. Post-launch: schedule reconciliation job (Phase 2) and consider partial payment support.

## Tasks checklist

### Migrations
- [x] Add `amount_cents`, `gateway`, `receipt_url` columns and backfill.
- [x] Add `stripePublishableKey` to `payment_configurations`.
- [x] Create `processed_webhook_events` table.

### Backend
- [x] Implement `services/stripeClient.js` and config validation.
- [x] Add `utils/payments/amounts.js` with tests.
- [x] Update `models/Payment.js` and `models/Order.js` hooks.
- [x] Refactor `/api/payments` routes for Stripe intent, webhook, and manual apply restrictions.
- [x] Ensure app mounts webhook route with raw body parser and tolerances.
- [x] Update payment config routes to handle publishable key + feature flag.

### Frontend
- [x] Wire Stripe Elements provider and load publishable key.
- [x] Replace payment embed with Elements flow and status polling.
- [x] Update lists/detail components to handle `gateway`, `amount_cents`, `receipt_url`.
- [x] Refresh translations and UX copy for Stripe flows.

### QA & documentation
- [x] Capture `npm run test:payments` helper script for regression checks (see Appendix D step 6).
- [x] Document Stripe environment variables in `.env.example` and Appendix B.
- [ ] Update `.github/instructions/copilot instruction.instructions.md` with Stripe endpoints, migrations, testing expectations.
- [x] Add a "Try it" section with test cards and Stripe CLI commands to this file (Appendix D).
- [ ] Document environment setup/rollback steps for operations.

## Acceptance criteria

- Orders with `grand_total_cents` auto-create a Stripe payment (pending, correct `amount_cents`, `gateway='stripe'`).
- `POST /api/payments/:id/stripe-intent` returns a client secret and publishable key, persists transaction id, and enforces access control.
- Successful Stripe payments transition to `completed` via webhook; payment row stores `transactionId`, `receipt_url`, `gatewayResponse` (redacted).
- Failed Stripe payments transition to `failed`; UI shows retry guidance and does not auto-complete.
- Manual apply remains functional for `gateway='manual'` payments; Stripe payments cannot be manually marked complete.
- No sensitive keys appear in client responses or logs.
- Duplicate webhooks are ignored without side effects.

---

Appendix A – Minimal API contracts

- `POST /api/payments/:id/stripe-intent` -> 200 `{ clientSecret: string, publishableKey: string }`
- `POST /api/payments/stripe/webhook/:token?` -> 200 (raw JSON body, Stripe signature header `stripe-signature`)
- `GET /api/payment-config/public` -> 200 `{ gatewayProvider: 'stripe', publishableKey: string, cardPaymentsEnabled: boolean }`

Appendix B – Environment variables

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_WEBHOOK_PATH_TOKEN=stripeWebhook123   # optional extra path segment
STRIPE_WEBHOOK_TOLERANCE_SECONDS=300
STRIPE_ENABLED=true
```

Appendix C – References

- Stripe Payment Intents: https://stripe.com/docs/payments/payment-intents
- Webhooks: https://stripe.com/docs/webhooks
- Stripe test cards: https://stripe.com/docs/testing

Appendix D – “Try it” flow (non-prod)

1. Export keys: `stripe listen --forward-to localhost:3000/api/payments/stripe/webhook/<token>`.
2. Accept a proposal to create an order/payment (use seeded data if needed).
3. Navigate to `/payments`, click “Make Payment”, run a test card (`4242 4242 4242 4242`).
4. Observe webhook log, verify payment row status `completed`, and confirm receipt link renders in UI.
5. Trigger a failure (`4000 0000 0000 9995`) to validate error handling.
6. Run `npm run test:payments` to validate payment amount utilities.
