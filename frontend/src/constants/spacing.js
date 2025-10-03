/**
 * Spacing Scale Constants
 *
 * Consistent spacing values to use across the application.
 * These correspond to Chakra UI's spacing scale (1 unit = 0.25rem = 4px)
 *
 * Usage:
 * import { SPACING } from '../constants/spacing'
 * <Stack spacing={SPACING.md}>...</Stack>
 */

export const SPACING = {
  xs: 2,   // 8px - Tight spacing for related items
  sm: 4,   // 16px - Default spacing for form fields, cards
  md: 6,   // 24px - Spacing between sections
  lg: 8,   // 32px - Large spacing between major sections
  xl: 12,  // 48px - Extra large spacing for page-level separation
}

/**
 * Gap values for Flex and Grid layouts
 * Same scale as SPACING for consistency
 */
export const GAP = {
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
}

/**
 * Common spacing patterns for reuse
 */
export const SPACING_PATTERNS = {
  // Stack spacing for form fields
  formFields: SPACING.sm,

  // Stack spacing for card sections
  cardSections: SPACING.md,

  // Stack spacing for page sections
  pageSections: SPACING.lg,

  // HStack spacing for buttons
  buttonGroup: 4,

  // Grid spacing for cards
  cardGrid: SPACING.md,
}
