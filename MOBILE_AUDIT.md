## Mobile UX Audit (A–I)

### A. Stack and Build

- SPA: React 19 + React Router DOM 7.8
- State: Redux Toolkit + react-redux
- UI: CoreUI v5 (@coreui/react) + custom SCSS/CSS
- i18n: i18next + react-i18next
- Build: Vite 7 with @vitejs/plugin-react, Terser minify, manualChunks for vendor splitting
- Dev server: proxies /api → http://localhost:8080
- Output: frontend/build

### B. Router and Sitemap (high level)

- Router: BrowserRouter; public routes (auth + public proposal) and protected app shell (DefaultLayout)
- Route table in `frontend/src/routes.js` with permission flags, adminOnly, contractorBlock, and “noisy” redirect helpers
- Key areas: Dashboard, Customers, Quotes (list/create/edit), Contracts, Orders (admin + my), Resources, Calendar, Settings (manufacturers, users, groups, locations, taxes, customization, terms), Admin (contractors, notifications), Profile, Contact, 404

### C. App Shell and Layout

- Shell: `DefaultLayout` with AppHeader, AppSidebar, AppContent, AppFooter
- Mobile behavior: auto-closes sidebar on route change <768px; Terms modal gates non-admins until accepted
- Density: `html[data-density="compact"]` toggled at ≤768px (debounced resize)

### D. Styling System

- CoreUI SCSS + custom `responsive.css`, `main.css`, and header overrides
- Tokens: CSS custom properties for spacing, radii, shadows, and color; density-aware classes
- Theming: Mobile modification cards inherit color from PageHeader-driven theme

### E. Responsiveness Patterns

- Media queries across components and `responsive.css`; container queries present in select areas
- Mobile list patterns: compact q-cards, sticky top filter/search toolbar, sticky bottom action bar
- Performance helpers: content-visibility for card lists; text clamping with -webkit-line-clamp (standard line-clamp TODO)
- Modals: CoreUI modals with mobile full-screen rules in `responsive.css`

### F. Reusable UI: Tables, Modals, Pagination

- Tables: CoreUI `CTable` used widely; desktop retained while mobile uses cards for large lists
- Pagination: CoreUI `CPagination` where lists are long; “Load more” available in quotes mobile view
- Modals: Modification browser, email/print dialogs, terms; `size="lg"` adopted for modification modal on desktop

### G. Accessibility (A11y)

- Strengths: Route-level code-splitting; spinner has role/status; some ARIA roles on tabs/nav
- Gaps: Inconsistent aria-labels on icon-only buttons; ensure buttons use type="button" inside forms (applied on mobile interactions)
- Landmarks: Header/Nav/Main/Footer present; ensure page headers use h1 per route
- Actions: Audit focus states; verify tap targets ≥44x44 CSS px; add descriptive labels to sticky toolbars and bottom bars

### H. Performance

- Code-splitting: React.lazy per route + Vite manualChunks for vendor groups
- CSS: AutoPrefixer; CSS split enabled; content-visibility used for lists
- Optimizations to consider: native `line-clamp`; image lazy-loading where applicable; safe-area paddings for sticky bottom bar; bundle analyzer pass

### I. Internationalization (i18n)

- Libraries: i18next + react-i18next
- Actions: Ensure all visible strings in new mobile UI use `t()`; verify language switcher wiring; avoid concatenated strings; provide aria-labels via translation keys

---

Notes
- Mobile “north-star” achieved on quotes list: compact cards, sticky filters/search, sticky bottom actions, load more, content-visibility, density tokens
- Hinge/exposed side selection fixes applied (immediate feedback; no unintended submits on mobile); row-based keying across create/edit
