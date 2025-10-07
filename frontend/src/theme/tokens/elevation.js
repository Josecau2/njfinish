/**
 * Elevation System - Shadows and Z-Index Layers
 *
 * Premium shadow definitions for depth and hierarchy
 * All shadows use theme-aware colors for light/dark mode compatibility
 */

export const elevation = {
  // ============================================================================
  // SHADOW SYSTEM - Depth and elevation
  // ============================================================================
  shadows: {
    // Minimal depth
    xs: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',

    // Subtle elevation
    sm: '0 2px 4px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -1px rgba(15, 23, 42, 0.06)',

    // Standard cards
    md: '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.08)',

    // Elevated cards and dropdowns
    lg: '0 10px 15px -3px rgba(15, 23, 42, 0.10), 0 4px 6px -4px rgba(15, 23, 42, 0.10)',

    // Popovers and floating elements
    xl: '0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.12)',

    // Modals and overlays
    '2xl': '0 25px 50px -12px rgba(15, 23, 42, 0.25)',

    // Special effects - Brand glow
    glow: '0 0 15px rgba(37, 99, 235, 0.3)',
    glowStrong: '0 0 30px rgba(37, 99, 235, 0.4)',

    // Inset shadows for pressed states
    inset: 'inset 0 2px 4px 0 rgba(15, 23, 42, 0.06)',

    // Outline for focus states
    outline: '0 0 0 3px rgba(37, 99, 235, 0.1)',
    outlineError: '0 0 0 3px rgba(239, 68, 68, 0.1)',
    outlineSuccess: '0 0 0 3px rgba(34, 197, 94, 0.1)',
  },

  // ============================================================================
  // Z-INDEX LAYERS - Stacking context
  // ============================================================================
  layers: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    toast: 1080,
  },

  // ============================================================================
  // BLUR EFFECTS - Glassmorphism
  // ============================================================================
  blur: {
    none: '0',
    sm: 'blur(4px)',
    md: 'blur(8px)',
    lg: 'blur(12px)',
    xl: 'blur(16px)',
  },
}

// Helper function to get shadow for light/dark mode
export const getShadow = (size = 'md', colorMode = 'light') => {
  const shadow = elevation.shadows[size]

  if (colorMode === 'dark') {
    // In dark mode, shadows are more subtle
    return shadow.replace(/rgba\(15, 23, 42/g, 'rgba(0, 0, 0')
  }

  return shadow
}
