import React, { useCallback } from 'react'
import {
  Box,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  Flex,
  HStack,
  Icon,
  IconButton,
  Stack,
  Text,
  useBreakpointValue,
  useColorModeValue,
} from '@chakra-ui/react'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import 'react-lazy-load-image-component/src/effects/blur.css'
import { useDispatch, useSelector } from 'react-redux'
import { Pin, PinOff, ChevronLeft, ChevronRight, X } from 'lucide-react'
import useNavItems from '../_nav'
import AppSidebarNav from './AppSidebarNav'
import {
  setSidebarShow,
  setSidebarUnfoldable,
  setSidebarPinned,
} from '../store/slices/sidebarSlice'
import ShowroomModeToggle from './showroom/ShowroomModeToggle'
import { resolveBrandAssetUrl } from '../utils/brandAssets'
import { isAdmin } from '../helpers/permissions'

const AppSidebar = () => {
  const dispatch = useDispatch()
  const { sidebarShow, sidebarUnfoldable, sidebarPinned } = useSelector((state) => state.sidebar)
  const customization = useSelector((state) => state.customization)
  const authUser = useSelector((state) => state.auth?.user)
  const navItems = useNavItems()

  const user = authUser || (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  })()

  const isDesktop = useBreakpointValue({ base: false, lg: true })
  const collapsed = !sidebarPinned && sidebarUnfoldable
  const width = collapsed ? 72 : 280

  const sidebarBg = customization.sidebarBg || '#0f172a'
  const sidebarColor = customization.sidebarFontColor || '#f8fafc'
  const borderColor = useColorModeValue('rgba(148,163,184,0.16)', 'rgba(148,163,184,0.24)')
  const overlayColor = useColorModeValue('blackAlpha.400', 'blackAlpha.600')

  const resolvedLogo = resolveBrandAssetUrl(customization.logoImage)

  const handleCollapseToggle = () => {
    if (collapsed) {
      dispatch(setSidebarUnfoldable(false))
    } else {
      dispatch(setSidebarUnfoldable(true))
      dispatch(setSidebarPinned(false))
    }
  }

  const handlePinToggle = () => {
    const next = !sidebarPinned
    dispatch(setSidebarPinned(next))
    if (next) {
      dispatch(setSidebarUnfoldable(false))
    }
  }

  const handleClose = () => dispatch(setSidebarShow(false))

  const handleNavigate = useCallback(
    () => {
      if (!isDesktop) {
        dispatch(setSidebarShow(false))
      }
    },
    [dispatch, isDesktop],
  )

  const handleMouseEnter = () => {
    if (!isDesktop) return
    if (sidebarPinned) return
    if (collapsed) {
      dispatch(setSidebarUnfoldable(false))
    }
  }

  const handleMouseLeave = () => {
    if (!isDesktop) return
    if (sidebarPinned) return
    if (!sidebarUnfoldable) {
      dispatch(setSidebarUnfoldable(true))
    }
  }

  const SidebarBody = (
    <Flex
      direction="column"
      h="100%"
      bg={sidebarBg}
      color={sidebarColor}
      borderRight={`1px solid ${borderColor}`}
      role="navigation"
    >
      <Flex align="center" justify="space-between" px={collapsed ? 2 : 4} py={3} minH="60px">
        <HStack spacing={3} minW={0} flex="1">
          {resolvedLogo ? (
            <LazyLoadImage
              src={resolvedLogo}
              alt="Logo"
              style={{ maxHeight: '32px', maxWidth: '160px', objectFit: 'contain' }}
              effect="blur"
              placeholderSrc=""
            />
          ) : (
            <Text fontWeight="bold" lineHeight="1" noOfLines={1}>
              {customization.logoText || 'NJ Cabinets'}
            </Text>
          )}
        </HStack>
        {!isDesktop && (
          <IconButton
            aria-label="Close sidebar"
            icon={<Icon as={X} boxSize={5} />}
            variant="ghost"
            color={sidebarColor}
            onClick={handleClose}
          />
        )}
      </Flex>

      <Box flex="1" overflowY="auto" px={collapsed ? 1 : 0} py={2}>
        <AppSidebarNav items={navItems} collapsed={collapsed} onNavigate={handleNavigate} />
      </Box>

      <Stack spacing={3} px={collapsed ? 2 : 4} py={4} borderTop={`1px solid ${borderColor}`}>
        {isAdmin(user) && <ShowroomModeToggle compact collapsed={collapsed} />}
        <HStack spacing={2} justify={collapsed ? 'center' : 'space-between'}>
          <IconButton
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            icon={<Icon as={collapsed ? ChevronRight : ChevronLeft} boxSize={5} />}
            variant="ghost"
            color={sidebarColor}
            onClick={handleCollapseToggle}
          />
          <IconButton
            aria-label={sidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
            icon={<Icon as={sidebarPinned ? PinOff : Pin} boxSize={5} />}
            variant="ghost"
            color={sidebarColor}
            onClick={handlePinToggle}
          />
        </HStack>
      </Stack>
    </Flex>
  )

  if (!isDesktop) {
    return (
      <Drawer isOpen={sidebarShow} placement="left" onClose={handleClose} size="xs">
        <DrawerOverlay bg={overlayColor} />
        <DrawerContent maxW="280px">{SidebarBody}</DrawerContent>
      </Drawer>
    )
  }

  return (
    <Box
      as="aside"
      position="sticky"
      top="0"
      h="100vh"
      w={`${width}px`}
      transition="width 0.2s ease"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      zIndex="1010"
    >
      {SidebarBody}
    </Box>
  )
}

export default AppSidebar

