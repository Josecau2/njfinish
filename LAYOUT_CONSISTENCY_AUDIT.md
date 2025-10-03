# Layout Consistency Audit

## Scope & Method
- Reviewed global styles (`main.css`, `responsive.css`, `styles/*`) and Chakra theme integration.
- Sampled structural components (sidebar, header, layout shell) and high-traffic forms (manufacturer creation, customer creation, proposal wizard).
- Traced inline overrides, embedded `<style>` blocks, and legacy Bootstrap/CoreUI class usage for potential conflicts.

## High Priority Findings
- `frontend/src/responsive.css:13-29` forces `overflow-x: hidden` on `html`/`body` and caps every `.container*` at `max-width: 100%`, blocking legitimate horizontal scroll (tables, modals) and breaking CoreUI grid expectations.
- `frontend/src/components/AppSidebar.js:74-82` mixes Chakra layout with legacy CoreUI classes (`sidebar`, `border-end`, `sidebar-dark`), which depend on `AppSidebar.module.css` global overrides (`frontend/src/components/AppSidebar.module.css:5-78`). The cascade is fragile - CoreUI variables and Chakra tokens compete, and responsive behavior differs between the fixed sidebar and the Chakra Drawer variant.
- `frontend/src/components/AppSidebarNav.js:46-119` still renders legacy `.nav-link` / `.nav-item` markup and applies Chakra props plus manual inline styles, leading to duplicate focus states and inconsistent spacing when Chakra theme changes.

## Additional Inconsistencies
- `frontend/src/styles/base.css:28-36` and `frontend/src/styles/fixes.css:12-19` both inject `@media (prefers-reduced-motion: reduce)` blocks with hard `0.01ms` transitions and `!important`, overriding Chakra's motion-safe tokens and causing abrupt animations.
- `frontend/src/components/PageContainer.jsx:19-28` forwards unknown props to the DOM. Consumers pass `fluid` (see `frontend/src/pages/customers/AddCustomerForm.jsx:301`), which renders as an invalid attribute and signals Bootstrap-era API drift.
- `frontend/src/pages/customers/AddCustomerForm.jsx:24-110` relies on Bootstrap class names (`border-0`, `shadow-sm`, `.btn`) and imperative inline style tweaks for Chakra inputs (`onFocus` mutating border colors). These overrides fight Chakra's responsive variants and are hard to theme.
- `frontend/src/pages/settings/manufacturers/ManufacturersForm.jsx:416-436` embeds a `<style>` tag with `!important` overrides targeting legacy utility classes (`.p-4`, `.mb-4`, `.btn`). Chakra cards no longer emit these selectors, so the block is dead code in some viewports and contradicts the design system.

## Recommendations
- Reduce global overrides: let Chakra manage overflow and container widths; reserve `overflow-x: hidden` for specific wrappers.
- Refactor sidebar/nav to pure Chakra primitives (Flex, Stack, LinkBox) and move any legacy CoreUI styling into Chakra theme extensions instead of CSS modules with `:global` selectors.
- Consolidate motion preferences into a single tokens-aware helper so `prefers-reduced-motion` respects Chakra's `usePrefersReducedMotion` behavior.
- Update `PageContainer` to whitelist supported props and provide an explicit `isFluid` boolean that adjusts padding without leaking unknown DOM attributes.
- Replace inline `<style>` injections and Bootstrap class dependencies in forms with Chakra spacing (`py`, `mb`) and component variants. Consider extracting shared form field components to enforce consistent padding and focus states.

## Suggested Next Steps
- Prioritize removing the global container/overflow clamps, then regression-test data-heavy screens (quotes list, proposals) at varied breakpoints.
- Audit remaining pages for `<style>` blocks or `className` references to `.btn`/`.p-*` and migrate them to Chakra props.
- Create Chakra theme extensions (e.g., `Sidebar` variant, `FormField` styles) to centralize typography, spacing, and hover states once legacy classes are gone.
