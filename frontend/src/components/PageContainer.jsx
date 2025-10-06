import React from 'react'
import { Box } from '@chakra-ui/react'

export const PAGE_CONTAINER_CONSTRAINED_WIDTH = { base: "100%", xl: "1320px", "2xl": "1480px", "3xl": "1600px" }

const DEFAULT_MAX_WIDTH = "100%"
const DEFAULT_PADDING_X = { base: 4, md: 6 }
const DEFAULT_PADDING_Y = { base: 4, md: 6 }

/**
 * PageContainer - Consistent container wrapper for page content
 *
 * Provides consistent horizontal padding and max-width constraints.
 * Use this as the top-level wrapper for all pages.
 *
 * When using with PageHeader, pass noContainer={true} to PageHeader to avoid double padding.
 *
 * @param {ReactNode} children - Page content
 * @param {object|string} maxW - Max width (default: 100%)
 * @param {object|number} px - Horizontal padding (default: 4 on mobile, 6 on desktop)
 * @param {object|number} py - Vertical padding (default: 4 on mobile, 6 on desktop)
 */
const PageContainer = ({ children, maxW = DEFAULT_MAX_WIDTH, px = DEFAULT_PADDING_X, py = DEFAULT_PADDING_Y, ...props }) => {
  return (
    <Box
      px={px}
      py={py}
      maxW={maxW}
      width="100%"
      mx="auto"
      data-page-container
      {...props}
    >
      {children}
    </Box>
  )
}

export default PageContainer
