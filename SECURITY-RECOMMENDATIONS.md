# Security Audit Report & Recommendations
**NJCabinets Application - Follow-up Security Assessment**

**Revision Date:** October 8, 2025
**Application Version:** AI-CONNECT v8.2.3
**Architecture:** Node.js/Express + React 19 (Vite) + MySQL
**Overall Risk Rating:** **MEDIUM-HIGH** (pending CSRF controls for the new cookie session model)

---

## Executive Summary
- Locked down previously open administrative APIs and the calendar feed with authentication/authorization guards (`routes/apiRoutes.js`).
- Eliminated the stored-XSS vector in the contracts modal by escaping proposal-derived HTML (`frontend/src/helpers/generateContractHtml.js`).
- Migrated session management to httpOnly cookies with secure defaults and added server-side logout support (`controllers/authController.js`, `middleware/auth.js`, `frontend/src/helpers/axiosInstance.js`).
- Client-side tokens are no longer persisted outside of memory; assets and uploads now rely on cookie authentication instead of query-string tokens.

---

## Resolved Findings
| ID | Description | Mitigation |
| --- | --- | --- |
| C-01 | Unauthenticated administrative APIs | All location/tax/collection/customization/designer routes now require `verifyTokenWithGroup` and explicit permissions (`routes/apiRoutes.js:245-292`, `routes/apiRoutes.js:419-450`). |
| C-02 | Unauthenticated calendar feed | `/api/calendar-events` now requires authentication (`routes/apiRoutes.js:517`). |
| H-01 | Stored XSS in contracts modal | Proposal fields are HTML-escaped before rendering (`frontend/src/helpers/generateContractHtml.js:3-11`, `frontend/src/helpers/generateContractHtml.js:145-151`). |
| H-02 | Tokens in web storage | Login issues httpOnly cookies, refresh paths roll the cookie, and client storage of JWTs has been removed (`controllers/authController.js:83-111`, `middleware/auth.js:31-136`, `frontend/src/helpers/axiosInstance.js`). |

---

## Remaining Items

### M-01 CSRF Strategy (following cookie migration)
With sessions now stored in cookies, state-changing requests should be protected with CSRF tokens. SameSite `strict` cookies reduce exposure, but implement `csurf`/double-submit to harden forms and AJAX endpoints.

### M-02 Binary Upload Controls
Attachment and image uploads still depend on Multer's MIME checks. Consider adding file-type validation (e.g., `file-type` library) and antivirus scanning for catalog files.

### M-03 Query Token Fallback Decommissioning
`attachTokenFromQuery` still loads bearer tokens from URL parameters, which undermines the move to cookies and risks leaking tokens via logs and referers (`middleware/auth.js:26-68`). Plan to sunset the query-string shim after verifying that all entry points use cookie auth.

### M-04 Password Reset Token Hardening
Password reset flow persists the raw reset token in the database and matches it verbatim during reset, so a database leak hands attackers valid reset links (`controllers/authController.js:217-276`). Store a hashed selector/token pair instead, expire older tokens, and add reuse detection.

### L-01 Session Indicator Cookie Scope
To help the SPA detect login state, `setAuthCookies` issues a second cookie that is not `httpOnly`, keeping it readable to injected scripts (`utils/authCookies.js:45-55`). Prefer a short-lived `/auth/session` probe or a signed, opaque flag so XSS payloads do not gain another credential surface.

---

## Remediation Checklist
| Priority | Task | Status | Notes |
| --- | --- | --- | --- |
| P0 | Secure unauthenticated admin routes | ✅ Completed | `routes/apiRoutes.js:245-292`, `routes/apiRoutes.js:419-450` |
| P0 | Protect calendar feed | ✅ Completed | `routes/apiRoutes.js:517` |
| P0 | Sanitize contract HTML rendering | ✅ Completed | `frontend/src/helpers/generateContractHtml.js:3-11` |
| P0 | Move JWT handling to httpOnly cookies | ✅ Completed | `controllers/authController.js:83-111`, `middleware/auth.js:31-188`, `frontend/src/helpers/axiosInstance.js` |
| P1 | Define/implement CSRF mitigation | ◻ Pending | Adopt token-based CSRF once cookie sessions are live |
| P1 | Harden upload validation | ◻ Pending | Add deep MIME/extension checks and optional AV scanning |
| P1 | Retire query-string token fallback | ◻ Pending | Disable `attachTokenFromQuery` once cookie sessions stabilize (`middleware/auth.js:26-68`) |
| P1 | Hash password reset tokens at rest | ◻ Pending | Persist a hashed selector/token combo and rotate on use (`controllers/authController.js:217-276`) |
| P2 | Replace client-visible session flag cookie | ◻ Pending | Expose an `/auth/session` probe and drop the non-httpOnly flag (`utils/authCookies.js:45-55`) |

---

## Monitoring & Incident Response
- Instrument structured auth success/failure logs with correlation IDs for SIEM ingestion (`controllers/authController.js:57-186`, `middleware/auth.js:83-203`).
- Alert on repeated upload validation failures to spot probing of Multer filters (`middleware/upload.js:23-77`).
- Capture password reset issuance and consumption events so responders can trace account takeover timelines (`controllers/authController.js:208-279`).

## Positive Controls Observed
- Strong default security headers, including nonce-based CSP (`app.js:32-68`).
- Rate limiting on high-risk auth endpoints (`routes/apiRoutes.js:61-116`).
- Sanitisation middleware applied to state-changing routes (`routes/apiRoutes.js`).

---

## Next Review
Re-evaluate once CSRF protections and upload hardening ship. Monitor cookie-based sessions in staging to confirm browser compatibility (especially cross-subdomain traffic) and ensure logout flows clear cookies as expected.



