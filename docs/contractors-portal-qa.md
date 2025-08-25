# Contractors Portal — Manual QA Checklist

Use this checklist to verify the contractors portal end-to-end. Check items as you confirm behavior in both UI and API. Prepare an Admin test user and at least two Contractor users in different groups, each with a few customers and proposals (one accepted, one pending).

## Smoke/setup
- [ ] Backend runs with correct env (DB, JWT, CORS). Frontend builds and serves.
- [ ] Seed or create: Admin user; Contractor A (Group A); Contractor B (Group B); a few customers per group; proposals associated to each group/customer.

## 1) Contractor sees only own customers and proposals
UI
- [ ] Log in as Contractor A. Customers page shows only Group A customers.
- [ ] Proposals page shows only Group A proposals.
- [ ] Attempt to open a Customer/Proposal detail URL that belongs to Group B → should show 403 or 404 (no data leaks).
API
- [ ] With Contractor A token, GET /api/customers and /api/proposals only return Group A records.
- [ ] With Contractor A token, GET a specific Group B customer/proposal → 403/404.

## 2) Admin sees all contractors and can drill-down
- [ ] Log in as Admin. Open Admin → Contractors list; all contractor groups are visible.
- [ ] Open a Contractor detail. Tabs/sections show that group’s customers and proposals.
- [ ] Counts match what that contractor sees; you can open any customer/proposal across groups.

## 3) Proposal acceptance notifies admin; bell shows unread count
- [ ] Trigger acceptance of a Contractor’s proposal (via public accept or admin action if supported).
- [ ] As Admin, bell badge increments (unread count > 0) and item appears in Admin → Notifications.
- [ ] From the bell dropdown, mark item read → unread count decreases accordingly.
- [ ] From Admin → Notifications, Mark All Read updates both the page and bell count to 0.

## 4) Module toggles hide/show features instantly
Setup
- [ ] As Admin, open a Contractor group and toggle modules (e.g., disable Proposals or Customers).
UI/UX
- [ ] As the Contractor, refresh: related nav items disappear; routes blocked when visited directly.
- [ ] Re-enable modules → items reappear without errors.
API
- [ ] Endpoints behind disabled modules reject access (401/403) for the contractor.

## 5) Mobile views render properly
- [ ] Using browser devtools mobile device emulation (≤ 576px), Customers/Proposals/Contractors screens collapse tables into card lists with readable content.
- [ ] Dropdowns, buttons, and checkboxes are touch-friendly (no overlap; adequate spacing).
- [ ] Full-screen modals behave correctly on small screens (no clipped content; scroll works).

## 6) Legacy proposals remain accessible; new fields safe
- [ ] Identify older proposals created before recent changes. As Admin, open/detail them without runtime errors.
- [ ] Any newly added fields render with safe defaults (no undefined/null crashes).
- [ ] Create a new proposal; save flows succeed; lists and details display both old and new proposals consistently.

## 7) No unauthorized data access via API
- [ ] Without a token, protected endpoints return 401.
- [ ] With a Contractor token, admin-only endpoints (e.g., /admin/* or admin-scoped APIs) return 403.
- [ ] With Contractor A token, attempts to fetch Group B data return 403/404 and do not leak fields in error bodies.
- [ ] Pagination parameters and filters cannot be abused to access cross-group data.

## 8) No regression to internal admin flows
- [ ] Admin settings pages (Users, Groups, Manufacturers, Locations, Taxes, Customization) all load and save edits.
- [ ] Existing admin proposal/customer workflows still function (create, edit, delete with permissions).
- [ ] Global nav, breadcrumbs, and page routing remain intact.

## 9) Admin Notifications page (/admin/notifications)
- [ ] Page loads for Admin with pagination and shows notifications list.
- [ ] Filters work: All, Unread, Read, and Type filter (e.g., proposal_accepted, system).
- [ ] Mark as read on a single item updates the list without reload; mark all read clears unread items.
- [ ] Unread count in the bell matches the unread count displayed on the page.

## 10) Performance and UX sanity
- [ ] Lists are paginated; loading indicators appear during fetch.
- [ ] No obvious N+1 slowness in large lists; navigation stays responsive.

## 11) Security and logging (optional but recommended)
- [ ] Activity/Audit entries are created for key actions (e.g., proposal accepted, create/update customer), if logging is enabled.
- [ ] No sensitive fields are exposed in UI or logs.

## 12) Public quoting (tokenized links)
Share link issuance and public acceptance should work without authentication.

Issuance
- [ ] From Proposals list, click “Create share link” on a Draft/Sent proposal. A link is generated and copied successfully.
- [ ] Proposal status becomes Sent (if Draft) and a Sent date appears in the list.

Public view
- [ ] Open the copied link (/p/:token) in a private window. The read‑only quote loads with description and total.
- [ ] Refresh the page; it continues to work while the token is valid (see TTL below).

Acceptance and lock
- [ ] Click Accept on the public page. It returns success and the UI reflects Accepted state.
- [ ] In Admin/Contractor app, the proposal shows status Accepted and is locked (no edit/delete).
- [ ] Attempting to Accept again via the public link is blocked or a no‑op (already accepted/locked).

Notifications (same as internal acceptance)
- [ ] On acceptance via public link, an identical “Proposal Accepted” notification is created for Admins.
- [ ] Bell unread count increments on the next poll; the item appears in the bell dropdown and /admin/notifications.

Invalid/expired token behavior
- [ ] Visiting /p/INVALIDTOKEN shows an error message (400/404) and does not leak data.
- [ ] After token expiry, visiting /p/:token returns an “expired” error (401) and no data.
- [ ] Optional: Simulate expiry by setting the session’s expires_at in DB to a past time; the page should report expired.

Config
- [ ] Token TTL is respected (VITE_PUBLIC_PROPOSAL_TOKEN_TTL_MIN / PUBLIC_PROPOSAL_TOKEN_TTL_MIN). Adjusting TTL affects new sessions.

---

Done when: All items are checked locally and no blockers are discovered during testing.

## Known limitations & next steps
- Per‑contractor manufacturer restrictions: not enforced in public quotes; scope and enforce catalog/manufacturer visibility per group.
- Custom multipliers per contractor: baseline multipliers exist; add per‑group overrides and ensure totals reflect them in public view.
- Session management: no UI to revoke tokens; add a “Revoke link” and show active sessions with expiry.
- Email delivery: link is copy‑only; add “Email quote” flow to send token link and track delivery.
- Fine‑grained roles for notifications: admin detection is role‑based; migrate to permission‑based targeting if needed.
