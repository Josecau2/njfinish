# Secure Token Restore Plan

- [x] Backend: Update `authController.login` to return a scoped access token alongside cookies (mirroring legacy response) and expose a short-lived refresh endpoint if needed.
- [x] Backend: Reinstate token-aware upload helpers by restoring `withAuthToken` logic while keeping cookie verification; add rate limiting and audits for the new token endpoint.
- [x] Frontend: Reintroduce in-memory token handling (`getFreshestToken`) and ensure `axiosInstance` attaches it for authenticated API calls without regressing cookie usage.
- [x] Frontend: Update asset helpers (`resolveAssetUrl`/`withAuthToken`) so PDFs, manifest icons, and public proposal shares include valid auth tokens.
- [ ] Testing: Manual regression passes for login/logout, protected route navigation, PDF/email generation, contractor flows; run `node test-auth-token-smoke.js` (requires `SMOKE_USER_EMAIL`/`SMOKE_USER_PASSWORD`) to verify the token endpoint and API access.
- [ ] Post-change review: verify cookies + token coexist, confirm tokens expire correctly, document rollout notes in `/init`.
