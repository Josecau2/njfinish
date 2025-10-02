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
  Text,
  useBreakpointValue,
  useColorModeValue,
} from '@chakra-ui/react'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import 'react-lazy-load-image-component/src/effects/blur.css'
import { useDispatch, useSelector } from 'react-redux'
import { Pin, PinOff, X } from 'lucide-react'
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
import styles from './AppSidebar.module.css'
import { ICON_BOX_MD } from '../constants/iconSizes'

const AppSidebar = () => {
  const dispatch = useDispatch()
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

  const isDesktop = useBreakpointValue({ base: false, lg: true })
  // Mobile is NEVER collapsed - always show full nav with icons + labels
  const collapsed = isDesktop && !sidebarPinned && sidebarUnfoldable

  const sidebarClassNames = [
    styles.modernSidebar,
    'sidebar',
    'sidebar-dark',
    'border-end',
    collapsed ? styles.sidebarCollapsed : styles.sidebarExpanded,
    sidebarShow ? 'show' : '',
    !collapsed && !sidebarPinned ? 'expanded-temp' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const sidebarBg = customization.sidebarBg || 'slate.900'
  const sidebarColor = customization.sidebarFontColor || 'slate.50'
  const overlayColor = useColorModeValue('blackAlpha.400', 'blackAlpha.600')

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
        lg: collapsed ? "56px" : "256px"  // Desktop: responsive to collapsed state
      }}
      bg={sidebarBg}
      color={sidebarColor}
      borderRight="1px solid"
      borderRightColor="whiteAlpha.100"
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
        borderBottomColor="whiteAlpha.100"
        flexShrink={0}
      >
        <Flex minW={0} flex="1" justify={collapsed ? "center" : "flex-start"}>
          {resolvedLogo ? (
            <>
              {/* Full sidebar logo - visible when expanded */}
              <LazyLoadImage
                src={resolvedLogo}
                alt="Logo"
                className="sidebar-brand-full"
                style={{
                  maxHeight: '40px',
                  maxWidth: '160px',
                  objectFit: 'contain'
                }}
                effect="blur"
                placeholderSrc=""
              />
              {/* Collapsed sidebar logo - visible when collapsed */}
              <LazyLoadImage
                src={resolvedLogo}
                alt="Logo"
                className="sidebar-brand-narrow"
                style={{
                  maxHeight: '28px',
                  maxWidth: '28px',
                  objectFit: 'contain'
                }}
                effect="blur"
                placeholderSrc=""
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
                color="white"
                className="sidebar-brand-full"
              >
                {customization.logoText || 'NJ Cabinets'}
              </Text>
              {/* Collapsed sidebar icon - visible when collapsed */}
              <Icon
                boxSize="28px"
                color={sidebarColor}
                className="sidebar-brand-narrow"
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
          <IconButton size="lg" aria-label="Close sidebar"
            icon={<Icon as={X} boxSize={ICON_BOX_MD} />}
            variant="ghost"
            color="whiteAlpha.800"
            _hover={{ bg: "whiteAlpha.100", color: "white" }}
            minW="44px"
            h="44px"
            onClick={handleClose}
            className={styles.modernSidebarClose}
          />
        )}
      </Flex>

      {/* Sidebar Navigation - matches legacy navigation area */}
      <Box
        flex="1"
        overflowY="auto"
        overflowX="hidden"
        className="sidebar-nav"
        css={{
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'whiteAlpha.200',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'whiteAlpha.300',
          },
        }}
      >
        <AppSidebarNav items={navItems} collapsed={collapsed} onNavigate={handleNavigate} fontColor={sidebarColor} />
      </Box>

      {/* Sidebar Footer - visible on both mobile and desktop */}
      <Flex
        direction="column"
        borderTop="1px solid"
        borderTopColor="whiteAlpha.100"
        flexShrink={0}
        className={styles.modernSidebarFooter}
        p={2}
      >
        {/* Footer buttons row - both buttons side by side when expanded */}
        <Flex align="center" justify="space-between" w="100%" gap={2}>
          {/* Showroom Mode Toggle - Admin only */}
          {isAdmin(user) && !collapsed ? (
            <ShowroomModeToggle compact collapsed={collapsed} />
          ) : (
            <Box flex="1" />
          )}

          {/* Pin button */}
          {collapsed ? (
            <IconButton
              size="sm"
              aria-label={sidebarPinned ? 'Unpin sidebar (enable hover collapse)' : 'Pin sidebar (keep expanded)'}
              icon={<Icon as={sidebarPinned ? PinOff : Pin} boxSize={ICON_BOX_MD} />}
              variant="outline"
              color="whiteAlpha.800"
              borderColor="whiteAlpha.300"
              _hover={{
                bg: "whiteAlpha.100",
                borderColor: "whiteAlpha.500",
                color: "white"
              }}
              onClick={handlePinToggle}
              className="sidebar-footer-pin-btn"
            />
          ) : (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Icon as={sidebarPinned ? PinOff : Pin} boxSize={ICON_BOX_MD} />}
              color="whiteAlpha.800"
              borderColor="whiteAlpha.300"
              flex="1"
              _hover={{
                bg: "whiteAlpha.100",
                borderColor: "whiteAlpha.500",
                color: "white"
              }}
              onClick={handlePinToggle}
              className="sidebar-footer-pin-btn"
              fontSize="xs"
            >
              <Text fontSize="xs" className="pin-label">
                {sidebarPinned ? 'Unpin' : 'Pin'}
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
        // Remove default size to use custom width
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
            // Remove all default Chakra Drawer padding/margin
            '& > *': {
              padding: 0,
              margin: 0,
            }
          }}
          className={sidebarClassNames}
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
      className={sidebarClassNames}
    >
      {SidebarBody}
    </Box>
  )
}

export default AppSidebar
