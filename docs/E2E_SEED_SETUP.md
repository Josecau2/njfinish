# E2E Seed Dataset

Run this seeder before executing the Playwright suite so pages have stable demo data.

```bash
npm run seed:e2e
```

The script is idempotent: running it multiple times updates the fixtures in place without duplicating records. It provisions:

- Admin login `joseca@symmetricalwolf.com / admin123`
- Representative customers, proposals, and an accepted proposal wired to an order
- Orders with snapshot data plus a completed payment & payment configuration
- Resource links, notifications, and a live lead so admin pages render meaningful content
- A contractor group/user for scoped views

The command uses environment variables `E2E_AUTH_EMAIL` and `E2E_AUTH_PASSWORD` if you need to override the defaults.