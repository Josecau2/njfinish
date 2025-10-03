# NJ Cabinets Frontend UI/UX Audit (Chakra)

## Executive Summary
- Legacy CSS stacks alongside Chakra theming, creating two competing design systems and inconsistent results.
- Core layout containers add overlapping padding and width constraints that squeeze responsive tables and cards.
- Several high-traffic screens lean on ad-hoc styling and inline tweaks instead of reusable Chakra variants, slowing refinement.

## Key Findings
### Legacy CSS vs Chakra
- **Issue**: `frontend/src/main.css:40` and `frontend/src/main.css:76` still style `.login-right-panel` and `.form-control`, but the login page now renders Chakra primitives without those classes (`frontend/src/pages/auth/LoginPage.jsx:168`).
- **Impact**: These selectors no longer attach to the DOM, so text fields fall back to Chakra defaults while the legacy CSS inflates bundle size and introduces a phantom design system.
- **Recommendation**: Either delete the unused selectors or port the intent into Chakra component theme overrides so the look is controlled in one place.
- **Issue**: `frontend/src/responsive.css:37` re-defines primary palettes (`--app-primary`) and Bootstrap-era `.btn` / `.row` rules (`frontend/src/responsive.css:316`, `frontend/src/responsive.css:468`).
- **Impact**: The duplicated tokens diverge from `frontend/src/theme/index.js`, and any accidental `className="btn"` will pick up legacy gradients that do not respect color mode.
- **Recommendation**: Move required overrides into Chakra`s semantic tokens and component variants, then delete the remaining Bootstrap scaffolding.

### Layout Containers & Spacing
- **Issue**: Layout padding compounds across `frontend/src/layout/DefaultLayout.jsx:176`, `frontend/src/components/AppContent.js:38` / `42`, and `frontend/src/components/PageContainer.jsx:6`.
- **Impact**: On xl screens the main area loses ~64px per side, shrinking tables and forcing earlier wrapping than necessary.
- **Recommendation**: Pick a single container component to own horizontal rhythm, expose it via theme spacing tokens, and let pages opt into additional gutters only when needed.

### Token Usage & Color Palette
- **Issue**: Screens continue to hard-code palette values (`frontend/src/pages/auth/LoginPage.jsx:178`, `frontend/src/pages/auth/LoginPage.jsx:275`, `frontend/src/pages/calender/CalendarView.css:30`).
- **Impact**: Brand updates or dark mode adjustments require hunting through feature code and CSS files.
- **Recommendation**: Swap to semantic tokens (e.g. `color="text"`, `colorScheme="brand"`) or define component variants in `frontend/src/theme/index.js` so features stay brand-agnostic.

### Navigation Shell
- **Issue**: `frontend/src/components/AppSidebar.js:72` builds a merged class list (`sidebar`, `sidebar-dark`, custom modifiers) that relies on CSS modules (`frontend/src/components/AppSidebar.module.css:125`).
- **Impact**: Styling still depends on Bootstrap naming and global selectors (`:global(.sidebar-nav)`), so theming changes require touching JS, CSS modules, and global CSS.
- **Recommendation**: Replace the class concatenation with Chakra layout primitives and move the styling rules into a `Sidebar` component theme to centralize hover and collapsed states.

### Component Overrides Outside Theme
- **Issue**: Modal polish sits in raw CSS (`frontend/src/styles/modals.css:12`) instead of Chakra`s `components.Modal` theme slot.
- **Impact**: Variants cannot be shared across modals, and dark mode / density switches must be replicated manually.
- **Recommendation**: Port the modal shape, spacing, and scrollbar styling into the Chakra theme so every `<Modal />` stays consistent.

### Feature Screens & Inline Styling
- **Issue**: Proposal actions still rely on inline tweaks (`frontend/src/pages/proposals/Proposals.jsx:731`, `frontend/src/pages/proposals/Proposals.jsx:739`).
- **Impact**: Ad-hoc icons (`<Text fontSize="lg">?</Text>`) miss shared states, hover colors, and high-contrast adjustments.
- **Recommendation**: Replace with Chakra `IconButton` variants that pull their icon and spacing from the theme.
- **Issue**: Item selection flows import bespoke CSS (`frontend/src/components/ItemSelectionContent.jsx:16`, `frontend/src/components/ItemSelectionContent.css:13`) and duplicate a near-identical edit variant.
- **Impact**: Any spacing tweak must be duplicated across CSS and two large React components (>2k LOC each), inviting regressions.
- **Recommendation**: Extract shared layout into Chakra components (e.g. `StyleCard`, `StylesCarousel`) so the visual system lives in JSX and theme tokens.
- **Issue**: Calendar styling in `frontend/src/pages/calender/CalendarView.css:30` hard-codes focus outlines, backgrounds, and fonts.
- **Impact**: The calendar ignores global typography and dark mode semantics, and the bespoke focus ring does not match other inputs.
- **Recommendation**: Wrap FullCalendar in a Chakra theme layer (e.g. extend `chakra-ui` tokens through CSS variables) so the plugin inherits brand colors.

### Maintainability Hotspots
- **Issue**: `frontend/src/pages/settings/manufacturers/ManufacturersForm.jsx` exceeds 25k lines and mixes business logic with layout primitives.
- **Impact**: Small UI tweaks require sifting through a monolith, making it hard to introduce consistent spacing or validation affordances.
- **Recommendation**: Break the form into composable Chakra sections (address, branding, documents) or extract a JSON-driven form schema.

## Recommended Next Steps
1. Establish a single source of truth for tokens: migrate color, radius, and spacing overrides out of `main.css` / `responsive.css` and into `frontend/src/theme/index.js`.
2. Collapse redundant layout wrappers by standardizing on a `PageContainer` component and updating the layout shell to delegate spacing to it.
3. Delete bootstrap-era selectors that no longer attach to the DOM; track coverage by running Storybook or Percy snapshots after removals.
4. Create Chakra component recipes (buttons, card headers, list actions, modals) and swap inline icon hacks for those recipes across dashboards and proposal screens.
5. Schedule refactors for the heaviest feature pages (manufacturers, item selection) to break them into themed building blocks before layering additional UX fixes.
6. After consolidating styles, run responsive sweeps (sm, md, lg, xl) to confirm tables and forms expand to the new container widths without horizontal scroll.
