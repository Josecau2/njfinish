# Security Hardening Tracker

| ID | Area | Description | Status | Notes |
| --- | --- | --- | --- | --- |
| S1 | File Serving | Restrict /uploads static exposure and route downloads through authorized controller. | Pending | Defer per current priority; investigate secure storage relocation before change. |
| S2 | Web App Shell | Harden CSP and reduce client token persistence to mitigate XSS-driven session theft. | In Progress | Current update: introduce per-request CSP nonce and remove unsafe script allowances; token storage adjustments partially complete. |
| S3 | Content Sanitization | Sanitize or sandbox customizable HTML (branding, contracts, payment embed). | Pending | Evaluate DOMPurify/HTML sanitizers and storage encoding. |
| S4 | Proposal Email Pipeline | Lock down Puppeteer rendering to prevent SSRF/data exfiltration and restrict endpoint access. | Pending | Assess request interception, allowlist, and job isolation. |
| S5 | Account Lifecycle | Enforce account deletion checks, password policy, and rate limiting on auth endpoints. | Pending | Requires coordination with auth flows and user management UI. |

> Updated: 2025-09-27
