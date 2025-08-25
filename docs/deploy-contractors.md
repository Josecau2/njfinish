# Contractors Portal — Deploy Plan

This guide outlines the migration order, rollback strategy, environment variable updates, feature flag steps, smoke tests, and how to enable the first live contractor group.

## 1) Migrations and schema changes

Backend uses Sequelize models synced at runtime. If you run schema migrations manually, apply in this order. Each step is safe to re-run (idempotent) if using Sequelize `sync()` with `alter:false` but prefer explicit migrations in production.

Order:
1. Activity log table
   - Table: `activity_logs` with indexes on `(target_type,target_id)`, `action`, and `createdAt`.
   - Purpose: lightweight audit trail for key actions.
   - Rollback: `DROP TABLE activity_logs;`
2. Notifications table (if not already present)
   - Ensure columns: `recipient_user_id` (indexed), `type`, `title`, `message`, `payload` (JSON), `is_read` (boolean, default false), `read_at` (nullable), timestamps.
   - Indexes: `(recipient_user_id,is_read)`, `createdAt`, `type`.
   - Rollback: `DROP TABLE notifications;`
3. Optional performance indexes
   - Add composite index to notifications on `(recipient_user_id, is_read, createdAt)` if volume is high.
   - Rollback: `DROP INDEX <index_name> ON notifications;`

Notes:
- Models involved: `models/ActivityLog.js`, `models/Notification.js` (ensure present).
- The app boot (`app.js`) calls `sequelize.sync()`; when using explicit migrations, disable destructive sync and run migrations before deploy.

## 2) Environment variable updates

Add or confirm the following in backend `.env` (see `docs/env.md` for details and defaults):
- PORT=8080 (or target port)
- NODE_ENV=production
- JWT_SECRET=<strong random>
- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- CORS_ALLOWED_ORIGINS=https://app.njcontractors.com (plus staging/localhost if needed)
- UPLOAD_PATH=./uploads (ensure writable; persistent volume in prod)
- RESOURCES_UPLOAD_DIR=./uploads/resources
- PUBLIC_PROPOSAL_TOKEN_TTL_MIN=1440
- NOTIFICATIONS_POLL_INTERVAL_MS=15000

Frontend (Vite .env on hosting platform):
- VITE_API_URL=https://api.yourdomain.tld (or same origin proxy)
- VITE_NOTIFICATIONS_POLL_INTERVAL_MS=15000
- VITE_PUBLIC_PROPOSAL_TOKEN_TTL_MIN=1440

## 3) Feature flags and toggles

There are no dedicated flag libraries. Use these operational toggles:
- CORS allowlist: restrict via `CORS_ALLOWED_ORIGINS` to production app URLs only.
- Notifications polling frequency: adjust via envs above.
- Proposal acceptance rate limiting: built-in in-memory limiter; for multi-instance prod, consider switching to a shared store (e.g., Redis) before enabling heavy traffic.
- External acceptance links: not enabled yet; controlled by routing (no public route exposed). Keep `PUBLIC_PROPOSAL_TOKEN_TTL_MIN` ready.

Optional future flags:
- Admin notifications page route exposure in frontend navigation.
- Audit logging verbosity (use NODE_ENV to reduce logs in prod).

## 4) Deploy steps

1. Build frontend:
   - Install deps in `frontend/` and run a production build. Artifacts are served by Express from `frontend/build`.
2. Prepare database:
   - Back up database.
   - Apply migrations (ActivityLog, Notification) as above.
3. Provision uploads storage:
   - Ensure the directory for `UPLOAD_PATH` exists and is writable by the Node process.
   - Persist this path on a durable disk/volume.
4. Configure environment variables:
   - Set all variables from section 2.
5. Start backend:
   - Start Node with process manager (PM2, systemd, container) pointing to `index.js` or your server entry.
6. Verify health:
   - Hit `/api/notifications/unread-count` with a test user token.
   - Check static serving at `/uploads` for an existing sample file.

## 5) Rollback strategy

- Application rollback: redeploy previous build image/release.
- Database rollback: if a migration caused issues, drop newly added indexes/tables in reverse order. Always back up before running migrations.
- Config rollback: restore previous `.env` snapshot and redeploy.

## 6) Post-deploy smoke tests

Backend API (with a seeded admin token unless otherwise noted):
- Auth
  - Login succeeds and returns JWT.
- Customers
  - GET `/api/customers?page=1&limit=10` returns data.
- Proposals
  - POST `/api/create-proposals` creates a proposal for an existing or new customer.
  - GET `/api/proposals?page=1&limit=10` paginates without error.
  - POST `/api/proposals/{id}/accept` succeeds for a valid, sent proposal (check rate limiter not tripping on first attempt).
  - GET `/api/proposals/{id}/admin-details` loads detail.
- Notifications
  - GET `/api/notifications?unread_only=true` returns items.
  - POST `/api/notifications/mark-all-read` returns a success message and decreases unread count.
- Resources
  - GET `/api/resources/links` returns links.
- CORS
  - From the production frontend origin, calls succeed; from an unlisted origin, calls are blocked.

Frontend UI:
- Login works and routes to dashboard.
- Notifications bell shows an accurate unread count and updates after Mark all as read.
- Admin Notifications page lists items, filters work, empty states render.
- Contractor detail: Customers and Proposals tabs load with pagination and show empty states when applicable.
- Responsive check on mobile viewport for primary screens.

## 7) Enabling the first live contractor group

1. Create or verify the contractor group exists in DB.
2. Create admin and standard users for the group.
3. Assign modules/permissions as required (see user group controller).
4. Confirm group users can:
   - See only their group’s customers and proposals (group scoping enforced).
   - Create proposals and accept them.
5. Seed initial data if needed using the dev seed script (adapt for prod) to verify notifications and audit logging end-to-end:
   - Ensure a proposal is accepted (manually or via controlled test) to validate notifications.
6. Communicate production login URL and credentials securely to the group admin.

## 8) Observability and ops

- Logs: ensure production logging excludes PII; NODE_ENV=production suppresses verbose logs added in development.
- Rate limiting: in-memory limiter is per-process; scale-out requires a shared store.
- Backups: schedule regular DB backups, including uploads storage snapshots.
- Alerts: add simple health checks to `/api/notifications/unread-count` and login flow.

## 9) Troubleshooting

- CORS errors: verify `CORS_ALLOWED_ORIGINS` and check server log for “CORS blocked origin”.
- 429 Too Many Requests on accept: ensure tests are not retrying rapidly; tune limiter values or implement shared store.
- Missing uploads: verify `UPLOAD_PATH` exists and Node user has write permissions.
- Notifications empty: ensure admin users exist and that the acceptance event is emitting; see logs from `utils/eventManager.js`.
