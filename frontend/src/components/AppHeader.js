import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  HStack,
  IconButton,
  useColorMode,
  useColorModeValue,
  Text,
  Box,
} from '@chakra-ui/react'
import { Menu, SunMedium, Moon } from 'lucide-react'
import NotificationBell from './NotificationBell'
import LanguageSwitcher from './LanguageSwitcher'
import { AppHeaderDropdown } from './header'
import {
  setSidebarShow,
  setSidebarUnfoldable,
  setSidebarPinned,
} from '../store/slices/sidebarSlice'
import { getContrastColor } from '../utils/colorUtils'

const AppHeader = () => {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const { colorMode, toggleColorMode } = useColorMode()

  const sidebarShow = useSelector((state) => state.sidebar.sidebarShow)
  const sidebarUnfoldable = useSelector((state) => state.sidebar.sidebarUnfoldable)
  const sidebarPinned = useSelector((state) => state.sidebar.sidebarPinned)
  const customization = useSelector((state) => state.customization)
  const authUser = useSelector((state) => state.auth?.user)

  const headerBg = customization.headerBg || '#0f172a'
  const headerTextColor = customization.headerFontColor || getContrastColor(headerBg)

  const hoverBg = useColorModeValue('rgba(15,23,42,0.08)', 'rgba(255,255,255,0.12)')

  // Desktop collapse toggle removed for legacy parity. Sidebar is controlled via hover/pin and mobile menu.

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
        _dark={{ borderColor: 'rgba(255,255,255,0.08)' }}
        h="60px"
        px={{ base: 4, md: 6 }}
        align="center"
        justify="space-between"
        backdropFilter="blur(8px)"
        data-app-header
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
            minW="44px"
            minH="44px"
          />
          {customization.headerTitle ? (
            <Text fontWeight="semibold" noOfLines={1} display={{ base: 'none', md: 'block' }}>
              {customization.headerTitle}
            </Text>
          ) : null}
        </HStack>

        <HStack spacing={{ base: 1, md: 2 }} align="center">
          <IconButton
            variant="ghost"
            aria-label={t('common.toggleTheme', 'Toggle color mode')}
            icon={colorMode === 'light' ? <Moon size={18} /> : <SunMedium size={18} />}
            onClick={toggleColorMode}
            _hover={{ bg: hoverBg }}
            color={headerTextColor}
            minW="44px"
            minH="44px"
          />
          {/* Separator */}
          <Box as="span" h="20px" w="1px" bg={`${headerTextColor}33`} mx={{ base: 0.5, md: 2 }} />
          <Box display={{ base: 'none', sm: 'block' }}>
            <LanguageSwitcher compact />
          </Box>
          {/* Separator (hidden on very small screens to avoid crowding) */}
          <Box as="span" h="20px" w="1px" bg={`${headerTextColor}33`} mx={{ base: 0.5, md: 2 }} display={{ base: 'none', sm: 'block' }} />
          <NotificationBell />
          <Box as="span" h="20px" w="1px" bg={`${headerTextColor}33`} mx={{ base: 0.5, md: 2 }} display={{ base: 'none', sm: 'block' }} />
          <AppHeaderDropdown />
        </HStack>
      </Flex>
    </>
  )
}

export default AppHeader
