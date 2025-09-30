# NJ Cabinets — UI Execution Playbook (Chakra + Tailwind)

**Repository:** `Josecau2/njfinish`
**Branch:** `njnewui`
**Design vibe:** iOS‑like, premium, calm, mobile‑first.
**Stack:** Chakra UI · Tailwind · Lucide · i18n · Playwright · Axe

> ## Do‑Not‑Ask Policy
> Agents must **never** ask the user what to do first/next. Execute this playbook **in order**.
> If a sub‑step does not apply, mark it **skipped** in the ledger and continue.
> All progress and audits must be persisted (see Step 0).

---

## 0) Memory & Progress (Required First)

Create persistent progress so any agent can "remember".

### 0.0 Pre-flight Verification

Before starting, verify environment is ready:

```bash
git checkout njnewui && git pull
npm install
npm run type-check || npm run build
```

If build fails, fix compilation errors before proceeding. If dependencies are missing, install them.

### 0.1 Create tracking files

- `PROGRESS.md` — human checklist (top‑level).
- `.ai/state.json` — machine state (last completed step).
- `AUDIT/AUDIT.md` — ledger to track **every page, component, modal, button**.
- `AUDIT/manifest.json` — **authoritative list** the tests consume.

### 0.2 File contents

```md
<!-- PROGRESS.md -->
# PROGRESS
- [ ] 0 Pre-flight & memory setup
- [ ] 1 Baseline & guardrails
- [ ] 2 Global no-overflow & viewport
- [ ] 3 App shell (header/sidebar) responsive
- [ ] 3.5 Error boundary
- [ ] 4 Sticky header & secondary toolbar & 44px taps
- [ ] 5 Sidebar (expanded/collapsed + mobile drawer)
- [ ] 6 Page containers & spacing tokens
- [ ] 6.5 Loading states & skeletons
- [ ] 7 Modals & submodals sizing/behavior
- [ ] 8 Grids/tiles for products & quotes
- [ ] 8.2 Mobile table strategy
- [ ] 9 Icon sizes & 44px hit-area enforced
- [ ] 10 Dark mode contrast pass
- [ ] 10.2 Reduced motion support
- [ ] 11 Customization compatibility (COLORS/LOGOS/PDF/AUTH ONLY)
- [ ] 12 Full AUDIT (pages, components, modals, buttons)
- [ ] 12.2 Audit playground implementation
- [ ] 12.3 Auto-generate manifest
- [ ] 13 Automated layout + a11y tests (Playwright + Axe)
- [ ] 13.3 Test failure protocol
- [ ] 13.4 Bundle size check
- [ ] 14 CI pipeline for audit on push/PR
- [ ] 15 Final QA matrix + closeout
- [ ] 15.2 Push & create PR
```

```json
// .ai/state.json
{ "branch": "njnewui", "last_completed_step": 0, "completed": [] }
```

```md
<!-- AUDIT/AUDIT.md -->
# AUDIT LEDGER

## Routes (pages)
| Path | Title | Viewports | Overflow | Tap targets | Icons | Sticky | Status |
|------|-------|-----------|----------|-------------|-------|--------|--------|

## Components (shared)
| Component | Used in | Viewports | Clipping | Alignment | Contrast | Status |
|-----------|---------|-----------|----------|-----------|----------|--------|

## Modals
| Name | From | Mobile full | Scroll inside | Overlap | Status |
|------|------|-------------|---------------|---------|--------|

## Buttons
| Where | Type | >=44x44 | Icon gap | Focus ring | Status |
|------|------|---------|----------|------------|--------|
```

**IMPORTANT — Manifest Is an Example Only**
The JSON below is a seed example. You must include every route in the app, all modals, shared components, and button variants.
The manifest completeness check (Step 12.5) will fail CI if any real route/component/modal/button is missing.

```json
// AUDIT/manifest.json (EXAMPLE — replace with full inventory of the app)
{
  "routes": [
    { "path": "/", "title": "Dashboard" },
    { "path": "/quotes", "title": "Quotes" },
    { "path": "/orders", "title": "Orders" },
    { "path": "/products", "title": "Products" },
    { "path": "/customers", "title": "Customers" },
    { "path": "/settings", "title": "Settings" },
    { "path": "/login", "title": "Login" },
    { "path": "/password-reset", "title": "Password Reset" },
    { "path": "/request-access", "title": "Request Access" }
  ],
  "modals": [
    "CreateQuoteModal",
    "CreateOrderModal",
    "CustomerEditModal",
    "ProductDetailModal"
  ],
  "components": [
    "AppShell",
    "AppHeader",
    "AppSidebar",
    "SecondaryToolbar",
    "PageContainer",
    "TileCard",
    "DataTable",
    "ResponsiveTable",
    "AnimatedButton",
    "StatusBadge",
    "Toast",
    "Alert",
    "LoadingSkeleton",
    "ErrorBoundary"
  ],
  "buttons": [
    "Primary",
    "Secondary",
    "Tertiary",
    "Destructive",
    "IconOnly"
  ]
}
```

### 0.3 Commit

```bash
git checkout njnewui && git pull
git add PROGRESS.md .ai/state.json AUDIT/AUDIT.md AUDIT/manifest.json
git commit -m "AI: init progress + audit manifest (example) [step-0]"
```

Mark Step 0 done in PROGRESS.md and .ai/state.json.

---

## 1) Baseline & Guardrails

Create non‑negotiable rules.

```md
<!-- CONTRIBUTING-UI.md -->
# UI Guardrails

1) Chakra for components/behavior; Tailwind for layout/spacing/typography utilities.
2) Use theme tokens; avoid hard-coded px colors/sizes if tokens exist.
3) **All interactive elements >= 44×44 px** tap targets.
4) **Zero horizontal overflow** on all routes; wrap inner regions if needed.
5) Mobile-first breakpoints: sm 640, md 768, lg 1024, xl 1280, 2xl 1536.
6) All user-visible strings via i18n keys (no hardcoded English).
7) **Customization scope locked** to: brand colors & logos, PDF invoice styling, and colors on auth pages (Login, Password Reset, Request Access). Nothing else.
8) Respect dark mode; verify contrast.
9) Respect prefers-reduced-motion for users sensitive to animations.
10) All async routes must have loading skeletons.
11) Tables must be responsive (cards on mobile, horizontal scroll on desktop).
12) All interactive elements must have visible focus indicators for keyboard navigation.
```

```bash
git add CONTRIBUTING-UI.md
git commit -m "AI: add UI guardrails [step-1]"
```

Mark Step 1 done in PROGRESS.md and .ai/state.json.

---

## 2) Global No‑Overflow & Viewport

### 2.1 Meta viewport

Ensure in HTML entry (usually `index.html`):

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

### 2.2 Global CSS guardrails

Create `src/styles/fixes.css` and import once (e.g., in `src/main.tsx` or `src/index.tsx`):

```css
html, body, #root { height: 100%; }
html, body { overflow-x: hidden; }
img, video, canvas, svg { max-width: 100%; height: auto; }
[data-scroll-region] { overflow-x: auto; overscroll-behavior-inline: contain; }
.no-shrink { min-width: 0; min-height: 0; }

/* iOS safe areas for sticky footers/headers */
.safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
.safe-top { padding-top: env(safe-area-inset-top); }

/* Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```bash
git add index.html src/styles/fixes.css src/main.* src/index.*
git commit -m "AI: global no-overflow + viewport-fit + reduced-motion [step-2]"
```

Mark Step 2 done.

---

## 3) App Shell (Header + Sidebar) Scaffold

Content area must have `min-width: 0` to avoid overflow.

- Sidebar: desktop docked; mobile drawer.
- Header mounts inside content region (sticky).

Create `src/layout/AppShell.(tsx|jsx)` that composes:

- `<AppSidebar />` (Step 5)
- `<AppHeader data-app-header />` (Step 4)
- Content wrapper with `minW="0"` (Tailwind: `min-w-0`)

```bash
git add src/layout/AppShell.*
git commit -m "AI: scaffold AppShell with responsive slots [step-3]"
```

Mark Step 3 done.

---

## 3.5) Error Boundary

Wrap app in error boundary to prevent white screen of death.

```tsx
// src/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';
import { Box, Button, Heading, Text } from '@chakra-ui/react';

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  state = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('App error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box p={8} textAlign="center" maxW="600px" mx="auto" mt={20}>
          <Heading size="lg" mb={4}>Something went wrong</Heading>
          <Text mb={4} color="gray.600">
            The application encountered an error. Please refresh to try again.
          </Text>
          {this.state.error && (
            <Text fontSize="sm" color="gray.500" mb={4} fontFamily="mono">
              {this.state.error.message}
            </Text>
          )}
          <Button onClick={() => window.location.reload()} colorScheme="brand">
            Refresh Page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}
```

Wrap in `src/main.tsx` or `src/index.tsx`:

```tsx
import { ErrorBoundary } from './components/ErrorBoundary';

root.render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
```

```bash
git add src/components/ErrorBoundary.tsx src/main.* src/index.*
git commit -m "AI: add error boundary for graceful failures [step-3.5]"
```

Mark Step 3.5 done.

---

## 4) Sticky Header, Secondary Toolbar, Tap Targets

### Header

- Height 60px, sticky, `backdrop-filter: blur(8px)`, 1px bottom border.
- Padding `px={4}` base / `px={6}` md.
- All header IconButtons >= 44×44.

### Secondary Toolbar

- Height 50px, sticky under header (`top: 60px`), horizontally scrollable chips on mobile.

Create `src/components/AppHeader.(tsx|jsx)`, include `data-app-header` attribute.

```bash
git add src/components/AppHeader.*
git commit -m "AI: sticky header + secondary toolbar + 44px taps [step-4]"
```

Mark Step 4 done.

---

## 5) Sidebar (Expanded/Collapsed + Mobile Drawer)

### Sizes

- Desktop expanded: 256px (Chakra `w="64"`).
- Desktop collapsed: 56px (Chakra `w="14"`).
- Mobile drawer: ~85% of screen width, overlay.

### Behavior

- Desktop: `position="fixed"` `top="0"` `left="0"` `h="100vh"` `overflowY="auto"`.
- Content offset: `ml` equals sidebar width on desktop.
- Persist collapsed state in `localStorage`.

Create `src/components/AppSidebar.(tsx|jsx)`, wire states.

```bash
git add src/components/AppSidebar.*
git commit -m "AI: sidebar collapse/expand + mobile drawer [step-5]"
```

Mark Step 5 done.

---

## 6) Page Containers & Spacing Tokens

Create `src/components/PageContainer.(tsx|jsx)`:

```jsx
<Box
  data-page-container
  px={{ base:4, md:6 }}
  py={{ base:4, md:6 }}
  maxW="1200px"
  mx="auto"
>
  {children}
</Box>
```

Replace ad‑hoc containers with `<PageContainer>` and convert hardcoded spacing to tokens.

```bash
git add src/components/PageContainer.*
git commit -m "AI: standardized page container + spacing [step-6]"
```

Mark Step 6 done.

---

## 6.5) Loading States & Skeletons

Create consistent loading patterns for async content.

```tsx
// src/components/LoadingSkeleton.tsx
import { Skeleton, Stack, SimpleGrid } from '@chakra-ui/react';

export function PageSkeleton() {
  return (
    <Stack spacing={6}>
      <Skeleton height="60px" />
      <Skeleton height="200px" />
      <Skeleton height="150px" />
    </Stack>
  );
}

export function TileSkeleton() {
  return (
    <Stack spacing={3}>
      <Skeleton height="150px" borderRadius="md" /> {/* Image */}
      <Skeleton height="20px" width="60%" />
      <Skeleton height="16px" width="40%" />
    </Stack>
  );
}

export function TileGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
      {Array.from({ length: count }).map((_, i) => (
        <TileSkeleton key={i} />
      ))}
    </SimpleGrid>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Stack spacing={4}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height="48px" />
      ))}
    </Stack>
  );
}
```

Apply to async routes:

```tsx
import { Suspense } from 'react';
import { PageSkeleton } from './components/LoadingSkeleton';

<Suspense fallback={<PageSkeleton />}>
  <Route path="/products" element={<ProductsPage />} />
</Suspense>
```

```bash
git add src/components/LoadingSkeleton.tsx
git commit -m "AI: consistent loading skeletons [step-6.5]"
```

Mark Step 6.5 done.

---

## 7) Modals & Submodals

### Defaults

- `size={{ base:'full', md:'md' }}`
- `scrollBehavior="inside"`
- `ModalContent` `borderRadius="lg"`
- `ModalOverlay` `blackAlpha.600`

Create `src/components/AppModal.(tsx|jsx)` wrapper and refactor modals to use it.

```bash
git add src/components/AppModal.*
git commit -m "AI: standard modal wrapper + mobile full-screen [step-7]"
```

Mark Step 7 done.

---

## 8) Grids & Tiles (Products, Quote Flows)

### Grid

`<SimpleGrid columns={{ base:1, sm:2, md:3, lg:4 }} spacing={6}>`.

### Tile

- `rounded="md"`, `shadow="xs"`, `borderWidth="1px"`, `p={4}`
- Image wrapper `aspect-ratio: 4/3`
- Selection state: 2px brand border or subtle bg

Create `src/components/TileCard.(tsx|jsx)` and apply.

```bash
git add src/components/TileCard.*
git commit -m "AI: responsive tiles + grid setup [step-8]"
```

Mark Step 8 done.

---

## 8.2) Mobile Table Strategy

Data tables need responsive behavior.

### Strategy

- **Desktop**: Full table with horizontal scroll wrapper
- **Mobile**: Convert to card layout

Create `src/components/ResponsiveTable.(tsx|jsx)`:

```tsx
import { Box, Table, Stack, Card, Text, useBreakpointValue } from '@chakra-ui/react';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface ResponsiveTableProps {
  data: any[];
  columns: Column[];
}

export function ResponsiveTable({ data, columns }: ResponsiveTableProps) {
  const isMobile = useBreakpointValue({ base: true, md: false });

  if (isMobile) {
    return (
      <Stack spacing={4}>
        {data.map((row, i) => (
          <Card key={i} p={4} borderWidth="1px">
            <Stack spacing={3}>
              {columns.map(col => (
                <Box key={col.key}>
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold">
                    {col.label}
                  </Text>
                  <Text mt={1}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </Text>
                </Box>
              ))}
            </Stack>
          </Card>
        ))}
      </Stack>
    );
  }

  return (
    <Box overflowX="auto" data-scroll-region>
      <Table variant="simple">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {columns.map(col => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </Box>
  );
}
```

Replace existing tables with `<ResponsiveTable>`.

```bash
git add src/components/ResponsiveTable.tsx
git commit -m "AI: responsive table with mobile card layout [step-8.2]"
```

Mark Step 8.2 done.

---

## 9) Icon Sizes & 44×44 Hit‑Areas

Create `src/ui-tokens.(ts|js)`:

```ts
// Icon sizes in Chakra spacing units (1 unit = 4px)
export const ICON = {
  sm: 4,  // 16px
  md: 5,  // 20px
  lg: 6   // 24px
};

// Minimum tap target (11 * 4px = 44px)
export const HIT_MIN = 11;
```

- Use `boxSize={ICON.md}` generally; sidebar icons `ICON.lg`.
- IconButtons: `minW={HIT_MIN}` `minH={HIT_MIN}` or padding to reach 44px.

```bash
git add src/ui-tokens.*
git commit -m "AI: standard icon sizes + tap target >=44px [step-9]"
```

Mark Step 9 done.

---

## 10) Dark Mode Contrast Pass

Replace custom colors with `useColorModeValue(light, dark)`.

- Header/toolbar borders visible in dark (`rgba(255,255,255,0.08)`).
- Verify alerts/toasts contrast.
- Test all pages in dark mode manually.

```bash
git commit -am "AI: dark mode contrast + tokens alignment [step-10]"
```

Mark Step 10 done.

---

## 10.2) Reduced Motion Support

Ensure animations respect user preferences (already added to `fixes.css` in Step 2).

Test:
1. Open Chrome DevTools
2. Command Palette (Cmd+Shift+P / Ctrl+Shift+P)
3. Type "Emulate CSS prefers-reduced-motion"
4. Select "prefers-reduced-motion: reduce"
5. Verify animations are minimal

```bash
git commit -am "AI: verify reduced-motion support [step-10.2]"
```

Mark Step 10.2 done.

---

## 11) Customization Compatibility (Locked Scope)

Keep and limit customization to:

1. **Brand**: colors (primary500/600/700) and logos (logoLight, logoDark)
2. **PDF invoice styling**: primary, accent, logo
3. **Auth pages colors**: Login, Password Reset, Request Access

Do not support anything else.

### 11.1 Types

```ts
// src/customization/contract.ts
export type Customization = {
  brand: {
    primary500: string;
    primary600: string;
    primary700: string;
    logoLight: string;
    logoDark: string;
  };
  pdf: {
    primary: string;
    accent: string;
    logo: string;
  };
  auth: {
    loginBg?: string;
    loginAccent?: string;
    resetBg?: string;
    accessBg?: string;
  };
};
```

### 11.2 Loader with safe defaults

```ts
// src/customization/load.ts
import { Customization } from './contract';

const fallback: Customization = {
  brand: {
    primary500: '#2563EB',
    primary600: '#1D4ED8',
    primary700: '#1E40AF',
    logoLight: '/logo-light.png',
    logoDark: '/logo-dark.png'
  },
  pdf: {
    primary: '#1D4ED8',
    accent: '#1E40AF',
    logo: '/logo-dark.png'
  },
  auth: {
    loginBg: '#0B1220',
    loginAccent: '#2563EB',
    resetBg: '#0B1220',
    accessBg: '#0B1220'
  }
};

export function loadCustomization(): Customization {
  try {
    const raw = (window as any).__CUSTOMIZATION__ ?? null;
    if (!raw) return fallback;

    // Deep merge with fallback
    const merged = {
      brand: { ...fallback.brand, ...(raw.brand || {}) },
      pdf: { ...fallback.pdf, ...(raw.pdf || {}) },
      auth: { ...fallback.auth, ...(raw.auth || {}) }
    };

    return merged as Customization;
  } catch {
    return fallback;
  }
}
```

### 11.3 Apply to Chakra theme

```ts
// src/theme/brand.ts
import { extendTheme } from '@chakra-ui/react';
import { loadCustomization } from '../customization/load';

const c = loadCustomization();

export const theme = extendTheme({
  config: {
    initialColorMode: 'system',
    useSystemColorMode: true
  },
  colors: {
    brand: {
      500: c.brand.primary500,
      600: c.brand.primary600,
      700: c.brand.primary700
    }
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand'
      }
    }
  },
  semanticTokens: {
    colors: {
      'border.muted': {
        _light: 'blackAlpha.200',
        _dark: 'whiteAlpha.200'
      }
    }
  }
});
```

### 11.4 Use logos + auth colors (and nowhere else)

- Header logo: light/dark versions based on color mode
- Login/Password Reset/Request Access pages style from `auth`
- PDF renderer consumes `pdf` config

```bash
git add src/customization/* src/theme/brand.ts
git commit -m "AI: keep customization (colors/logos/pdf/auth only) [step-11]"
```

Mark Step 11 done.

---

## 12) Full AUDIT: Every Page, Component, Modal, Button

You must inventory and check:

- Every page route in `AUDIT/manifest.json` (not just the example)
- Every shared component in components list
- Every modal in modals list
- Every button type in buttons list

Update `AUDIT/AUDIT.md` as you verify each item. Keep table cells short (keywords only).

### 12.1 Route Registrar (dev helper)

```tsx
// src/audit/routeRegistrar.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function UseRouteRegistrar() {
  const loc = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV && (window as any).__AUDIT__) {
      (window as any).__AUDIT__.push({
        path: loc.pathname,
        ts: Date.now()
      });
    }
  }, [loc.pathname]);

  return null;
}
```

Mount `<UseRouteRegistrar />` once near Router root in dev builds.

---

### 12.2 Audit Playground (required)

Add dev‑only routes to render and open things for testing:

- `/__audit__/modals?open=ModalName` — renders each modal opened
- `/__audit__/components` — mounts shared components in a grid
- `/__audit__/buttons` — renders all button variants

**Implementation**:

```tsx
// src/routes/__audit__/index.tsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, SimpleGrid, Heading, Stack } from '@chakra-ui/react';
import manifest from '../../../AUDIT/manifest.json';

// Dynamic modal imports with fallback
const loadModal = (name: string) =>
  lazy(() =>
    import(`../../modals/${name}`).catch(() =>
      import(`../../components/${name}`).catch(() =>
        Promise.resolve({ default: () => <div>Modal not found: {name}</div> })
      )
    )
  );

export function AuditRoutes() {
  // Block in production
  if (import.meta.env.PROD) {
    return <Box p={8}>Audit routes are dev-only</Box>;
  }

  return (
    <Routes>
      <Route path="modals" element={<ModalsPlayground />} />
      <Route path="components" element={<ComponentsGrid />} />
      <Route path="buttons" element={<ButtonVariants />} />
    </Routes>
  );
}

function ModalsPlayground() {
  const params = new URLSearchParams(location.search);
  const modalName = params.get('open');

  if (!modalName) {
    return (
      <Box p={8}>
        <Heading size="md" mb={4}>Modal Playground</Heading>
        <Stack spacing={2}>
          {manifest.modals.map(name => (
            <a key={name} href={`?open=${name}`}>
              {name}
            </a>
          ))}
        </Stack>
      </Box>
    );
  }

  const ModalComponent = loadModal(modalName);

  return (
    <Suspense fallback={<div>Loading {modalName}...</div>}>
      <ModalComponent isOpen={true} onClose={() => {}} />
    </Suspense>
  );
}

function ComponentsGrid() {
  return (
    <Box p={8}>
      <Heading size="md" mb={4}>Components Grid</Heading>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
        {manifest.components.map(name => (
          <Box key={name} p={4} borderWidth="1px" borderRadius="md">
            <Heading size="sm" mb={2}>{name}</Heading>
            {/* Dynamically import and render each component */}
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}

function ButtonVariants() {
  return (
    <Box p={8}>
      <Heading size="md" mb={4}>Button Variants</Heading>
      <Stack spacing={4}>
        {manifest.buttons.map(variant => (
          <Box key={variant}>
            <Heading size="xs" mb={2}>{variant}</Heading>
            {/* Render button variants */}
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
```

Register routes in main router:

```tsx
import { AuditRoutes } from './routes/__audit__';

<Routes>
  {/* Regular routes */}
  {import.meta.env.DEV && (
    <Route path="__audit__/*" element={<AuditRoutes />} />
  )}
</Routes>
```

```bash
git add src/audit/routeRegistrar.tsx src/routes/__audit__/*
git commit -m "AI: audit playground + registrar [step-12.2]"
```

Mark Step 12.2 done.

---

### 12.3 Auto-Generate Manifest

Manual manifest maintenance will fail. Create automation:

```js
// scripts/generate-manifest.mjs
import fg from 'fast-glob';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

// Scan for routes
const routeFiles = await fg(['src/routes/**/*.{tsx,jsx}', 'src/pages/**/*.{tsx,jsx}'], { cwd: root });
const routeRegex = /<Route\s+[^>]*path\s*=\s*["'`](\/[^"'`>]*)["'`]/g;
const routes = new Set();

for (const f of routeFiles) {
  const txt = fs.readFileSync(path.join(root, f), 'utf8');
  let m;
  while ((m = routeRegex.exec(txt))) {
    if (!m[1].includes('__audit__')) {
      routes.add(m[1]);
    }
  }
}

// Scan for modals (files ending in Modal.tsx)
const modalFiles = await fg(['src/**/*Modal.{tsx,jsx}'], { cwd: root });
const modals = modalFiles.map(f =>
  path.basename(f).replace(/\.(tsx|jsx)$/, '')
);

// Scan for shared components
const componentFiles = await fg(['src/components/**/*.{tsx,jsx}'], { cwd: root });
const components = componentFiles
  .filter(f => !f.includes('.test.') && !f.includes('.spec.') && !f.includes('.stories.'))
  .map(f => path.basename(f).replace(/\.(tsx|jsx)$/, ''));

// Button types - requires manual curation or convention
const buttons = ['Primary', 'Secondary', 'Tertiary', 'Destructive', 'IconOnly'];

const manifest = {
  routes: Array.from(routes).sort().map(routePath => ({
    path: routePath,
    title: routePath === '/' ? 'Dashboard' :
           routePath.slice(1).split('/')[0]
             .split('-')
             .map(w => w.charAt(0).toUpperCase() + w.slice(1))
             .join(' ')
  })),
  modals: Array.from(new Set(modals)).sort(),
  components: Array.from(new Set(components)).sort(),
  buttons
};

const manifestPath = path.join(root, 'AUDIT/manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

console.log(`✅ Generated manifest:`);
console.log(`   ${routes.size} routes`);
console.log(`   ${modals.length} modals`);
console.log(`   ${components.length} components`);
console.log(`   ${buttons.length} button types`);
```

Update npm scripts:

```json
{
  "scripts": {
    "audit:gen-manifest": "node scripts/generate-manifest.mjs",
    "audit:manifest": "npm run audit:gen-manifest && node scripts/check-manifest.mjs"
  }
}
```

Install dependency:

```bash
npm install -D fast-glob
```

```bash
git add scripts/generate-manifest.mjs package.json
git commit -m "AI: auto-generate manifest from codebase [step-12.3]"
```

Mark Step 12.3 done.

---

### 12.4 Keep manifest authoritative

Whenever new routes/modals/components/buttons are added during development, run:

```bash
npm run audit:gen-manifest
```

Commit updated manifest with your changes.

---

### 12.5 Manifest Completeness Check (CI‑enforced)

Create validation script:

```js
// scripts/check-manifest.mjs
import fg from 'fast-glob';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const manifestPath = path.join(root, 'AUDIT/manifest.json');

if (!fs.existsSync(manifestPath)) {
  console.error('❌ AUDIT/manifest.json not found');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Scan for actual routes
const files = await fg(['src/**/*.{tsx,jsx}'], { cwd: root, dot: true });
const routeRegex = /<Route\s+[^>]*path\s*=\s*["'`](\/[^"'`>]*)["'`]/g;

const found = new Set();
for (const f of files) {
  const txt = fs.readFileSync(path.join(root, f), 'utf8');
  let m;
  while ((m = routeRegex.exec(txt))) {
    if (!m[1].includes('__audit__')) {
      found.add(m[1]);
    }
  }
}

const manifestRoutes = new Set((manifest.routes || []).map(r => r.path));

const missing = [...found].filter(p => !manifestRoutes.has(p));

// Ensure critical routes are included
const required = ['/', '/login', '/password-reset', '/request-access'];
const requiredMissing = required.filter(p => found.has(p) && !manifestRoutes.has(p));

if (missing.length || requiredMissing.length) {
  console.error('❌ Manifest missing routes:');
  [...new Set([...missing, ...requiredMissing])].forEach(r => console.error(`   ${r}`));
  console.error('\n💡 Run: npm run audit:gen-manifest');
  process.exit(1);
}

console.log(`✅ Manifest routes coverage OK: ${manifestRoutes.size} routes listed`);
```

Add to package.json:

```json
{
  "scripts": {
    "audit:manifest": "npm run audit:gen-manifest && node scripts/check-manifest.mjs"
  }
}
```

```bash
git add scripts/check-manifest.mjs package.json
git commit -m "AI: add manifest completeness check [step-12.5]"
```

Mark Step 12 done.

---

## 13) Automated Layout + A11y Tests

Install dependencies:

```bash
npm install -D @playwright/test @axe-core/playwright
npx playwright install --with-deps
```

Add scripts to package.json:

```json
{
  "scripts": {
    "test:audit": "playwright test",
    "test:audit:headed": "playwright test --headed",
    "test:audit:update": "playwright test --update-snapshots",
    "audit:manifest": "npm run audit:gen-manifest && node scripts/check-manifest.mjs"
  }
}
```

---

### 13.1 Page Layout & Accessibility Test

Create `tests/layout.a11y.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import manifest from '../AUDIT/manifest.json';

const viewports = [
  { name: 'iphone-13', width: 390, height: 844 },
  { name: 'iphone-se', width: 375, height: 667 },
  { name: 'ipad', width: 768, height: 1024 },
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'desktop', width: 1920, height: 1080 }
];

const colorModes = ['light', 'dark'];

for (const mode of colorModes) {
  for (const vp of viewports) {
    test.describe(`layout @${vp.name} @${mode}`, () => {
      test.use({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: mode as 'light' | 'dark'
      });

      for (const route of manifest.routes) {
        test(`audit: ${route.path}`, async ({ page }) => {
          await page.goto(route.path);

          // Force color mode
          await page.evaluate((m) => {
            localStorage.setItem('chakra-ui-color-mode', m);
            window.dispatchEvent(new Event('storage'));
          }, mode);
          await page.waitForTimeout(100);

          // 1) No horizontal overflow
          const noOverflow = await page.evaluate(() =>
            document.documentElement.scrollWidth <= window.innerWidth + 1
          );
          expect(noOverflow, 'Horizontal overflow detected').toBeTruthy();

          // 2) Sticky header present & height sane
          const headerH = await page.evaluate(() => {
            const el = document.querySelector('[data-app-header]') as HTMLElement | null;
            if (!el) return -1;
            const r = el.getBoundingClientRect();
            return Math.round(r.height);
          });
          expect(headerH).toBeGreaterThanOrEqual(56);
          expect(headerH).toBeLessThanOrEqual(72);

          // 3) Icon-only tap targets >= 44x44
          const tooSmall = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button, [role="button"]')) as HTMLElement[];
            const iconOnly = btns.filter(b => {
              const hasText = (b.textContent || '').trim().length > 0;
              const hasAria = !!b.getAttribute('aria-label');
              return !hasText && (hasAria || b.querySelector('svg'));
            });
            return iconOnly.filter(b => {
              const r = b.getBoundingClientRect();
              return r.width < 44 || r.height < 44;
            }).length;
          });
          expect(tooSmall, 'Icon buttons <44x44').toBe(0);

          // 4) Overlapping clickable elements heuristic
          const overlaps = await page.evaluate(() => {
            function rect(n: HTMLElement) {
              const r = n.getBoundingClientRect();
              return { x: r.x, y: r.y, r: r.x + r.width, b: r.y + r.height };
            }
            function inter(a: any, b: any) {
              return !(a.r <= b.x || b.r <= a.x || a.b <= b.y || b.b <= a.y);
            }
            const nodes = Array.from(document.querySelectorAll('a, button, [role="button"], [role="link"]')) as HTMLElement[];
            const clickable = nodes.filter(n => getComputedStyle(n).pointerEvents !== 'none');
            const rects = clickable.map(n => ({ n, r: rect(n) }));
            let count = 0;
            for (let i = 0; i < rects.length; i++) {
              for (let j = i + 1; j < rects.length; j++) {
                if (inter(rects[i].r, rects[j].r)) count++;
                if (count > 3) return count;
              }
            }
            return count;
          });
          expect(overlaps, 'Excessive overlaps').toBeLessThanOrEqual(3);

          // 5) Icon sizes in sane range (14-32px)
          const badIcons = await page.evaluate(() => {
            const svgs = Array.from(document.querySelectorAll('svg')) as SVGElement[];
            return svgs.filter(svg => {
              const r = svg.getBoundingClientRect();
              return r.width > 0 && (r.width < 14 || r.width > 32 || r.height < 14 || r.height > 32);
            }).length;
          });
          expect(badIcons, 'Suspicious icon sizes').toBeLessThanOrEqual(2);

          // 6) Baseline left padding (page container)
          const leftEdge = await page.evaluate(() => {
            const pc = document.querySelector('[data-page-container]') as HTMLElement | null;
            if (!pc) return -1;
            return Math.round(pc.getBoundingClientRect().left);
          });
          expect(leftEdge).toBeGreaterThan(8);
          expect(leftEdge).toBeLessThan(40);

          // 7) Clipping heuristic: elements with overflow hidden but content taller
          const clippers = await page.evaluate(() => {
            const all = Array.from(document.querySelectorAll<HTMLElement>('*'));
            const clipped = all.filter(el => {
              const cs = getComputedStyle(el);
              if (!/(hidden|clip)/.test(cs.overflow) && !/(hidden|clip)/.test(cs.overflowY)) return false;
              return el.scrollHeight - el.clientHeight > 6;
            });
            return clipped.length;
          });
          expect(clippers, 'Potentially clipped content').toBeLessThanOrEqual(5);

          // 8) Keyboard focus indicators
          await page.keyboard.press('Tab');
          const hasFocusRing = await page.evaluate(() => {
            const focused = document.activeElement as HTMLElement;
            if (!focused) return false;
            const styles = getComputedStyle(focused);
            return styles.outline !== 'none' ||
                   styles.outlineWidth !== '0px' ||
                   /shadow/.test(styles.boxShadow);
          });
          expect(hasFocusRing, 'No focus indicators').toBeTruthy();

          // 9) Dark mode border visibility
          if (mode === 'dark') {
            const poorContrast = await page.evaluate(() => {
              const header = document.querySelector('[data-app-header]');
              if (!header) return false;
              const border = getComputedStyle(header as HTMLElement).borderBottomColor;
              return border === 'transparent' || border === 'rgba(0, 0, 0, 0)';
            });
            expect(poorContrast, 'Dark mode border not visible').toBeFalsy();
          }

          // 10) Axe accessibility (color-contrast can be noisy)
          const results = await new AxeBuilder({ page })
            .disableRules(['color-contrast'])
            .analyze();
          expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
        });
      }
    });
  }
}
```

---

### 13.2 i18n Coverage Test

Create `tests/i18n.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import manifest from '../AUDIT/manifest.json';

test.describe('i18n coverage', () => {
  for (const route of manifest.routes) {
    test(`no hardcoded strings on ${route.path}`, async ({ page }) => {
      await page.goto(route.path);

      // Heuristic: look for common hardcoded English patterns
      const suspiciousText = await page.evaluate(() => {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null
        );

        const hardcoded: string[] = [];
        let node;

        while (node = walker.nextNode()) {
          const text = (node.textContent || '').trim();
          // Skip empty, numbers-only, or single chars
          if (!text || /^[\d\s\-\+\*\/\.\,]+$/.test(text) || text.length === 1) continue;

          // Flag common English words that should be translated
          if (/\b(Submit|Cancel|Save|Delete|Edit|Search|Filter|Export|Loading|Error)\b/i.test(text)) {
            hardcoded.push(text);
          }
        }

        return hardcoded;
      });

      // Allow up to 3 exceptions (logo text, etc.)
      expect(suspiciousText.length,
        `Found potential hardcoded strings: ${suspiciousText.join(', ')}`
      ).toBeLessThanOrEqual(3);
    });
  }
});
```

---

### 13.3 Modals Test

Create `tests/modals.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import manifest from '../AUDIT/manifest.json';

const viewports = [
  { name: 'iphone-13', width: 390, height: 844 },
  { name: 'laptop', width: 1366, height: 768 }
];

for (const vp of viewports) {
  test.describe(`modals @${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const name of manifest.modals) {
      test(`open ${name}`, async ({ page }) => {
        await page.goto(`/__audit__/modals?open=${encodeURIComponent(name)}`);

        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // Mobile full-screen expectation
        if (vp.width < 768) {
          const size = await dialog.boundingBox();
          expect(size?.width).toBeGreaterThanOrEqual(vp.width - 4);
          expect(size?.height).toBeGreaterThanOrEqual(vp.height - 4);
        }

        // Ensure scroll is inside the modal, not body
        const bodyScrollLocked = await page.evaluate(() =>
          document.scrollingElement!.clientHeight === document.scrollingElement!.scrollHeight
        );
        expect(bodyScrollLocked, 'Body scroll not locked').toBeTruthy();
      });
    }
  });
}
```

---

### 13.4 Test Failure Protocol

When tests fail, follow this protocol:

1. **Capture evidence**: Run `npm run test:audit -- --reporter=html` to get detailed report
2. **Identify the specific assertion** that failed
3. **Fix the UI violation** that caused the failure
4. **Re-run single test**: `npx playwright test --grep "route-name"`
5. **Update baseline if needed**: Only if the design intentionally changed, run `npm run test:audit:update`
6. **Commit fix**: `git commit -am "AI: fix [specific issue] [step-13]"`
7. **Never skip tests**: Do not use `.skip()` or disable checks

If a test is consistently flaky (passes sometimes):
- Add `await page.waitForLoadState('networkidle')` before assertions
- Increase specific timeout: `await expect(element).toBeVisible({ timeout: 10000 })`
- Add `await page.waitForTimeout(500)` after navigation if needed
- If still flaky after 3 attempts, document in `AUDIT.md` with details and continue

**Never proceed to the next step if tests are failing.** Fix the UI first.

```bash
git add tests/*.spec.ts package.json
git commit -m "AI: add Playwright + Axe audit tests (pages/modals/i18n/keyboard) [step-13]"
```

Mark Step 13 done.

---

### 13.5 Bundle Size Check

Install bundle analysis:

```bash
npm install -D @bundle-stats/cli
```

Create `bundle-stats.config.js`:

```js
module.exports = {
  baseline: './baseline-stats.json',
  thresholds: {
    webpack: {
      assets: {
        totalSizeMax: 500000 // 500KB max initial bundle
      }
    }
  }
};
```

Add to package.json:

```json
{
  "scripts": {
    "audit:bundle": "npm run build && npx bundle-stats --json stats.json dist"
  }
}
```

Run once to establish baseline:

```bash
npm run audit:bundle
cp stats.json baseline-stats.json
```

```bash
git add bundle-stats.config.js baseline-stats.json package.json .gitignore
git commit -m "AI: add bundle size monitoring [step-13.5]"
```

Mark Step 13.5 done.

---

## 14) CI: Run Audit on Push/PR

Create `.github/workflows/ui-audit.yml`:

```yaml
name: UI Audit
on:
  push:
    branches: [njnewui]
  pull_request:
    branches: [njnewui]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Check manifest completeness
        run: npm run audit:manifest

      - name: Build application
        run: npm run build

      - name: Run Playwright tests
        run: npm run test:audit

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report
          retention-days: 30

      - name: Check bundle size
        run: npm run audit:bundle
```

```bash
git add .github/workflows/ui-audit.yml
git commit -m "AI: CI audit on push/PR (manifest + tests + bundle) [step-14]"
```

Mark Step 14 done.

---

## 15) Final QA Matrix & Closeout

Create `QA.md` checklist:

```md
# QA Matrix

## Devices Tested
- [ ] iPhone SE (375x667)
- [ ] iPhone 13/14/15 (390x844)
- [ ] iPad (768x1024)
- [ ] Laptop (1366x768)
- [ ] Desktop (1920x1080)

## Color Modes
- [ ] Light mode
- [ ] Dark mode

## Routes (from manifest)
- [ ] All routes listed in `AUDIT/manifest.json` tested
- [ ] No horizontal scroll on any route
- [ ] Sticky header works on all pages
- [ ] Sidebar drawer works on mobile
- [ ] Grid reflows correctly
- [ ] All tap targets >= 44x44
- [ ] Toasts readable
- [ ] Icons properly sized

## Modals
- [ ] All modals full-screen on mobile
- [ ] Scroll inside modal (not body)
- [ ] No overlapping modals

## Customization
- [ ] Brand colors apply correctly
- [ ] Logos show light/dark versions
- [ ] Auth pages use customization colors
- [ ] PDF uses customization colors/logo
- [ ] No other customization supported

## Accessibility
- [ ] All tests pass
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader friendly
- [ ] Reduced motion respected

## Performance
- [ ] Bundle size under threshold
- [ ] Loading skeletons show
- [ ] No layout shifts

## i18n
- [ ] No hardcoded strings detected
- [ ] All user-facing text uses keys
```

```bash
git add QA.md
git commit -m "AI: QA matrix for final verification [step-15]"
```

Update `PROGRESS.md` and `.ai/state.json` (last_completed_step: 15).

Mark Step 15 done.

---

### 15.2 Push & Create PR

After all steps complete and all tests pass:

```bash
# Push to remote
git push origin njnewui

# Create PR via GitHub CLI (if available)
gh pr create \
  --title "UI Overhaul: iOS-like mobile-first design" \
  --body "Implements complete UI audit per playbook. All tests passing." \
  --base main || echo "✅ Create PR manually at GitHub"
```

If PR fails CI:
1. Pull latest: `git pull origin njnewui`
2. Re-run tests locally: `npm run test:audit`
3. Fix violations and commit
4. Push again: `git push origin njnewui`

**Do not merge until CI is green.**

Mark Step 15.2 done. All steps complete! 🎉

---

## Layout & Sizing Reference (Exact Values)

- **Header**: h=60px, sticky, blur 8px, 1px bottom border, px={4}/{6}
- **Secondary toolbar**: h=50px, sticky at top=60px
- **Sidebar (desktop)**: expanded 256px, collapsed 56px; fixed, scrollable; content ml equals width
- **Mobile sidebar**: drawer ~85% width, overlay
- **Page container**: px/py={4}/{6}, maxW="1200px", centered, `[data-page-container]`
- **Grid gaps**: spacing={6} (24px) or gap-6
- **Icons**: 16/20/24 px; sidebar icons 24 px
- **Tap targets**: IconButtons minW/minH >= 44px (Chakra size 11)
- **Modals**: size={{ base:'full', md:'md' }}, scrollBehavior="inside", radius="lg"
- **Breakpoints**: sm 640, md 768, lg 1024, xl 1280, 2xl 1536
- **Overflow guards**: global overflow-x:hidden; wrap tables/grids in overflow-x-auto

---

## Full‑Scope Audit Requirements (No Exceptions)

1. **EVERY ROUTE** in the app must be listed in `AUDIT/manifest.json`
   - The manifest in this file is an EXAMPLE ONLY
   - The manifest check will fail CI if real routes are missing
   - Use `npm run audit:gen-manifest` to auto-generate

2. **EVERY MODAL** must be listed and tested via `/__audit__/modals?open=...`

3. **EVERY SHARED COMPONENT** must be listed and mounted on `/__audit__/components`

4. **EVERY BUTTON TYPE** must be listed and rendered on `/__audit__/buttons`

5. Update `AUDIT/AUDIT.md` for each verified item (keywords only in tables)

---

## Anti‑Regression & Stop Conditions

- If a route/component/modal/button isn't in the manifest, add it and proceed
- If a sub‑step is not applicable, mark **skipped** in PROGRESS.md and continue
- If tests fail, **fix UI immediately**, re-run tests, and commit. Do not ask the user what to do
- If tests are flaky, follow the Test Failure Protocol (Step 13.4)
- Never skip or disable tests without documenting the reason

---

## Definition of Done ✅

- [ ] Zero horizontal overflow on all routes at defined viewports
- [ ] Header & toolbar sticky behaviors verified
- [ ] Sidebar expanded/collapsed + mobile drawer verified
- [ ] Tiles & grids responsive with no clipping
- [ ] Tables responsive (cards on mobile, scroll on desktop)
- [ ] Modals pass mobile full‑screen + scroll‑inside checks
- [ ] Icons standardized; tap targets >= 44×44 everywhere
- [ ] Dark mode contrast acceptable
- [ ] Reduced motion support verified
- [ ] Loading skeletons present for async content
- [ ] Error boundary handles crashes gracefully
- [ ] Customization limited and functional: brand colors/logos, PDF, auth pages only
- [ ] i18n coverage verified (no hardcoded strings)
- [ ] Keyboard navigation works with visible focus indicators
- [ ] Playwright + Axe suite green
- [ ] CI manifest check + audit run on push/PR passing
- [ ] Bundle size under threshold
- [ ] AUDIT ledger complete for pages/components/modals/buttons
- [ ] PR created and CI passing