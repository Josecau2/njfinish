# UI Styling System Audit — Sep 28, 2025

This audit maps where the application defines layout, spacing, interaction density, and component presentation (excluding color palette management). Sections are ordered top-down so you can trace how style decisions flow from the build pipeline to runtime tweaks.

## 1. Build & bundling layer

### 1.1 `frontend/vite.config.mjs`
- Vite drives the build with `sass` and `postcss` support; CSS is code-split and autoprefixed globally.
- `manualChunks` groups UI libraries (`@coreui/react`, `simplebar-react`, etc.), ensuring shared style assets from CoreUI stay coherent during lazy loading.
- `resolve.extensions` includes `.scss`, so Sass imports resolve without explicit extensions across the project.

### 1.2 Dependencies (`frontend/package.json`)
- Core styling toolchain: `sass`, `postcss`, and `autoprefixer` supply the low-level compilation.
- The app leans on `@coreui/coreui` for baseline component styles and mixins, and `@coreui/react` for the matching React components.

## 2. React entrypoints & import order

### 2.1 `frontend/src/App.js`
- Establishes the master style import stack. The order is significant:
  1. `./scss/style.scss` → boots CoreUI’s Sass bundle.
  2. `./scss/examples.scss` → demo/utility extensions from CoreUI.
  3. `./main.css` and `./responsive.css` → large, legacy override layers for layout, tables, and feature-specific tweaks.
  4. `./styles/header-override.css` and `./styles/modal-override.css` → targeted patches layered last to win the cascade.
- Because these are imported once at the root, every component downstream inherits the same global cascade.

### 2.2 `frontend/src/layout/DefaultLayout.js`
- Adds a second wave of imports *after* CoreUI has initialized:
  - `../styles/_tokens.scss`, `../styles/_mixins.scss`, `../styles/_modern.scss`, `../styles/_coreui-overrides.scss`, `../styles/_responsive.scss`.
  - This grouping intentionally lives inside the layout so that the cascade layer definitions in `_modern.scss` apply after CoreUI’s defaults but before view-specific overrides.
- Injects inline `<style>` rules that control the `.modern-layout` wrapper, sidebar spacing, and mobile-first adjustments; these act as the highest priority CSS for layout scaffolding.

### 2.3 `frontend/src/index.js`
- Chakra theme construction (`createThemeWithBrand`) now injects brand colors into semantic tokens and sets CSS variables (`--header-bg`, `--sidebar-bg`, `--login-bg`) so components receive the palette without imperative DOM writes.
- `syncSidebarWithScreenSize` still toggles `data-density="compact"` on `<html>` so layout utilities can respond via `_tokens.scss`.

## 3. CoreUI Sass foundation (`frontend/src/scss`)

### 3.1 `style.scss`
- Calls `@use "@coreui/coreui/scss/coreui"` to pull in the entire CoreUI component suite.
- Defines global wrappers such as `.wrapper`, `.header`, `.sidebar` spacing, and dark-mode fallbacks—these set the baseline geometry before custom layers run.

### 3.2 `examples.scss`
- Imports CoreUI variables/mixins and configures example/demo scaffolding (`.example`, `.preview`).
- While labelled “examples,” parts of the app reuse these conventions (modal layout, pagination gaps), so they effectively extend the base style layer.

## 4. Custom Sass utility stack (`frontend/src/styles`)

### 4.1 `_tokens.scss`
- Declares structural CSS custom properties: spacing scale (`--sp-*`), radii, elevation, and fluid typography.
- Hooks `:root[data-density="compact"]` to shrink spacing and rounded corners on mobile, giving the runtime toggle in `DefaultLayout` an immediate effect.

### 4.2 `_mixins.scss`
- Collects project-specific Sass mixins (`touch-target`, `sticky-top`, `safe-area`, `clamp-lines`).
- `_modern.scss` and component styles rely on these to enforce consistent hit targets and sticky behaviors without repeating raw CSS.

### 4.3 `_coreui-overrides.scss`
- Overrides CoreUI Sass variables for geometry (border radii, button padding) before the CoreUI bundle compiles.
- This is the canonical place to adjust component chrome (e.g., rounding) without editing CoreUI source.

### 4.4 `_modern.scss`
- Declares cascade layers (`@layer base, components, utilities`) so project additions slot predictably after CoreUI.
- Provides modernized primitives: sticky toolbars, card shells, segmented controls, table patterns, and utility classes (`.content-vis`, `.toolbar--sticky`).
- Because it `@use`s `_tokens` and `_mixins`, those tokens become the single source for spacing and elevations across these patterns.

### 4.5 `_responsive.scss`
- Adds small, targeted utilities (`.u-desktop`, `.u-mobile`, `.container-query`, `.table-wrap`) to police overflow and mobile behavior.
- Works in tandem with `_modern.scss` and the runtime `data-density` attribute to adjust layout density.

## 5. Global override CSS (legacy & feature-specific)

### 5.1 `frontend/src/main.css`
- Monolithic stylesheet (~1k lines) of ad-hoc overrides for CoreUI components, login layout, timeline widgets, modals, PDF customization, etc.
- Relies heavily on `!important`, attribute selectors, and long selectors, so it often trumps newer cascade layers—any refactors must account for this precedence.

### 5.2 `frontend/src/responsive.css`
- Even larger (~3k lines) responsive rule set: resets max-widths, rewrites header/sidebar layout, modal sizing, tables, and mobile modal behavior.
- Duplicates responsibilities found in `_responsive.scss` but with more granular adjustments; acts effectively as the final safety net for layout glitches.

### 5.3 `frontend/src/styles/header-override.css`
- Targets purple gradient headers & cards, forcing them to follow sidebar theming while preserving button contrast.
- Uses attribute selectors on inline `style` to neutralize gradient backgrounds—highest priority after `responsive.css`.

### 5.4 `frontend/src/styles/modal-override.css`
- Normalizes modal chrome under `.neutral-modal`, removing gradients, enforcing consistent radius, and aligning CoreUI close buttons.

### 5.5 Other assets
- `frontend/src/luxury-dashboard.css` and `frontend/src/njcabinets-theme.css` exist but are currently empty placeholders.
- `public/` may contain additional static CSS, but React imports dominate actual runtime styling.

## 6. Runtime and component-level styling controls

### 6.1 JS-driven class toggles
- `DefaultLayout` sets `data-density`, listens for route changes to close the sidebar, and embeds inline CSS for `.modern-layout`, influencing flex layout and padding.
- Components lean on global utility classes (`.toolbar`, `.card--compact`, `.table-modern`, `.u-mobile`) rather than scoped CSS modules—structure is globally coordinated.

### 6.2 Brand integration (non-color structural impact)
- Even though branding primarily covers colors, the `getBrand()` flow in `frontend/src/brand/useBrand.js` injects logo sizing and login layout constraints that interact with `main.css` selectors (e.g., `.login-right-panel`).
- Future non-color structural overrides should either extend `_modern.scss` or introduce new cascade layers to stay predictable.

## 7. Observations & risks

1. **Cascade complexity:** The sheer size of `main.css` and `responsive.css`, combined with multiple import sites, makes specificity conflicts common. Refactors should gradually migrate rules into `_modern.scss` or `_responsive.scss` to benefit from cascade layers.
2. **Global scope:** With no CSS Modules or scoped styles, every selector is global. Utility naming collisions are possible; documenting class usage in `_modern.scss` helps.
3. **Inline style blocks:** `DefaultLayout`’s inline `<style>` is the highest priority CSS. Any future layout adjustments must respect or replace this block.
4. **Duplicated breakpoints:** `_responsive.scss` (Sass) and `responsive.css` (plain CSS) both manage breakpoints; consider consolidating to reduce drift.
5. **Placeholder assets:** Empty theme files hint at planned specialization. Removing or populating them avoids confusion.

## 8. Suggested next steps

- **Short term:** Catalogue high-impact selectors inside `main.css`/`responsive.css` and move them into structured Sass layers with tokens/mixins.
- **Medium term:** Define a consistent naming convention for utility classes under `_modern.scss` and deprecate redundant legacy selectors.
- **Long term:** Evaluate adopting CSS Modules or scoped styling for components that need isolated overrides, reducing reliance on `!important`.

## 9. Upgrade paths & library research

### 9.1 Component layer replacements for CoreUI
- **Mantine (React, MIT):** Ships 120+ accessible components, rich theming via CSS variables, and headless hooks for advanced use-cases. Mantine’s global style provider can ingest the existing token map from `_tokens.scss`, letting us migrate layout primitives first (Cards, Grids, Buttons) while keeping bespoke screens intact. Migration strategy: wrap Mantine components in shim components that expose current prop names so we can swap page-by-page without a breaking change. Risk: requires refactoring Bootstrap-specific markup and CoreUI class usage.
- **Chakra UI (React, MIT):** Offers design tokens, responsive props, and dark-mode theming out of the box. Chakra’s `extendTheme` mirrors our token setup and would absorb spacing/radius variables defined in `_tokens.scss`. Chakra’s component API is simpler than CoreUI, which could reduce custom overrides in `main.css`. Risk: Chakra leans on Emotion for styling, so we’d introduce a CSS-in-JS runtime (small but non-zero bundle impact).
- **Ant Design 5 (React, MIT-compatible license):** Provides polished enterprise components with design kits. AntD 5 rewrote theming around design tokens (`theme.algorithms`). Suitable if we need internationalized complex tables/forms fast. Downsides: heavier bundle, opinionated aesthetics that may clash with brand requirements, and CSS variable names that differ significantly from our current Sass maps.

### 9.2 Headless primitives + utility-first styling
- **Radix UI (Primitives) + `@radix-ui/themes`:** Radix supplies accessible base components (Dialog, Dropdown, Slider) without forcing styling. Pairing them with our `_modern.scss` layer or Radix Themes could replace ad-hoc modal overrides and menu fixes currently in `main.css`. Incremental path: start with modals and dropdowns where we already fight CoreUI stacking contexts.
- **shadcn/ui (Radix + Tailwind recipes):** Provides pre-built composition patterns built on Radix primitives. If we adopt Tailwind (see below), shadcn accelerates rebuilding forms and data tables with a modern visual baseline while keeping full control of tokens.
- **Tailwind CSS + PostCSS:** Introduces utility-first classes, drastically reducing the need for `responsive.css`. Tailwind can coexist with Sass; we’d configure PostCSS to run Tailwind before Autoprefixer. Migration path: enable Tailwind, port a few modules (e.g., login screen) to validate, then gradually replace bespoke `.card--compact` rules. Consider `daisyUI` for component patterns if we prefer an opinionated Tailwind partner.

### 9.3 Supporting libraries to enhance UX polish
- **Framer Motion (already installed):** We can lean further into it by centralizing motion tokens (durations, easing) and wrapping interactive primitives so hover/press states remain consistent.
- **React Aria / React Stately:** Adobe’s headless accessibility toolkit. Useful if we choose to keep our current markup but want stronger keyboard support for complex widgets (menus, listboxes). Integrates well with Tailwind or Mantine styling layers.
- **TanStack Table + TanStack Form:** For data-heavy screens (quotes, orders) these headless utilities decouple logic from styling, letting us rebuild tables with modern UI libs while retaining business logic.

### 9.4 Mapping current layers to potential upgrades
- **`@coreui/coreui` bundle** → Replace gradually with Mantine or Chakra UI components, starting with layout shells (Header, Sidebar, Cards). Evaluate bundle-size impact with Vite’s analyzer.
- **`main.css` overrides** → If we adopt Tailwind or Chakra, plan to retire most `!important` overrides by re-implementing affected screens with library-native components.
- **`responsive.css`** → Supersede with library-provided responsive props (Mantine’s `Stack`, Chakra’s responsive arrays) or Tailwind utilities. Keep only niche container queries.
- **Modal/menu hacks** → Swap in Radix Dialog/Menu as foundational primitives to avoid stacking index issues currently handled in `modal-override.css`.

### 9.5 Evaluation considerations
- **Design cohesion:** Prefer libraries with maintained Figma libraries (Mantine, Chakra, AntD) to align product/design teams.
- **Accessibility:** Require WCAG-compliant focus management and keyboard coverage; prioritize Radix/Mantine which guarantee this.
- **Performance:** Measure bundle impact. Mantine and Chakra tree-shake well, but Emotion/Tailwind setups add build-time steps. Use `npm run build:analyze` to validate before wide rollout.
- **Incremental adoption:** Favor candidates that allow component-by-component swaps. Mantine/Chakra and Radix primitives all permit gradual migration, unlike CSS framework rewrites (e.g., pure Bootstrap to Tailwind overnight).

Document decisions and pilot migrations inside this file as we test candidates so future contributors know which stack is canonical.

### 9.6 NPM health snapshot (checked Sep 28, 2025)
No candidate surfaced a deprecation warning during `npm view <package> deprecated`. Latest versions pulled from the registry:

| Package | Latest version | Deprecated? | Notes |
| --- | --- | --- | --- |
| `@mantine/core` / `@mantine/hooks` | 8.3.2 | No | Core + hooks packages share the same release cadence; requires React 18/19. |
| `@chakra-ui/react` | 3.27.0 | No | Still on Emotion 11; pair with `@emotion/react`/`@emotion/styled` if adopted. |
| `antd` | 5.27.4 | No | Ant Design 5.x is the current stable stream with design token API. |
| `@radix-ui/themes` | 3.2.1 | No | Works with Radix primitives (`@radix-ui/react-dialog` 1.1.15, `@radix-ui/react-dropdown-menu` 2.1.16). |
| `tailwindcss` | 4.1.13 | No | Optional plugins like `@tailwindcss/forms` 0.5.10 also current. |
| `react-aria` | 3.43.2 | No | Aggregated React Aria APIs; individual scoped packages follow the same major. |
| `@tanstack/react-table` | 8.21.3 | No | Headless table utilities; React Form companion (`@tanstack/react-form`) is at 1.23.4. |
| `framer-motion` | 12.23.22 | No | Project currently ships 12.16.0—safe to bump after smoke-testing animations. |

`shadcn/ui` remains a template-driven system rather than a published package; it pulls from the `tailwindcss` and Radix versions listed above. Keep these aligned if we mirror their component recipes.

### 9.7 Migration dependency matrix
| Domain | Current implementation (package@version) | Target dependency | Latest version (npm) | Migration notes |
| --- | --- | --- | --- | --- |
| UI component library | `@coreui/react@5.5.0` (+ CoreUI Sass + bespoke overrides) | **Chakra UI (`@chakra-ui/react`)** | 3.27.0 | Replace layout primitives, nav, tables, and form controls with Chakra components. Map `_tokens.scss` spacing/radius to Chakra theme via `extendTheme`. Remove CoreUI bundles and chart wrappers once views are ported. |
| Utility CSS framework | CoreUI mixins + global `main.css`/`responsive.css` overrides | **Tailwind CSS (`tailwindcss`)** | 4.1.13 | Introduce Tailwind with Vite plugin, enabling JIT utilities. Rebuild chronic override areas (layout wrappers, tables, headers) with Tailwind classes; retire redundant Sass utilities while keeping critical tokens as Tailwind custom config. |
| Icons | Mix of `@coreui/icons`, `@fortawesome/*`, `react-icons`, `lucide-react@0.511.0` | **Lucide Icons (`lucide-react`)** | 0.544.0 | Standardize on Lucide. Replace FontAwesome/CoreUI icon usages, remove legacy icon deps from bundle and markup. Encapsulate icon usage via a shared `<Icon name="..."/>` helper for tree-shaking. |
| Forms & validation | `formik@2.4.6` + `yup@1.6.1` forms | **React Hook Form (`react-hook-form`)** | 7.63.0 | Migrate form screens to RHF hooks with Chakra field components. Keep Yup/Zod for schema validation via RHF resolver; gradually decommission Formik contexts. |
| Animation & interaction | `framer-motion@12.16.0` | **Framer Motion** (upgrade) | 12.23.22 | Upgrade and centralize motion tokens (easings, durations). Replace ad-hoc CSS animations with Motion variants; audit exiting components for new `AnimatePresence` API. |
| Server state & caching | `axios` + Redux slices for server data | **TanStack Query (`@tanstack/react-query`)** | 5.90.2 | Layer TanStack Query for API reads/mutations. Keep Redux for client state, but move fetch logic into `useQuery`/`useMutation`, enabling background refresh and caching. |
| Image lazy loading | Manual `img` handling (no dedicated library) | **react-lazy-load-image-component** | 1.6.3 | Wrap gallery/product imagery in `LazyLoadImage`; configure placeholders and IntersectionObserver thresholds tuned for mobile. |
| Accessibility linting | ESLint with React + Hooks plugins only | **eslint-plugin-jsx-a11y** | 6.10.2 | Add to `eslint.config.mjs` (flat config) to enforce accessibility rules in CI and editor. Integrate with Chakra’s accessibility features. |
| Internationalization | `i18next@25.4.0` + `react-i18next@15.7.1` | **i18next / react-i18next** (upgrade) | 25.5.2 / 16.0.0 | Upgrade to latest majors for improved Suspense support. Leverage lazy namespace loading and locale detection plugins; ensure Chakra components respect RTL when locale changes. |

Use this matrix to drive dependency cleanup stories: remove each legacy package once the mapped screens are migrated, and update the npm health snapshot (section 9.6) after each round of upgrades.

### 9.8 Implementation status (Sep 28, 2025)
- ✅ Added Chakra UI, TanStack Query, React Hook Form, lucide-react upgrade, Tailwind CSS, react-lazy-load-image-component, eslint-plugin-jsx-a11y, and version bumps for i18next/react-i18next/framer-motion in `frontend/package.json`.
- ✅ Bootstrapped Chakra’s `ChakraProvider` and TanStack `QueryClientProvider` in `src/index.js`, supplying a starter `theme` under `src/theme/index.js`.
- ✅ Introduced Tailwind configuration (`tailwind.config.cjs`, `postcss.config.cjs`, `src/tailwind.css`) and imported it in `App.js` alongside legacy styles so utility classes are ready for gradual refactors.
- ✅ Extended ESLint flat config with `eslint-plugin-jsx-a11y` recommended rules for early accessibility feedback.
- ✅ Converted `AppContent` to Chakra primitives (`Box`, `Spinner`, `Center`), removing its reliance on `@coreui/react` containers/spinners and replacing inline padding styles with responsive Chakra props.
- 🔄 Pending: refactor CoreUI-based layout/components to Chakra equivalents (begin with `DefaultLayout`, navigation, page headers, tables) and progressively replace SCSS overrides with Tailwind utility patterns.
- 🔄 Pending: migrate Formik/Yup flows to React Hook Form + schema resolvers, wire TanStack Query into API slices, and adopt `react-lazy-load-image-component` for product imagery galleries.
- 🔄 Pending: remove CoreUI and unused icon/form libraries once dependent screens are ported, and adjust build pipeline to drop Sass bundles no longer required.

## 10) Chakra/Tailwind Migration Guidelines
### 10.1 Migration workflow
- Start each refactor by reading the related checklist in `nj-cabinets-ui-ux-playbook.md` and capturing before/after screenshots.
- Replace CoreUI structures with Chakra primitives while wiring layout spacing with Tailwind. Remove SCSS imports once the screen is stable.
- Move side effects and data fetching into TanStack Query hooks and adopt React Hook Form for validation before cleaning up Redux slices.
- Finalize by localizing strings and verifying lucide icons and motion tokens follow the playbook standards.

### 10.2 Token & theming alignment
- Extend the Chakra theme in `frontend/src/theme/index.js` first, then mirror the tokens in `frontend/tailwind.config.cjs` and `frontend/src/tailwind.css`.
- Keep light/dark and high-contrast values paired; run `node scripts/audit-ui.js --tokens` to confirm contrast budgets stay above 4.5:1.
- Document new tokens in the playbook and update component stories/tests so contributors see a canonical usage example.

### 10.3 Component conversion priorities
- App shell: `AppHeader.js`, `AppSidebar.js`, and `DefaultLayout.js` must ship before page-level work to avoid mixed design systems.
- Forms: migrate `frontend/src/pages/**/Create*` flows to React Hook Form with Chakra `FormControl`, `Input`, and `Select`, then add inline validation feedback.
- Data views: rebuild tables and cards (`LeadsPage.jsx`, `PaymentsList.jsx`, `OrdersList.jsx`) with Chakra Table/Card patterns and Tailwind responsive fallbacks.
- Feedback: normalize modals and toasts (`NotificationBell.js`, modal components under `frontend/src/components/model`) to Chakra `Modal`/`AlertDialog` and `useToast`.

### 10.4 Cleanup once chapters ship
- Remove legacy Sass bundles (`frontend/src/scss`, `frontend/src/styles`) and CoreUI packages from `frontend/package.json` after the last dependent view migrates.
- Delete obsolete CSS overrides (`frontend/src/main.css`, `frontend/src/responsive.css`) once Tailwind utilities cover the same behavior.
- Replace FontAwesome/react-icons imports with lucide-react and drop the packages only after a repo-wide search returns empty.

### 10.5 Verification & sign-off
- Run `npm run lint -- --max-warnings=0`, `npm run test`, and the UI audit script (`node scripts/audit-ui.js`) before requesting review.
- Validate keyboard flows, focus management, and screen-reader announcements (see the NotificationBell aria-live implementation) on migrated screens.
- Tick the Definition of Done checklist in the playbook and link the relevant Storybook story or screenshot diff in the PR description.
### 10.6 Toast delivery pattern
- Global success/error/info messaging routes through `frontend/src/helpers/notify.js`, which wraps Chakra standalone toasts with lucide icons and theme-aware styling.
- Replace any inline SweetAlert toasts with the helper so every screen inherits motion, density, and color tokens without duplicating markup.
