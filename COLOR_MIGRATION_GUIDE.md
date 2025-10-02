# Color Migration Guide

## Overview
This guide documents the migration from 265+ hardcoded hex colors to Chakra UI semantic tokens for better theming, dark mode support, and maintainability.

## New Semantic Color Tokens

### Base Colors
| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `background` | #F8FAFC | #0f172a | Page backgrounds |
| `surface` | #FFFFFF | #111827 | Card/modal backgrounds |
| `text` | #0f172a | #E2E8F0 | Primary text |
| `textStrong` | #212529 | #ffffff | Emphasized text |
| `textSubtle` | #6c757d | #a0a0a0 | Secondary text |
| `muted` | #64748B | #94A3B8 | Disabled/muted text |

### Background Variants
| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `bgSubtle` | #f8f9fa | #1a1a1a | Subtle backgrounds |
| `bgHover` | #e9ecef | #2a2a2a | Hover states |
| `bgActive` | #dee2e6 | #3a3a3a | Active states |

### Borders
| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `border` | rgba(15,23,42,0.08) | rgba(148,163,184,0.24) | Default borders |
| `borderSubtle` | #e9ecef | rgba(255,255,255,0.1) | Subtle borders |
| `borderStrong` | #dee2e6 | rgba(255,255,255,0.2) | Emphasized borders |

### Status Colors
| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `success` | #28a745 | #4ade80 | Success indicators |
| `successBg` | #d4edda | rgba(74,222,128,0.2) | Success backgrounds |
| `error` | #dc3545 | #f87171 | Error indicators |
| `errorBg` | #f8d7da | rgba(248,113,113,0.2) | Error backgrounds |
| `warning` | #ffc107 | #fbbf24 | Warning indicators |
| `warningBg` | #fff3cd | rgba(251,191,36,0.2) | Warning backgrounds |
| `info` | #17a2b8 | #06b6d4 | Info indicators |
| `infoBg` | #d1ecf1 | rgba(6,182,212,0.2) | Info backgrounds |

### Component Colors
| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `cardBg` | #ffffff | #1e293b | Card backgrounds |
| `cardBorder` | rgba(0,0,0,0.125) | rgba(255,255,255,0.1) | Card borders |
| `inputBg` | #ffffff | #1e293b | Input backgrounds |
| `inputBorder` | #ced4da | rgba(255,255,255,0.2) | Input borders |
| `inputFocus` | #80bdff | #3b82f6 | Input focus ring |
| `modalOverlay` | rgba(0,0,0,0.5) | rgba(0,0,0,0.7) | Modal overlays |

### Legacy Bootstrap Colors
| Token | Light Mode | Dark Mode | Replaces |
|-------|-----------|-----------|----------|
| `primary` | #007bff | #3b82f6 | #007bff, #0056b3 |
| `primaryHover` | #0056b3 | #2563eb | #0056b3 |
| `secondary` | #6c757d | #94a3b8 | #6c757d |
| `light` | #f8f9fa | #374151 | #f8f9fa |
| `dark` | #343a40 | #1f2937 | #343a40 |

## Migration Patterns

### CSS Files
```css
/* Before */
.card {
  background: #ffffff;
  border: 1px solid #dee2e6;
  color: #212529;
}

/* After - Using CSS Variables */
.card {
  background: var(--chakra-colors-cardBg);
  border: 1px solid var(--chakra-colors-borderStrong);
  color: var(--chakra-colors-textStrong);
}
```

### JSX/React Components (Chakra UI)
```jsx
// Before
<Box bg="#ffffff" borderColor="#dee2e6" color="#212529">

// After - Using semantic tokens
<Box bg="cardBg" borderColor="borderStrong" color="textStrong">
```

### JSX/React Components (useColorModeValue)
```jsx
// Before
const bgColor = '#ffffff'

// After - Dark mode support
import { useColorModeValue } from '@chakra-ui/react'
const bgColor = useColorModeValue('cardBg', 'cardBg')
// OR directly use token
const bgColor = 'cardBg' // Token handles both modes automatically
```

## Color Replacement Map

### Most Common Hardcoded Colors (Top 30)

| Hex Color | Count | Semantic Token | Notes |
|-----------|-------|----------------|-------|
| #f8f9fa | 19 | `bgSubtle` or `light` | Background subtle |
| #e9ecef | 14 | `bgHover` or `borderSubtle` | Borders/hover |
| #dee2e6 | 6 | `bgActive` or `borderStrong` | Borders/active |
| #ffffff | 13 | `surface` or `cardBg` | White backgrounds |
| #212529 | 2 | `textStrong` | Strong text |
| #6c757d | 7 | `textSubtle` or `secondary` | Muted text |
| #495057 | 7 | `muted` | Muted elements |
| #343a40 | 4 | `dark` | Dark backgrounds |
| #007bff | 6 | `primary` | Primary blue |
| #0056b3 | 3 | `primaryHover` | Primary hover |
| #1a73e8 | 8 | `brand.500` | Brand blue |
| #28a745 | 3 | `success` | Success green |
| #dc3545 | 2 | `error` | Error red |
| #ffc107 | 1 | `warning` | Warning yellow |
| #17a2b8 | 3 | `info` | Info teal |
| #d4edda | 1 | `successBg` | Success backgrounds |
| #f8d7da | 1 | `errorBg` | Error backgrounds |
| #fff3cd | 1 | `warningBg` | Warning backgrounds |
| #d1ecf1 | 1 | `infoBg` | Info backgrounds |
| #ced4da | 1 | `inputBorder` | Input borders |
| #80bdff | 1 | `inputFocus` | Focus state |
| #667eea | 9 | `brand.400` | Gradient start |
| #764ba2 | 5 | `brand.600` | Gradient end |
| #1f2937 | 3 | `dark` | Dark gray |
| #6b7280 | 2 | `textSubtle` | Gray text |

## Migration Priority

### Phase 1: High-Impact Files (COMPLETED)
- ✅ `frontend/src/theme/index.js` - Added semantic tokens

### Phase 2: Core CSS Files (IN PROGRESS)
- [ ] `frontend/src/main.css` - 79 hardcoded colors
- [ ] `frontend/src/responsive.css` - 103 hardcoded colors
- [ ] `frontend/src/styles/modals.css` - Update to use tokens

### Phase 3: Component Styles
- [ ] `frontend/src/pages/calender/CalendarView.css`
- [ ] `frontend/src/components/AppSidebar.module.css`
- [ ] Individual component CSS files

### Phase 4: JSX Inline Styles (44 instances)
- [ ] Convert to Chakra prop colors or useColorModeValue
- [ ] Focus on high-visibility components first

## Benefits

### 1. Dark Mode Support
All semantic tokens automatically support dark mode via Chakra's color mode system.

### 2. Centralized Theming
Single source of truth for colors in `theme/index.js`.

### 3. Better Maintainability
Changing "success green" requires updating one token, not 20+ files.

### 4. Improved Accessibility
Semantic tokens can be adjusted for WCAG compliance globally.

### 5. Brand Customization
Easy brand color overrides without touching component code.

## Usage Examples

### In CSS Files
```css
/* Use CSS custom properties */
.my-component {
  background: var(--chakra-colors-cardBg);
  color: var(--chakra-colors-text);
  border: 1px solid var(--chakra-colors-border);
}

.my-component:hover {
  background: var(--chakra-colors-bgHover);
}
```

### In Chakra Components
```jsx
import { Box, Button, Card } from '@chakra-ui/react'

// Semantic tokens work directly
<Box bg="surface" color="text" borderColor="border">
  <Card bg="cardBg" borderColor="cardBorder">
    Content
  </Card>
</Box>

<Button colorScheme="brand" bg="primary">
  Primary Action
</Button>
```

### With Dark Mode
```jsx
import { useColorModeValue } from '@chakra-ui/react'

function MyComponent() {
  // Semantic tokens handle this automatically, but for custom values:
  const customBg = useColorModeValue('#custom-light', '#custom-dark')

  // Better: Use semantic tokens directly
  return (
    <Box bg="surface" color="text">
      Automatically adapts to dark mode!
    </Box>
  )
}
```

## Migration Checklist

- [x] Create semantic color tokens in theme
- [x] Remove !important declarations blocking theming
- [ ] Migrate main.css hardcoded colors (79)
- [ ] Migrate responsive.css hardcoded colors (103)
- [ ] Migrate CalendarView.css
- [ ] Migrate component CSS modules
- [ ] Convert JSX inline styles to Chakra props
- [ ] Test dark mode across all migrated components
- [ ] Update design system documentation

## References

- Chakra UI Semantic Tokens: https://chakra-ui.com/docs/styled-system/semantic-tokens
- Color Mode: https://chakra-ui.com/docs/styled-system/color-mode
- Theme Reference: `frontend/src/theme/index.js`
