/**
 * Icon Size Constants
 *
 * Standard icon sizes for consistent UI/UX across the application.
 * Based on WCAG 2.1 AA accessibility guidelines for touch targets.
 *
 * Touch Target Requirements:
 * - Minimum interactive element size: 44x44px
 * - Icon alone minimum: 20px (for visibility)
 * - Preferred standard: 24px
 */

// Icon sizes (for Lucide React icons using 'size' prop)
export const ICON_SIZE_XS = 16  // Non-interactive decorative icons only
export const ICON_SIZE_SM = 20  // Small icons (borderline for mobile)
export const ICON_SIZE_MD = 24  // Standard interactive icons (recommended)
export const ICON_SIZE_LG = 32  // Large emphasis icons

// Chakra UI boxSize values (for Icon component using 'boxSize' prop)
export const ICON_BOX_XS = 4    // 16px - Non-interactive only
export const ICON_BOX_SM = 5    // 20px - Small (borderline)
export const ICON_BOX_MD = 6    // 24px - Standard (recommended)
export const ICON_BOX_LG = 8    // 32px - Large

// Button sizes (for IconButton - ensures 44x44px minimum)
export const ICON_BUTTON_SIZE = {
  minW: '44px',
  minH: '44px',
}

// Usage examples:
//
// Lucide icons:
// import { Menu } from 'lucide-react'
// import { ICON_SIZE_MD } from '@/constants/iconSizes'
// <Menu size={ICON_SIZE_MD} />
//
// Chakra Icon component:
// import { Icon } from '@chakra-ui/react'
// import { ICON_BOX_MD } from '@/constants/iconSizes'
// <Icon as={MenuIcon} boxSize={ICON_BOX_MD} />
//
// IconButton (interactive - MUST meet 44x44px):
// import { IconButton } from '@chakra-ui/react'
// import { ICON_SIZE_MD, ICON_BUTTON_SIZE } from '@/constants/iconSizes'
// <IconButton
//   icon={<Menu size={ICON_SIZE_MD} />}
//   {...ICON_BUTTON_SIZE}
//   aria-label="Menu"
// />

export default {
  ICON_SIZE_XS,
  ICON_SIZE_SM,
  ICON_SIZE_MD,
  ICON_SIZE_LG,
  ICON_BOX_XS,
  ICON_BOX_SM,
  ICON_BOX_MD,
  ICON_BOX_LG,
  ICON_BUTTON_SIZE,
}
