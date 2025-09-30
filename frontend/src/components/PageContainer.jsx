import React from 'react'
import { Box } from '@chakra-ui/react'

const PageContainer = ({ children, maxW = "1200px", ...props }) => {
  return (
    <Box
      px={{ base: 4, md: 6 }}
      py={{ base: 4, md: 6 }}
      maxW={maxW}
      mx="auto"
      data-page-container
      {...props}
    >
      {children}
    </Box>
  )
}

export default PageContainer