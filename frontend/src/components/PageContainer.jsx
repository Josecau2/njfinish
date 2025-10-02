import React from 'react'
import { Box } from '@chakra-ui/react'

const DEFAULT_MAX_WIDTH = { base: "100%", xl: "1320px", "2xl": "1480px", "3xl": "1600px" }

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