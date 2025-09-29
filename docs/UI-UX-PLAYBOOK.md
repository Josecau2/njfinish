Below is a **set-in-stone, concise UI/UX playbook** that assumes you’re using the exact stack we locked in:

**Chakra UI • Tailwind CSS • Lucide • React Hook Form • Framer Motion • TanStack Query • react-lazy-load-image-component • eslint-plugin-jsx-a11y • i18next**

---

## 0) Ground Rules (how these tools work together)

* **Chakra = components & accessibility.** Use Chakra for all interactive components (Button, Input, Modal, Drawer, Menu, Table, Tabs, Toasts).
* **Tailwind = layout & spacing.** Use Tailwind for **all** layout, spacing, sizing, responsive breakpoints, and typography utilities (`flex`, `grid`, `gap`, `p/m`, `w/h`, `sm: md: lg:`).
  *Rule:* Don’t mix Chakra spacing props (`p`, `m`, `gap`) on the same element—prefer Tailwind utilities.
* **One breakpoint system:** Use **Tailwind defaults** and set Chakra theme breakpoints to match (sm 640, md 768, lg 1024, xl 1280, 2xl 1536).
* **Icons:** Only **Lucide** (via `lucide-react`). No other icon sets.
* **Forms:** **React Hook Form** for form state/validation; show errors via Chakra’s `FormErrorMessage`. Use built-in RHF validators.
* **Motion:** **Framer Motion** for page transitions, modals, drawers, and micro-interactions.
* **Data fetching/caching:** **TanStack Query** for all server state. No custom fetch state in React state/Redux.
* **Images:** **react-lazy-load-image-component** for offscreen images + placeholders.
* **A11y:** **eslint-plugin-jsx-a11y** enforced in CI. Do not disable rules unless documented.
* **i18n:** **i18next/react-i18next**. No hard-coded UI strings.

---

## 1) Design Tokens (single source of truth)

Define these in **Tailwind config** and mirror in the **Chakra theme**:

* **Colors**

  * `brand`: 500 `#2563EB`, 600 `#1D4ED8`, 700 `#1E40AF`
  * `gray` scale: use Tailwind **slate** (50–900).
  * Semantic: `success #16A34A`, `warning #D97706`, `danger #DC2626`, `info #0EA5E9`.
  * **Text:** default `slate-900`, **muted:** `slate-600`.
  * **Backgrounds:** page `slate-50`, surface `#FFFFFF`, subtle surface `slate-100`.
  * **Contrast rule:** text/background and text/button >= **4.5:1**.

* **Typography**

  * Font: **Inter**, fallbacks: system-ui, sans-serif.
  * Base size: **16px** (mobile too—prevents iOS zoom).
  * Scale: h1 24–28, h2 20–22, h3 18–20, body 16, caption 14.
  * Line heights: headings 1.25, body 1.5.

* **Radii & Shadows**

  * Radii: controls **8px**, cards/modals **12px**.
  * Shadows: `sm` 0 1px 2px/10%, `md` 0 4px 12px/12%, `lg` 0 10px 24px/16%. Use sparingly.

* **Spacing (8pt with a couple half-steps)**

  * 4, 8, 12, 16, 24, 32, 48, 64. (Tailwind utilities handle application.)

* **Motion**

  * Durations: hover **150ms**, UI **200ms**, overlays **250–300ms**, page **300–400ms**.
  * Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)`.
  * Respect `prefers-reduced-motion` (disable non-essential animation).

---

## 2) Layout & Navigation

* **App shell:** sticky **top bar 56–64px**; **desktop** left sidebar (250–280px); **mobile** Drawer for nav.
* **Containers:** content max-width 1200px on xl, 100% on mobile, **no horizontal scroll** ever.
* **Spacing rhythm:** section padding 24px; element gaps 12–16px; dense tables/forms may use 8–12px.
* **Breadcrumbs:** present for nested pages; truncate long segments.
* **Sticky action bars (mobile):** for multi-step or long forms, show a sticky bottom bar with **Primary** + **Secondary** actions.

---

## 3) Buttons (Chakra `Button` with Tailwind layout)

* **Variants & when to use**

  * **Primary (solid, `colorScheme="brand"`):** one per view—the action that moves money or creates records (Save, Place Order).
  * **Secondary (outline, `colorScheme="gray"`):** safe alternatives (Cancel, Back).
  * **Tertiary (ghost):** low-emphasis actions (View details).
  * **Destructive (solid, `colorScheme="red"`):** irreversible actions (Delete).
  * **Link:** inline navigation only; never for destructive/primary tasks.
* **Sizes & targets**

  * Default size: **md**; height **44–48px**, min-width **touch target 44px**.
  * Icon+Label: Lucide **20px** icon left; 8px gap.
* **States**

  * **Hover:** +4% darken; **Active:** slight scale **0.98** via Framer Motion `whileTap`.
  * **Focus:** 2px focus ring in `brand/60` outside border (always visible).
  * **Disabled:** 60% opacity; no shadow; no hover.

---

## 4) Icons (Lucide)

* **Sizing:** inline **18–20px**; stand-alone buttons **24px**; header/empty-state **32–48px**.
* **Stroke:** default (≈1.5–1.75). Color inherits current text color; use semantic colors only for status.
* **Accessibility:** icon-only buttons require `aria-label`. Tooltips for ambiguous glyphs.

---

## 5) Forms (React Hook Form + Chakra Form components)

* **Structure**

  * One column on mobile; two columns on lg+ only when fields are short.
  * Each field in `FormControl` with **visible label**; helper text optional; errors in `FormErrorMessage`.
  * Vertical gap between fields **16px** (12px if dense).
* **Validation**

  * RHF `mode: 'onBlur'`; **required** fields marked in label; custom validators in RHF (no extra lib).
  * Error copy: short, specific (“Email is invalid”).
* **Inputs**

  * Chakra `variant="outline"`; focus ring as above; placeholder never replaces label.
  * Min tap target 44px; font 16px.
* **Submission**

  * Primary button shows `isLoading` while submitting; disable secondary actions during submit.
  * On success: toast (3–4s) + optional inline success alert; on failure: inline errors + toast.

---

## 6) Data Display (Tables, Lists, Cards)

* **Desktop tables (Chakra `Table`):** `size="sm"`, zebra or subtle row hover; sticky header for long lists; columns prioritized by task (Name, Status, Total, Updated).
* **Mobile transformation:** prefer **cards** (key fields stacked) over horizontal scroll; if scroll used, **TableContainer** with clear overflow hint.
* **Badges:** use semantic color badges for statuses (success/warning/danger/info).
* **Empty states:** icon (32–48px), 1–2 lines of guidance, primary action.

---

## 7) Motion & Micro-interactions (Framer Motion)

* **Page transitions:** fade + slight up/down translate over **300–400ms**.
* **Overlays (Modal/Drawer):** backdrop fade 200ms; panel slide/scale 250ms.
* **Feedback:**

  * Buttons: `whileTap={{ scale: 0.98 }}`
  * Expand/collapse lists: height/opacity animates 200ms.
* **Respect reduced motion** with `useReducedMotion()`; skip non-essential animation.

---

## 8) Data Fetching & Performance (TanStack Query + Lazy Images)

* **Query defaults:** `staleTime: 60_000`, `cacheTime: 5 * 60_000`, `refetchOnWindowFocus: false` (true for dashboards), `retry: 1`.
* **Lists:** pagination or infinite query; **never** render 500+ rows at once.
* **Mutations:** optimistic updates for toggles/status changes; error rollback + toast.
* **Images:** `LazyLoadImage` with blurred placeholder; always include `width/height` and `sizes` for responsive; use **WebP/AVIF** where possible.
* **Code splitting:** `React.lazy` per route; load heavy editors/widgets on demand.

---

## 9) Accessibility (a11y)

* **Linting:** `eslint-plugin-jsx-a11y` required; CI fails on violations.
* **Keyboard:** every interactive element focusable; logical tab order; **visible** focus ring always.
* **Touch targets:** **≥44×44px**; 8px min gap between adjacent targets.
* **ARIA:** icon buttons have `aria-label`; dialogs have title & `aria-modal`; lists/tables have proper roles.
* **Contrast:** enforce ≥4.5:1 for text; test brand-on-surface combos.
* **Screen readers:** use `aria-live="polite"` for async success; `role="alert"` for errors.

---

## 10) Internationalization (i18next)

* **No hard-coded strings.** Keys use `feature.scope.key` (e.g., `quotes.list.title`).
* **Components:** `<Trans>` for sentences with variables; pluralization via i18next.
* **Formatting:** dates/numbers/currency via `Intl` with current locale from i18next.
* **Fallback:** default `en`; lazy-load other locales.

---

## 11) Page Composition (repeatable pattern)

1. **Page header:** Title, key metrics/actions (Primary right-aligned).
2. **Filters/toolbar (optional):** compact, collapsible on mobile.
3. **Content area:** tables/cards/forms as above.
4. **Feedback:** inline alerts + toasts.
5. **Mobile sticky action bar** when the primary action might be off-screen.

---

## 12) Do/Don’t (to keep it premium)

* **Do:** one clear primary action per screen; ruthless whitespace; consistent iconography; short labels.
* **Don’t:** mix icon sets; stack more than three button styles together; rely on color *alone* for meaning; hide focus rings.
* **Golden rule:** if it looks crowded, it *is*—remove something.

---

That’s your blueprint. Follow it and the app will feel **simple, premium, fast**—the UI equivalent of soft-close drawers: smooth, quiet, and undeniably pro.
