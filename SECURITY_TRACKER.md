# Security Hardening Tracker

| ID | Area | Description | Status | Notes |
| --- | --- | --- | --- | --- |
| S1 | File Serving | Restrict /uploads static exposure and route downloads through authorized controller. | Completed | Replaced static mounts with auth-guarded streaming and ensured clients append JWTs to asset requests. |
| S2 | Web App Shell | Harden CSP and reduce client token persistence to mitigate XSS-driven session theft. | Completed | CSP now injects nonce-backed script/style directives, axios/auth helpers keep tokens in session memory, and subject/filename sanitizers guard proposal mail headers. |
| S3 | Content Sanitization | Sanitize or sandbox customizable HTML (branding, contracts, payment embed). | Completed | Added sanitize-html utility, applied to branding/login payloads, contact terms, payment embeds, and PDF customization inputs. |
| S4 | Proposal Email Pipeline | Lock down Puppeteer rendering to prevent SSRF/data exfiltration and restrict endpoint access. | Completed | Proposal email route now requires proposals:update/accept, Puppeteer host allowlist enforced, and outbound email payloads are validated/sanitized. |
| S5 | Account Lifecycle | Enforce account deletion checks, password policy, and rate limiting on auth endpoints. | Completed | Added rate limiting to auth routes, enforced password strength, blocked deleted logins, and protected last-admin deletion. |

> Updated: 2025-09-28
