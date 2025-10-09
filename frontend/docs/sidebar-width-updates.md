# Sidebar Width & Label Wrapping Update

Date: (auto-generated)

## Summary
Implemented wider sidebar and unified collapsed width to prevent clipping of longer (Spanish) navigation labels.

## Changes
1. Added `constants/layout.js` exposing:
   - `SIDEBAR_WIDTH_COLLAPSED = 72px` (previous mismatch 56px vs 72px removed)
   - `SIDEBAR_WIDTH_EXPANDED = 280px` (was 256px)
   - `getSidebarWidth(collapsed)` helper.
2. Updated `AppSidebar`, `AppShell`, `DefaultLayout` to use the constants.
3. Enabled two-line wrapping for nav labels in `AppSidebarNav` using CSS line clamp (2 lines) instead of `white-space: nowrap`.
4. Added adaptive, low-visibility scrollbar styling (hover to reveal) in `AppSidebarNav` for a cleaner look on desktop; mobile touch scrolling unaffected.

## Rationale
Spanish (and other localized) labels are often longer; fixed 256px width + forced nowrap caused truncation/clipping or overflow. Increasing width and allowing up to two lines balances readability with vertical compactness.

## How To Adjust Further
Edit `frontend/src/constants/layout.js` and change `SIDEBAR_WIDTH_EXPANDED` (and/or introduce a responsive object) then reuse `getSidebarWidth` where needed.

## Accessibility
Two-line clamp still exposes full text to assistive tech (no aria changes needed). If future truncation requires tooltips, consider adding a Tooltip only when label length exceeds a threshold.

## Follow Ups (Optional)
- Evaluate if any very long labels still need tooltips.
- Consider responsive widths (e.g., 260px @ lg, 288px @ 2xl) if design space permits.
 - If you prefer completely hidden scrollbars until scroll, add a small JS intersection observer; current solution uses pure CSS hover for simplicity.
