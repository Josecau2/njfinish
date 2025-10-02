import React, { useMemo } from 'react'
import { Box, Flex } from '@chakra-ui/react'
import { useSelector } from 'react-redux'
import { AppSidebar } from '../components/AppSidebar'
import { AppHeader } from '../components/AppHeader'

const AppShell = ({ children }) => {
  const { sidebarUnfoldable, sidebarPinned } = useSelector((state) => state.sidebar)

  // Calculate sidebar width based on state
  const sidebarWidth = useMemo(() => {
    const collapsed = !sidebarPinned && sidebarUnfoldable
    return collapsed ? "56px" : "256px"
  }, [sidebarPinned, sidebarUnfoldable])

  return (
    <Box minH="100vh" className="app-shell">
      <AppSidebar />
      <Box
        minW="0"
        flex="1"
        ml={{ base: 0, lg: sidebarWidth }}
        transition="margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
        className="content-wrapper"
      >
        <Flex direction="column" minH="100vh">
          <AppHeader data-app-header />
          <Box flex="1" minW="0" className="main-content">
            {children}
          </Box>
        </Flex>
      </Box>
    </Box>
  )
}

export default AppShell