# Environment variables

This project reads configuration from environment variables on both the backend (Node/Express) and the frontend (Vite). Below are the variables added in Step 22 and how to use them.

## Backend (.env at repository root)

- CORS_ALLOWED_ORIGINS
  - Description: Comma-separated list of allowed origins for CORS.
  - Example: `CORS_ALLOWED_ORIGINS=https://app.njcontractors.com,http://localhost:3000,http://localhost:5173`
  - Default (if unset):
    - https://app.njcontractors.com
    - https://app.nj.contractors
    - http://app.nj.contractors
    - http://localhost:3000
    - http://localhost:3001
    - http://localhost:8080
    - http://localhost:5173

- PUBLIC_PROPOSAL_TOKEN_TTL_MIN
  - Description: Time-to-live in minutes for public proposal tokens (for future external acceptance links).
  - Example: `PUBLIC_PROPOSAL_TOKEN_TTL_MIN=1440` (24 hours)
  - Default: 1440

- UPLOAD_PATH
  - Description: Root directory for uploads served at `/uploads`. Used by manufacturer catalogs, logos, and resources.
  - Example: `UPLOAD_PATH=./uploads`
  - Default: `./uploads`

- RESOURCES_UPLOAD_DIR
  - Description: Directory for resources file uploads. If relative, resolved under project root. This is primarily for future customization; current implementation stores resources under `${UPLOAD_PATH}/resources` if you choose to wire it.
  - Example: `RESOURCES_UPLOAD_DIR=./uploads/resources`
  - Default: `./uploads/resources`

- NOTIFICATIONS_POLL_INTERVAL_MS
  - Description: Default polling interval (ms) for notifications if sockets are not used. Frontend can override via Vite var.
  - Example: `NOTIFICATIONS_POLL_INTERVAL_MS=15000`
  - Default: 15000

These values are parsed and exposed via `config/env.js` and used by server startup and middleware (CORS and uploads).

## Frontend (frontend/.env or system env prefixed with VITE_)

- VITE_API_URL
  - Base API URL.

- VITE_NOTIFICATIONS_POLL_INTERVAL_MS
  - Description: Client-side polling frequency for notification unread counts (ms).
  - Example: `VITE_NOTIFICATIONS_POLL_INTERVAL_MS=15000`
  - Default: 15000

- VITE_PUBLIC_PROPOSAL_TOKEN_TTL_MIN
  - Description: Optional client-side awareness of token TTL for external acceptance links (when implemented).
  - Example: `VITE_PUBLIC_PROPOSAL_TOKEN_TTL_MIN=1440`
  - Default: none (backend enforces TTL)

## Wiring summary

- Backend CORS: `config/env.js` parses `CORS_ALLOWED_ORIGINS`, consumed in `app.js`.
- Uploads: `UPLOAD_PATH` drives static serving (`/uploads`) and is used by `middleware/upload.js` and `middleware/uploadCatalogOnly.js` for consistent storage paths.
- Notifications poll: Default available as `NOTIFICATIONS_POLL_INTERVAL_MS` on backend; frontend uses `VITE_NOTIFICATIONS_POLL_INTERVAL_MS` and falls back to 15000.
- Proposal token TTL: Exposed by `config/env.js` as `PUBLIC_PROPOSAL_TOKEN_TTL_MIN` for future external acceptance endpoints.

## Examples

Backend .env (development):

PORT=8080
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=njcabinets_db
DB_PORT=3306
JWT_SECRET=dev-jwt-secret-change-in-production
NODE_ENV=development
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
UPLOAD_PATH=./uploads
RESOURCES_UPLOAD_DIR=./uploads/resources
PUBLIC_PROPOSAL_TOKEN_TTL_MIN=1440
NOTIFICATIONS_POLL_INTERVAL_MS=15000

Frontend (frontend/.env):

VITE_API_URL=http://localhost:8080
VITE_NOTIFICATIONS_POLL_INTERVAL_MS=15000
VITE_PUBLIC_PROPOSAL_TOKEN_TTL_MIN=1440

Notes:
- When deploying, set `CORS_ALLOWED_ORIGINS` to include your production app domain(s).
- Ensure the upload directory exists or is creatable by the Node process; middleware will create subfolders as needed.
