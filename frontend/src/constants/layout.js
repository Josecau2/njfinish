// Centralized layout sizing constants for sidebar and responsive adjustments
// Expanded width slightly increased to accommodate longer (e.g., Spanish) labels.
// Collapsed width unified at 72px (was 56/72 mismatch) for better icon centering and consistency.

export const SIDEBAR_WIDTH_COLLAPSED = '72px'
// Provide a single expanded width for now; can be made responsive later if needed.
export const SIDEBAR_WIDTH_EXPANDED = '280px'

// Helper that returns width based on collapsed boolean
export const getSidebarWidth = (collapsed) => (collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED)
