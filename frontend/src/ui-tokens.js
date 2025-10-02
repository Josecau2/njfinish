/**
 * UI Tokens - Standardized sizing for icons, tap targets, spacing
 *
 * Per UI Execution Playbook Step 9
 * Based on WCAG 2.1 AA accessibility guidelines for touch targets.
 */

// Icon sizes in Chakra boxSize units (1 unit = 4px)
export const ICON = {
  sm: 4,  // 16px - Non-interactive decorative icons only
  md: 5,  // 20px - Standard icons (recommended)
  lg: 6   // 24px - Large emphasis icons (sidebar icons)
}

// Icon sizes for Lucide React (using 'size' prop)
export const ICON_SIZE = {
  xs: 16,  // Non-interactive decorative icons only
  sm: 20,  // Small icons (borderline for mobile)
  md: 24,  // Standard interactive icons (recommended)
  lg: 32   // Large emphasis icons
}

// Minimum hit target size for accessibility (44px = 11 Chakra units)
export const HIT_MIN = 11 // 44px

// Button sizes (ensures 44x44px minimum for icon buttons)
export const ICON_BUTTON_SIZE = {
  minW: '44px',
  minH: '44px',
}

// Standard spacing units
export const SPACING = {
  xs: 1,   // 4px
  sm: 2,   // 8px
  md: 4,   // 16px
  lg: 6,   // 24px
  xl: 8    // 32px
}

// Grid gaps
export const GRID_GAP = 6 // 24px

// Legacy exports for backward compatibility
export const ICON_SIZE_XS = ICON_SIZE.xs
export const ICON_SIZE_SM = ICON_SIZE.sm
export const ICON_SIZE_MD = ICON_SIZE.md
export const ICON_SIZE_LG = ICON_SIZE.lg
export const ICON_BOX_XS = ICON.sm
export const ICON_BOX_SM = ICON.md
export const ICON_BOX_MD = ICON.lg
export const ICON_BOX_LG = 8 // 32px

export default {
  ICON,
  ICON_SIZE,
  HIT_MIN,
  ICON_BUTTON_SIZE,
  SPACING,
  GRID_GAP,
  // Legacy exports
  ICON_SIZE_XS,
  ICON_SIZE_SM,
  ICON_SIZE_MD,
  ICON_SIZE_LG,
  ICON_BOX_XS,
  ICON_BOX_SM,
  ICON_BOX_MD,
  ICON_BOX_LG,
}