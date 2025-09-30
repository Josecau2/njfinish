import React from 'react'
import { Box, Flex } from '@chakra-ui/react'
import { AppSidebar } from '../components/AppSidebar'
import { AppHeader } from '../components/AppHeader'

const AppShell = ({ children }) => {
  return (
    <Box minH="100vh" className="app-shell">
      <AppSidebar />
      <Box
        minW="0"
        flex="1"
        ml={{ base: 0, lg: "auto" }}
        className="content-wrapper"
      >
        <Flex direction="column" minH="100vh">
          <AppHeader data-app-header />
          <Box as="main" flex="1" minW="0" className="main-content">
            {children}
          </Box>
        </Flex>
      </Box>
    </Box>
  )
}

export default AppShell