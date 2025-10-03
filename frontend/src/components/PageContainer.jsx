import React from 'react'
import { Box } from '@chakra-ui/react'

const DEFAULT_MAX_WIDTH = { base: "100%", xl: "1320px", "2xl": "1480px", "3xl": "1600px" }

/**
 * PageContainer - Consistent container wrapper for page content
 *
 * Provides consistent horizontal padding and max-width constraints.
 * Use this as the top-level wrapper for all pages.
 *
 * When using with PageHeader, pass noContainer={true} to PageHeader to avoid double padding.
 *
 * @param {ReactNode} children - Page content
 * @param {object|string} maxW - Max width (default: responsive 1320px-1600px)
 * @param {object|number} px - Horizontal padding (default: 4 on mobile, 6 on desktop)
 * @param {object|number} py - Vertical padding (default: 4 on mobile, 6 on desktop)
 */
const PageContainer = ({ children, maxW = DEFAULT_MAX_WIDTH, px = { base: 4, md: 6 }, py = { base: 4, md: 6 }, ...props }) => {
  return (
    <Box
      px={px}
      py={py}
      maxW={maxW}
      mx="auto"
      data-page-container
      width="100%"
      {...props}
    >
      {children}
    </Box>
  )
}

export default PageContainer