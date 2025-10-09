import React, { useCallback, useEffect, useRef } from 'react'
import {
  Box,
  Button,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  Flex,
  Icon,
  IconButton,
  Image,
  Text,
  useBreakpointValue,
  useColorModeValue,
} from '@chakra-ui/react'
import { useDispatch, useSelector } from 'react-redux'
import { Pin, PinOff, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
import { ICON_BOX_MD } from '../constants/iconSizes'
import { generateSubtleGradient } from '../utils/colorUtils'

const AppSidebar = () => {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const { sidebarShow, sidebarUnfoldable, sidebarPinned } = useSelector((state) => state.sidebar)
  const customization = useSelector((state) => state.customization)
  const authUser = useSelector((state) => state.auth?.user)
  const navItems = useNavItems()
  const sidebarRef = useRef(null)

  // Close sidebar on outside click for mobile screens - EXACT LEGACY BEHAVIOR
  useEffect(() => {
    if (!sidebarShow) return
    const isMobile = () => (typeof window !== 'undefined' && window.innerWidth < 768)
    if (!isMobile()) return
    const handleOutside = (e) => {
      const el = sidebarRef.current
      if (!el) return
      if (!el.contains(e.target)) {
        dispatch(setSidebarShow(false))
      }
    }
    document.addEventListener('mousedown', handleOutside, true)
    document.addEventListener('touchstart', handleOutside, true)
    return () => {
      document.removeEventListener('mousedown', handleOutside, true)
      document.removeEventListener('touchstart', handleOutside, true)
    }
  }, [sidebarShow, dispatch])

  const user = authUser || (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  })()

  // All color mode values at component top
  const defaultSidebarBg = useColorModeValue('white', 'slate.900')
  const defaultSidebarColor = useColorModeValue('gray.800', 'slate.50')
  const overlayColor = useColorModeValue('blackAlpha.400', 'blackAlpha.600')
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100')

  const isDesktop = useBreakpointValue({ base: false, lg: true })
  // Mobile is NEVER collapsed - always show full nav with icons + labels
  const collapsed = isDesktop && !sidebarPinned && sidebarUnfoldable

  const sidebarBg = customization.sidebarBg || defaultSidebarBg
  const sidebarColor = customization.sidebarFontColor || defaultSidebarColor

  // Pin button uses sidebar colors (not hardcoded gray)
  const pinButtonColor = sidebarColor
  const pinButtonHoverBg = useColorModeValue('blackAlpha.50', 'whiteAlpha.100')
  const pinButtonBorderColor = borderColor

  // Generate gradient only if we have a hex color (not Chakra token)
  const sidebarGradient = generateSubtleGradient(customization.sidebarBg, 'to bottom')

  const resolvedLogo = resolveBrandAssetUrl(customization.logoImage)

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

  // EXACT LEGACY HOVER BEHAVIOR - using 992px breakpoint not isDesktop
  const handleMouseEnter = useCallback(() => {
    if (window.innerWidth < 992) return
    if (sidebarPinned) return
    // Only expand if currently narrow/collapsed
    if (sidebarUnfoldable) {
      dispatch(setSidebarUnfoldable(false))
    }
  }, [dispatch, sidebarUnfoldable, sidebarPinned])

  const handleMouseLeave = useCallback(() => {
    if (window.innerWidth < 992) return
    if (sidebarPinned) return
    // Collapse back after leaving if it was auto-expanded
    if (!sidebarUnfoldable) {
      dispatch(setSidebarUnfoldable(true))
    }
  }, [dispatch, sidebarUnfoldable, sidebarPinned])

  const SidebarBody = (
    <Flex
      ref={sidebarRef}
      direction="column"
      h="100vh"
      w={{
        base: "100%",  // Mobile: full width of drawer (280px)
        lg: collapsed ? "72px" : "256px"  // Desktop: 72px collapsed for better icon centering
      }}
      bgGradient={sidebarGradient}
      bg={sidebarGradient ? undefined : sidebarBg}
      color={sidebarColor}
      borderRight="1px solid"
      borderRightColor={borderColor}
      borderTopRightRadius={{ base: 0, lg: "16px" }}
      borderBottomRightRadius={{ base: 0, lg: "16px" }}
      boxShadow="2xl"
      role="navigation"
      transition="width 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
      overflow="hidden"
    >
      {/* Sidebar Header - matches legacy CSidebarHeader */}
      <Flex
        align="center"
        justify="space-between"
        px={collapsed ? 0 : 4}
        py={3}
        h="60px"
        borderBottom="1px solid"
        borderBottomColor={borderColor}
        flexShrink={0}
      >
        <Flex minW={0} flex="1" justify={collapsed ? "center" : "flex-start"}>
          {resolvedLogo ? (
            <>
              {/* Full sidebar logo - visible when expanded */}
              <Image
                src={resolvedLogo}
                alt="Logo"
                display={collapsed ? "none" : "block"}
                maxH="40px"
                maxW="160px"
                objectFit="contain"
                loading="lazy"
              />
              {/* Collapsed sidebar logo - visible when collapsed */}
              <Image
                src={resolvedLogo}
                alt="Logo"
                display={collapsed ? "block" : "none"}
                maxH="28px"
                maxW="28px"
                objectFit="contain"
                loading="lazy"
              />
            </>
          ) : (
            <>
              {/* Full sidebar text - visible when expanded */}
              <Text
                fontWeight="bold"
                fontSize="lg"
                lineHeight="1"
                noOfLines={1}
                color={sidebarColor}
                display={collapsed ? "none" : "block"}
              >
                {customization.logoText || 'NJ Cabinets'}
              </Text>
              {/* Collapsed sidebar icon - visible when collapsed */}
              <Icon
                boxSize="28px"
                color={sidebarColor}
                display={collapsed ? "block" : "none"}
                as={() => (
                  <svg viewBox="0 0 118 46" xmlns="http://www.w3.org/2000/svg">
                    <path fill="currentColor" d="M0 0h118v46H0z"/>
                  </svg>
                )}
              />
            </>
          )}
        </Flex>
        {!isDesktop && (
          <IconButton
            size="lg"
            aria-label={t('common.ariaLabels.closeSidebar', 'Close sidebar')}
            icon={<Icon as={X} boxSize={ICON_BOX_MD} />}
            variant="ghost"
            color={pinButtonColor}
            _hover={{ bg: pinButtonHoverBg }}
            minW="44px"
            h="44px"
            onClick={handleClose}
          />
        )}
      </Flex>

      {/* Sidebar Navigation - matches legacy navigation area */}
      {/* SimpleBar inside AppSidebarNav handles scrolling, so we just need flex container */}
      <Box
        flex="1"
        minH="0"
      >
        <AppSidebarNav items={navItems} collapsed={collapsed} onNavigate={handleNavigate} fontColor={sidebarColor} sidebarBg={sidebarBg} />
      </Box>

      {/* Sidebar Footer - visible on both mobile and desktop */}
      <Flex
        direction="column"
        borderTop="1px solid"
        borderTopColor={borderColor}
        flexShrink={0}
        p={2}
      >
        {/* Footer buttons row - both buttons side by side when expanded */}
        <Flex align="center" justify={collapsed ? "center" : "space-between"} w="100%" gap={2}>
          {/* Showroom Mode Toggle - Admin only */}
          {isAdmin(user) && !collapsed ? (
            <ShowroomModeToggle compact collapsed={collapsed} />
          ) : (
            !collapsed && <Box flex="1" />
          )}

          {/* Pin button */}
          {collapsed ? (
            <IconButton
              size="sm"
              aria-label={sidebarPinned ? 'Unpin sidebar (enable hover collapse)' : 'Pin sidebar (keep expanded)'}
              icon={<Icon as={sidebarPinned ? PinOff : Pin} boxSize={ICON_BOX_MD} />}
              variant="outline"
              color={pinButtonColor}
              borderColor={pinButtonBorderColor}
              _hover={{
                bg: pinButtonHoverBg,
                borderColor: pinButtonBorderColor
              }}
              onClick={handlePinToggle}
            />
          ) : (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Icon as={sidebarPinned ? PinOff : Pin} boxSize={ICON_BOX_MD} />}
              color={pinButtonColor}
              borderColor={pinButtonBorderColor}
              flex="1"
              _hover={{
                bg: pinButtonHoverBg,
                borderColor: pinButtonBorderColor
              }}
              onClick={handlePinToggle}
              fontSize="xs"
            >
              <Text fontSize="xs">
                {sidebarPinned ? t('nav.sidebar.unpin') : t('nav.sidebar.pin')}
              </Text>
            </Button>
          )}
        </Flex>
      </Flex>
    </Flex>
  )

  if (!isDesktop) {
    return (
      <Drawer
        isOpen={sidebarShow}
        placement="left"
        onClose={handleClose}
      >
        <DrawerOverlay bg={overlayColor} />
        <DrawerContent
          maxW="280px"
          w="85vw"
          p={0}
          m={0}
          bg="transparent"
          boxShadow="none"
          overflow="hidden"
          sx={{
            '& > *': {
              padding: 0,
              margin: 0,
            }
          }}
        >
          {SidebarBody}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Box
      as="aside"
      position="fixed"
      top="0"
      left="0"
      h="100vh"
      w={collapsed ? "56px" : "256px"}
      transition="width 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      zIndex="1050"
    >
      {SidebarBody}
    </Box>
  )
}

export default AppSidebar
