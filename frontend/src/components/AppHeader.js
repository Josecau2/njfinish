import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Flex,
  HStack,
  IconButton,
  Button,
  useBreakpointValue,
  useColorMode,
  useColorModeValue,
  Text,
  Box,
} from '@chakra-ui/react'
import { Menu, SunMedium, Moon, ChevronLeft, ChevronRight, BellRing } from 'lucide-react'
import NotificationBell from './NotificationBell'
import LanguageSwitcher from './LanguageSwitcher'
import { AppHeaderDropdown } from './header'
import {
  setSidebarShow,
  setSidebarUnfoldable,
  setSidebarPinned,
} from '../store/slices/sidebarSlice'
import { getContrastColor } from '../utils/colorUtils'
import { getFreshestToken } from '../utils/authToken'

const AppHeader = () => {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const { colorMode, toggleColorMode } = useColorMode()

  const sidebarShow = useSelector((state) => state.sidebar.sidebarShow)
  const sidebarUnfoldable = useSelector((state) => state.sidebar.sidebarUnfoldable)
  const sidebarPinned = useSelector((state) => state.sidebar.sidebarPinned)
  const customization = useSelector((state) => state.customization)
  const authUser = useSelector((state) => state.auth?.user)
  const authToken = useSelector((state) => state.auth?.token)
  const unreadCount = useSelector((state) => state.notification?.unreadCount || 0)

  const headerBg = customization.headerBg || '#0f172a'
  const headerTextColor = customization.headerFontColor || getContrastColor(headerBg)

  const hoverBg = useColorModeValue('rgba(15,23,42,0.08)', 'rgba(255,255,255,0.12)')
  const isMobileBreakpoint = useBreakpointValue({ base: true, md: false })
  const navigate = useNavigate()

  const token = React.useMemo(() => authToken || getFreshestToken(), [authToken])
  const hasSession = React.useMemo(() => Boolean(authUser && token), [authUser, token])
  const notificationsPath = React.useMemo(() => {
    if (!authUser) {
      return '/notifications'
    }
    const role = String(authUser.role || '').toLowerCase()
    if (role === 'admin' || role === 'super_admin') {
      return '/admin/notifications'
    }
    return '/notifications'
  }, [authUser])
  const ctaCountLabel = unreadCount > 99 ? '99+' : unreadCount
  const ctaText =
    unreadCount > 0
      ? t('notifications.mobileCtaWithCount', {
          count: ctaCountLabel,
          defaultValue: `Notifications (${ctaCountLabel})`,
        })
      : t('notifications.mobileCta', 'Notifications')
  const shouldShowMobileCta = Boolean(isMobileBreakpoint && hasSession)

  const handleCollapseToggle = () => {
    if (sidebarPinned) {
      dispatch(setSidebarPinned(false))
      dispatch(setSidebarUnfoldable(true))
      return
    }

    if (sidebarUnfoldable) {
      dispatch(setSidebarUnfoldable(false))
    } else {
      dispatch(setSidebarUnfoldable(true))
    }
  }

  const CollapseIcon = sidebarUnfoldable && !sidebarPinned ? ChevronRight : ChevronLeft

  return (
    <>
      <Flex
        as="header"
        position="sticky"
        top="0"
        w="full"
        zIndex="1020"
        bg={headerBg}
        color={headerTextColor}
        borderBottom="1px solid"
        borderColor="rgba(15,23,42,0.15)"
        _dark={{ borderColor: 'rgba(226,232,240,0.12)' }}
        minH="60px"
        px={{ base: 3, md: 4, lg: 6 }}
        align="center"
        justify="space-between"
        backdropFilter="blur(8px)"
      >
        <HStack spacing={2} align="center">
          <IconButton
            display={{ base: 'flex', lg: 'none' }}
            variant="ghost"
            aria-label={
              sidebarShow
                ? t('nav.closeSidebar', 'Close sidebar')
                : t('nav.openSidebar', 'Open sidebar')
            }
            icon={<Menu size={20} />}
            onClick={() => dispatch(setSidebarShow(!sidebarShow))}
            _hover={{ bg: hoverBg }}
            color={headerTextColor}
          />
          <IconButton
            display={{ base: 'none', lg: 'flex' }}
            variant="ghost"
            aria-label={
              sidebarUnfoldable && !sidebarPinned
                ? t('nav.expandSidebar', 'Expand sidebar')
                : t('nav.collapseSidebar', 'Collapse sidebar')
            }
            icon={<CollapseIcon size={20} />}
            onClick={handleCollapseToggle}
            _hover={{ bg: hoverBg }}
            color={headerTextColor}
          />
          {customization.headerTitle ? (
            <Text fontWeight="semibold" noOfLines={1} display={{ base: 'none', md: 'block' }}>
              {customization.headerTitle}
            </Text>
          ) : null}
        </HStack>

        <HStack spacing={{ base: 1, md: 2 }}>
          <IconButton
            variant="ghost"
            aria-label={t('common.toggleTheme', 'Toggle color mode')}
            icon={colorMode === 'light' ? <Moon size={18} /> : <SunMedium size={18} />}
            onClick={toggleColorMode}
            _hover={{ bg: hoverBg }}
            color={headerTextColor}
          />
          <Box display={{ base: 'none', sm: 'block' }}>
            <LanguageSwitcher compact />
          </Box>
          <NotificationBell />
          <AppHeaderDropdown />
        </HStack>
      </Flex>
      {shouldShowMobileCta ? (
        <Box
          display={{ base: 'flex', md: 'none' }}
          position="fixed"
          bottom={4}
          left={0}
          right={0}
          justifyContent="center"
          pointerEvents="none"
          zIndex="overlay"
        >
          <Button
            leftIcon={<BellRing size={18} />}
            size="lg"
            colorScheme="brand"
            borderRadius="full"
            boxShadow="lg"
            pointerEvents="auto"
            onClick={() => navigate(notificationsPath)}
            aria-label={ctaText}
          >
            {ctaText}
          </Button>
        </Box>
      ) : null}
    </>
  )
}

export default AppHeader
