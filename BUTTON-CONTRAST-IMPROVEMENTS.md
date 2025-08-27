## Button Contrast Improvements

I've improved the button contrast in the headers and throughout the application by making the following changes to `frontend/src/responsive.css`:

### Changes Made:

1. **Added gray-50 color variable**:
   - Added `--cui-gray-50: #f9fafb;` for better light backgrounds

2. **Improved page header buttons** (like "Create Proposal", "Export Order"):
   - Changed from almost transparent `rgba(255, 255, 255, 0.9)` to solid white background
   - Added visible border `1px solid var(--cui-border-color)`
   - Added subtle shadow for depth
   - Enhanced hover state with darker colors and better shadow

3. **Enhanced tab buttons contrast**:
   - Changed from translucent border to solid `var(--cui-gray-300)` border
   - Added subtle shadow for better visibility
   - Added hover state for better interaction feedback

4. **Fixed light buttons globally**:
   - Added specific `.btn-light` styles with proper contrast
   - Solid white background with visible borders
   - Clear hover states with darker colors

### Results:
- ✅ Header buttons now have clear visibility against light backgrounds
- ✅ Tab buttons are more distinguishable
- ✅ All light-colored buttons have better contrast
- ✅ Maintains the modern, clean design while improving usability

The changes ensure that all buttons in headers are clearly visible and accessible, especially the "Create Proposal" and "Export Order" buttons that were previously hard to see due to their light appearance on light backgrounds.
