import React, { useCallback, useEffect, useRef } from 'react'
import {
  Box,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  Flex,
  HStack,
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

const AppSidebar = () => {
  const dispatch = useDispatch()
  const { sidebarShow, sidebarUnfoldable, sidebarPinned } = useSelector((state) => state.sidebar)
  const customization = useSelector((state) => state.customization)
  const authUser = useSelector((state) => state.auth?.user)
  const navItems = useNavItems()
  const sidebarRef = useRef(null)

  // Add mobile sidebar styles to match legacy behavior
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      /* Mobile-optimized sidebar CSS - matches legacy */
      .modern-sidebar {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        z-index: 1040;
        border-right: 1px solid rgba(255, 255, 255, 0.1);
      }

      .modern-sidebar__header {
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .modern-sidebar__brand {
        display: flex;
        align-items: center;
        text-decoration: none;
        color: inherit;
        min-width: 0;
        flex: 1;
      }

      .modern-sidebar__close {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.8);
        font-size: 1.25rem;
        padding: 0.5rem;
        cursor: pointer;
        border-radius: 4px;
        min-width: 44px;
        min-height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .modern-sidebar__close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }

      .modern-sidebar__footer {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 56px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      /* Match legacy sidebar navigation styling */
      .sidebar-nav {
        color: inherit;
        padding: 0;
      }

      .sidebar-brand-full {
        color: #fff;
        cursor: pointer;
      }

      .sidebar-footer-pin-btn {
        font-size: 0.875rem;
      }

      .pin-label {
        margin-left: 0.25rem;
      }

      /* Ensure perfect icon alignment in collapsed mode */
      .modern-sidebar .chakra-stack {
        width: 100% !important;
      }

      .modern-sidebar .chakra-stack > * {
        width: 100% !important;
      }

      /* Force center alignment for collapsed sidebar items */
      .modern-sidebar .sidebar-nav .chakra-stack > .chakra-box {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0.5rem 0 !important;
      }

      /* Collapsed sidebar button centering */
      .modern-sidebar .sidebar-nav button {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 100% !important;
        margin: 0 !important;
      }

      /* Menu button centering in collapsed mode */
      .modern-sidebar .sidebar-nav .chakra-menu__menu-button {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 100% !important;
        margin: 0 !important;
      }

      /* Mobile adjustments */
      @media (max-width: 767.98px) {
        .modern-sidebar__close {
          display: flex;
        }

        .modern-sidebar__footer {
          display: none;
        }
      }

      /* Desktop adjustments */
      @media (min-width: 992px) {
        .modern-sidebar__close {
          display: none;
        }

        .modern-sidebar__footer {
          display: flex;
        }
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

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
  const collapsed = !sidebarPinned && sidebarUnfoldable

  const sidebarClassNames = [
    'modern-sidebar',
    'sidebar',
    'sidebar-dark',
    'border-end',
    collapsed ? 'sidebar-narrow' : '',
    sidebarShow ? 'show' : '',
    !collapsed && !sidebarPinned ? 'expanded-temp' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const sidebarBg = customization.sidebarBg || '#0f172a'
  const sidebarColor = customization.sidebarFontColor || '#f8fafc'
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
      w={collapsed ? "56px" : "256px"}
      bg={sidebarBg}
      color={sidebarColor}
      borderRight="1px solid rgba(255, 255, 255, 0.1)"
      role="navigation"
      transition="width 0.15s ease-in-out"
      overflow="hidden"
    >
      {/* Sidebar Header - matches legacy CSidebarHeader */}
      <Flex
        align="center"
        justify="space-between"
        px={4}
        py={3}
        h="60px"
        borderBottom="1px solid rgba(255, 255, 255, 0.1)"
        flexShrink={0}
      >
        <HStack spacing={3} minW={0} flex="1">
          {collapsed ? (
            <Icon
              boxSize="28px"
              color={sidebarColor}
              as={() => (
                <svg viewBox="0 0 118 46" xmlns="http://www.w3.org/2000/svg">
                  <path fill="currentColor" d="M0 0h118v46H0z"/>
                </svg>
              )}
            />
          ) : resolvedLogo ? (
            <LazyLoadImage
              src={resolvedLogo}
              alt="Logo"
              style={{
                maxHeight: '32px',
                maxWidth: '160px',
                objectFit: 'contain'
              }}
              effect="blur"
              placeholderSrc=""
            />
          ) : (
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
          )}
        </HStack>
        {!isDesktop && (
          <IconButton size="lg" aria-label="Close sidebar"
            icon={<Icon as={X} boxSize={5} />}
            variant="ghost"
            color="rgba(255, 255, 255, 0.8)"
            _hover={{ bg: "rgba(255, 255, 255, 0.1)", color: "white" }}
            minW="44px"
            h="44px"
            onClick={handleClose}
            className="modern-sidebar__close"
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
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(255, 255, 255, 0.3)',
          },
        }}
      >
        <AppSidebarNav items={navItems} collapsed={collapsed} onNavigate={handleNavigate} />
      </Box>

      {/* Sidebar Footer - matches legacy CSidebarFooter */}
      <Flex
        direction="column"
        borderTop="1px solid rgba(255, 255, 255, 0.1)"
        p={2}
        flexShrink={0}
        className="modern-sidebar__footer"
        display={{ base: "none", lg: "flex" }}
      >
        {/* Showroom Mode Toggle - Admin only (above pin button) - EXACT LEGACY POSITIONING */}
        {isAdmin(user) && (
          <ShowroomModeToggle compact collapsed={collapsed} />
        )}

        {/* Pin button container - matches legacy structure */}
        <Flex align="center" justify={collapsed ? "center" : "flex-end"} w="100%" px={2}>
          {collapsed ? (
            <IconButton size="lg" aria-label={sidebarPinned ? 'Unpin sidebar (enable hover collapse)' : 'Pin sidebar (keep expanded)'}
              icon={<Icon as={sidebarPinned ? PinOff : Pin} boxSize={4} />}
              variant="outline"
              color="rgba(255, 255, 255, 0.8)"
              borderColor="rgba(255, 255, 255, 0.3)"
              _hover={{
                bg: "rgba(255, 255, 255, 0.1)",
                borderColor: "rgba(255, 255, 255, 0.5)",
                color: "white"
              }}
              onClick={handlePinToggle}
              className="sidebar-footer-pin-btn"
            />
          ) : (
            <HStack
              as="button"
              spacing={2}
              px={3}
              py={2}
              borderRadius="md"
              border="1px solid rgba(255, 255, 255, 0.3)"
              color="rgba(255, 255, 255, 0.8)"
              bg="transparent"
              _hover={{
                bg: "rgba(255, 255, 255, 0.1)",
                borderColor: "rgba(255, 255, 255, 0.5)",
                color: "white"
              }}
              onClick={handlePinToggle}
              className="sidebar-footer-pin-btn"
              cursor="pointer"
            >
              <Icon as={sidebarPinned ? PinOff : Pin} boxSize={4} />
              <Text fontSize="xs" className="pin-label">
                {sidebarPinned ? 'Unpin' : 'Pin'}
              </Text>
            </HStack>
          )}
        </Flex>
      </Flex>
    </Flex>
  )

  if (!isDesktop) {
    return (
      <Drawer isOpen={sidebarShow} placement="left" onClose={handleClose} size="xs">
        <DrawerOverlay bg={overlayColor} />
        <DrawerContent maxW="256px" className={sidebarClassNames} bg="transparent">
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
      transition="width 0.15s ease-in-out"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      zIndex="1040"
      className={sidebarClassNames}
    >
      {SidebarBody}
    </Box>
  )
}

export default AppSidebar
