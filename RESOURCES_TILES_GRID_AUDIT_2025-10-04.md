# Resources Tiles Grid Audit - 2025-10-04

**Scope:** `/resources` category tiles grid (`frontend/src/pages/Resources/index.jsx`).

## Confirmed Issues

- **Admin hover controls never reveal:** Category cards rely on `_groupHover` to fade in the admin action buttons (`frontend/src/pages/Resources/index.jsx:1178`), but `StandardCard` never declares itself as a hover group (`frontend/src/components/StandardCard.jsx:48`). Without `role="group"` or `data-group`, Chakra never applies the hover style, so the action icons remain at 0.7 opacity on desktop and tablet.
- **Keyboard focus outline is clipped:** The card body forces `overflow="hidden"` (`frontend/src/pages/Resources/index.jsx:1229`) while each preview row is focusable via `tabIndex={0}` (`frontend/src/pages/Resources/index.jsx:1310`). On both desktop and mobile, the focus ring and box shadow are cut off at the card edges, which is noticeable when tabbing through the preview list.
- **Long preview labels overflow in narrow layouts:** Preview labels render inside a flex row without any wrapping or truncation (`frontend/src/pages/Resources/index.jsx:1334`). When a link lacks a title the raw URL is shown, and long, unbroken URLs extend past the available width; on mobile this spills horizontally and then gets hard-clipped by the parent overflow.
- **Fallback accent color generates invalid CSS tokens:** The accent color falls back to the theme token `blue.600` until branding data loads (`frontend/src/pages/Resources/index.jsx:346`). The card then appends hex-like suffixes (`${color}15`, `${color}20`) for gradients and icon backgrounds (`frontend/src/pages/Resources/index.jsx:1143`, `1156`), producing values like `blue.60020` that Chakra cannot resolve. During that initial render the gradient overlay and badge background disappear on both desktop and mobile until customization data arrives.

## Working Aspects Observed

- Responsive `SimpleGrid` breakpoints (`base` -> `xl`) keep tiles aligned without overlap (`frontend/src/pages/Resources/index.jsx:1101`).
- Card structure uses flex columns so headers, bodies, and footers stay balanced even when previews are missing (`frontend/src/pages/Resources/index.jsx:1117-1372`).
