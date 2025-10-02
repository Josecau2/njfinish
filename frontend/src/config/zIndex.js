/**
 * Z-Index Scale - Centralized z-index management
 * Use these constants instead of hardcoded values
 */

export const zIndex = {
  // Base layers
  base: 0,

  // Standard UI elements
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,

  // Overlays and modals
  modalBackdrop: 1040,
  modal: 1050,
  drawer: 1050,

  // Interactive elements above modals
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
}

// Chakra UI z-index overrides
export const chakraZIndices = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
}

export default zIndex
