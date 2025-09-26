# Stripe Payments Integration — End‑to‑End Plan (Authoritative)

This document is the single source of truth for implementing Stripe payments using Payment Intents. It enumerates all components, exact changes, conventions, and acceptance criteria. Follow Microsoft Copilot instructions and our repo conventions.

Last updated: 2025-09-26
Owner: Payments/Orders

## Goals and scope

- Accept card payments via Stripe for each Order. Amount charged must match the Order grand total (including parts, assembly, modifications, delivery/shipping, discounts, and tax) using integer cents to avoid rounding errors.
- Use Stripe Payment Intents with webhooks as the source of truth for final status.
- Keep existing manual “Apply Payment” for checks/cash; Stripe is additive.

Out of scope (Phase 2): partial payments/deposits, refunds, surcharges, ACH.

## Architecture overview

- Source of truth for amount: `orders.grand_total_cents` and `orders.currency`.
- One `payments` row per order for Stripe (status lifecycle: pending → processing → completed/failed). Future: allow multiple rows for partials.
- Backend owns amount computation; frontend never supplies an amount.
- Webhook finalizes status transitions. Frontend polls on success/cancel if needed.

## Data model and migrations

Existing models:
- `models/Order.js` — has `grand_total_cents` (INT), `currency`, and snapshot.
- `models/Payment.js` — has `amount` (DECIMAL), `currency`, `status`, `transactionId`, `gatewayResponse`, `paidAt`, `createdBy`.
- `models/PaymentConfiguration.js` — active gateway, apiKey/webhookSecret, settings.

Required changes:
1) Payment (optional but recommended for integrity)
   - Add `amount_cents` (INT) mirror to ensure exact server-calculated integer amount used for Stripe.
   - Add `gateway` (ENUM: 'stripe', 'manual') default 'stripe' when creating Stripe payments; for checks/cash use 'manual'.
   - Add `receipt_url` (STRING) nullable.

2) PaymentConfiguration
   - Add `stripePublishableKey` (STRING). This value is safe to expose in public config.
   - Keep `apiKey` and `webhookSecret` server-only.

Conventions for migrations (per Copilot instructions):
- Place files under `scripts/migrations/` with timestamp prefix.
- Use Umzug/Sequelize signature: `async up(queryInterface, Sequelize)`, `async down(...)`.
- Use `Sequelize.DataTypes` from the parameter; check existence via `describeTable` before add/remove.
- Keep reversible and idempotent; do not import application models.

Migration files to add:
- `scripts/migrations/20250926-1300-payments-add-stripe-columns.js`
  - Up: add `amount_cents` (INT), `gateway` (ENUM), `receipt_url` (STRING) to `payments` if missing.
  - Down: remove those columns if they exist.
- `scripts/migrations/20250926-1310-payment-config-publishable-key.js`
  - Up: add `stripePublishableKey` (STRING) to `payment_configurations` if missing.
  - Down: remove column if exists.

## Backend changes

Packages: `stripe` (server). Use env `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.

1) Stripe client and config
- Create `services/stripeClient.js`:
  - Exports a configured Stripe instance with the secret key.
  - Validates presence of key at startup; warn in dev if missing.

2) Payment Intent endpoint
- New route: `POST /api/payments/:id/stripe-intent`
  - Auth: `verifyTokenWithGroup` + role scoping (contractors limited to their orders).
  - Steps:
    - Load Payment by id with include Order and scoping.
    - Determine `amount_cents` from `order.grand_total_cents` (fallback compute from `snapshot` if null) and `currency` from order (default 'USD').
    - If Payment has `transactionId` and intent is not succeeded/canceled, update amount if necessary (only if modifiable per Stripe rules) or create a fresh intent if required.
    - Create intent if needed: `paymentIntents.create({ amount, currency, automatic_payment_methods: { enabled: true }, metadata: { paymentId, orderId, order_number, user_id, group_id }, capture_method: config.settings?.capture || 'automatic' })`.
    - Save `transactionId = intent.id`, `status = 'processing'` (or keep 'pending' until confirmation).
    - Return `{ clientSecret: intent.client_secret }`.

3) Webhook endpoint
- New route: `POST /api/payments/stripe/webhook`
  - Use raw body parser. Verify signature: `stripe.webhooks.constructEvent(req.rawBody, sig, STRIPE_WEBHOOK_SECRET, toleranceSeconds)` with an explicit tolerance (e.g., 300s) to mitigate replay.
  - Handle events (allowlist only):
    - `payment_intent.succeeded`: set `status='completed'`, `paidAt = now()`, store subset of `gatewayResponse` and set `receipt_url` from latest charge if present.
    - `payment_intent.payment_failed`: set `status='failed'` and persist error message.
    - Ignore unrelated events.
  - Idempotency: persist processed Stripe event IDs (e.g., table `processed_webhook_events` with unique `stripe_event_id`) and short-circuit duplicates.
  - Validate linkage: ensure `intent.id` matches `payment.transactionId` and, when metadata present, that `metadata.paymentId` and `metadata.orderId` match our database records before applying updates.
  - Strict parsing: enforce POST method, JSON content-type, and a reasonable body size limit; do not log raw secrets or full payloads in production.
  - Return 200 quickly; all processing idempotent.

4) Payments manual apply remains
- Keep `PUT /api/payments/:id/apply` for checks/cash. Ensure it sets `gateway='manual'`.

5) Payment Config updates
- Extend `routes/paymentConfig.js` to accept `stripePublishableKey`; include it in `/api/payment-config/public` safe payload.
- Never expose `apiKey` and `webhookSecret` outside admin endpoints.

6) Amount integrity helper
- Add `utils/payments/amounts.js` with `getOrderAmountCents(order)` to compute from `grand_total_cents` or fallback snapshot. Include tiny rounding guards.

7) Permissions and errors
- Reuse existing scoping. Ensure 403 on unauthorized access, 404 on missing.
- Log with `order.order_number` and `payment.id` for trace.

## Frontend changes

Packages: `@stripe/stripe-js`, `@stripe/react-stripe-js`.

1) PaymentPage Stripe flow
- When `publicPaymentConfig.gatewayProvider === 'stripe'` and `stripePublishableKey` present:
  - Initialize Stripe with publishable key.
  - On mount or when pressing “Make Payment”: call `POST /api/payments/:id/stripe-intent` to fetch `clientSecret`.
  - Render `Elements` + `PaymentElement` (or `CardElement`), show amount summary (read-only from payment/order), and a Pay button.
  - On submit: `stripe.confirmPayment({ elements, clientSecret, confirmParams: { return_url: window.location.origin + '/#/payments/success?id=' + id } })`.
  - Disable button while processing; show errors inline.

2) Success/Cancel pages
- Read `id` from URL, dispatch `fetchPaymentById(id)`; if not completed, poll every 2–3s up to 30s.
- Show receipt link if `receipt_url` exists; otherwise “Print Receipt”.

3) PaymentsList/OrdersList integrations
- Keep “Make Payment” CTA; route to `/payments/:id/pay` which loads the Stripe flow.
- Display status badges: pending, processing, completed, failed.

## Configuration and environment

- Server env:
  - `STRIPE_SECRET_KEY` (required in prod)
  - `STRIPE_WEBHOOK_SECRET` (required in prod)
- Admin config (DB):
  - `stripePublishableKey` stored in `payment_configurations` and returned in public config.
  - `settings.capture` = 'automatic' | 'manual'.

## Logging and observability

- Log intent creation/update with `{ paymentId, orderId, order_number, amount_cents, currency }`.
- Log webhook events processed with event id and intent id.
- Avoid logging full card details; store only minimal `gatewayResponse` (pruned JSON).

## Security

- Do not accept amount from client.
- Verify Stripe webhook signature on raw body.
- Restrict `/stripe-intent` to users authorized for the order via existing scoping.
- Never expose secret key; publishable key only in public config.

### Webhook hardening (additional protections)

- Signature verification with timestamp tolerance (e.g., 300s). Reject stale events.
- Secret webhook path suffix: expose endpoint as `/api/payments/stripe/webhook/${STRIPE_WEBHOOK_PATH_TOKEN}`; keep token in env to reduce unsolicited hits.
- Allowlist event types: only process `payment_intent.succeeded` and `payment_intent.payment_failed` (and later specific refund events).
- Event idempotency store: create `processed_webhook_events` table; ignore repeats by `stripe_event_id` (unique).
- Linkage validation: cross-check `payment.transactionId === intent.id` and metadata `paymentId`/`orderId` before mutating state.
- Minimal logging: no PII or card data; never log signature header; truncate payloads.
- CSRF/CORS: not applicable to server-to-server; ensure no CORS preflight acceptance and only POST allowed.
- Body limits: set explicit size limits to prevent abuse.

## Testing plan

1) Unit/integration (backend)
- Amount helper returns exact cents and currency for a variety of order snapshots.
- Intent endpoint returns `clientSecret` and persists `transactionId`.
- Webhook transitions status to completed/failed; idempotent retries.

2) E2E (dev with test keys)
- Happy path: Accept proposal → Order created → Payment auto-created (pending) → Make Payment → Stripe test card 4242 → success page → status becomes completed.
- Failure path: Use a failed test card → status = failed.
- Manual apply path: Apply check in PaymentsList → completed with `gateway='manual'`.

3) Permissions
- Contractor can only pay for their orders; admin can pay any; unauthorized user 403.

4) Edge cases
- Order total changed before confirmation: allow creating a fresh intent or updating amount if possible; ensure only one active intent linked (prefer latest).
- Webhook arrives before frontend return: success page polls shows completed.
- Duplicate webhooks: ensure idempotent updates.
- Expired signature timestamp: send a test event with old timestamp; ensure 400 rejection.
- Unknown event type: ensure endpoint returns 200 with no side effect.

## Rollout plan

- Feature flag: enable Stripe only when config present and env keys set; otherwise fall back to existing flows.
- Migrate: run new migrations; seed config with test keys in dev.
- Deploy: add webhook endpoint to Stripe dashboard; test in staging; then prod.

## Tasks checklist (execution order)

1) Migrations
- [ ] Add `payments` columns: `amount_cents`, `gateway`, `receipt_url`.
- [ ] Add `stripePublishableKey` to `payment_configurations`.
- [ ] Add `processed_webhook_events` table with unique `stripe_event_id`, `type`, `received_at`, `processed_at`, optional `payment_id`.

2) Backend
- [ ] `services/stripeClient.js` with key validation.
- [ ] `utils/payments/amounts.js` helper.
- [ ] `POST /api/payments/:id/stripe-intent` endpoint.
- [ ] `POST /api/payments/stripe/webhook` with signature verification.
- [ ] Webhook hardening: event-type allowlist, timestamp tolerance, idempotency store, linkage validation, body size limit.
- [ ] Extend payment config routes to include publishable key in public payload.
- [ ] Ensure manual apply sets `gateway='manual'`.

3) Frontend
- [ ] Add Stripe libs and provider wiring in `PaymentPage.jsx`.
- [ ] Add Elements form and submit handling; show statuses and errors.
- [ ] Success/Cancel pages polling for final status; render receipt URL if present.
- [ ] Update PaymentsList/OrdersList buttons if any adjustments needed.

4) QA and docs
- [ ] Update `.github/instructions/copilot instruction.instructions.md` with Stripe endpoints, migration notes, and E2E expectations (explicit endpoints, filenames, etc.).
- [ ] Write a mini README section in this file with “Try it” steps and test cards.

## Acceptance criteria

- Creating an order auto-creates a pending payment (unchanged behavior).
- Clicking Make Payment launches a Stripe form and returns a `clientSecret` from server.
- Successful payment updates status to completed via webhook; payment shows transaction id and receipt link.
- Failed payment updates to failed; user sees a friendly message and can retry.
- Amount charged equals `orders.grand_total_cents / 100` exactly.
- No sensitive keys exposed to the client.

---

Appendix A — Minimal API contracts

- POST `/api/payments/:id/stripe-intent` → 200
  - Request: none (id in URL)
  - Response: `{ clientSecret: string }`

- POST `/api/payments/stripe/webhook` → 200
  - Raw body, Stripe signature header `stripe-signature`.

Appendix B — Env example

- STRIPE_SECRET_KEY=sk_test_...
- STRIPE_WEBHOOK_SECRET=whsec_...

Appendix C — References

- Stripe Payment Intents: https://stripe.com/docs/payments/payment-intents
- Webhooks: https://stripe.com/docs/webhooks
