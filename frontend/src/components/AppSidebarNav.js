import React, { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Flex, Menu, MenuButton, MenuItem, MenuList, Text, useColorModeValue } from '@chakra-ui/react'
import { ChevronDown } from 'lucide-react'
import { setSidebarShow, setSidebarUnfoldable } from '../store/slices/sidebarSlice'
import { ICON_SIZE_MD, ICON_SIZE_SM } from '../constants/iconSizes'
import { AppButton } from './common/AppButton'

const isActivePath = (pathname, target) => {
  if (!target) return false
  if (pathname === target) return true
  return pathname.startsWith(`${target}/`)
}

// Calculate luminance for contrast
const getLuminance = (r, g, b) => {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const val = c / 255
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

// Parse CSS color to RGB
const parseColor = (color) => {
  if (!color) return null

  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16)
      const g = parseInt(hex[1] + hex[1], 16)
      const b = parseInt(hex[2] + hex[2], 16)
      return { r, g, b }
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      return { r, g, b }
    }
  }

  // Handle rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
    }
  }

  return null
}

// Calculate hover colors with proper contrast based on background
const calculateHoverColors = (bgColor) => {
  const rgb = parseColor(bgColor)

  if (!rgb) {
    // Fallback to default values - high contrast for dark backgrounds
    return {
      normal: 'whiteAlpha.400',
      active: 'whiteAlpha.500',
    }
  }

  const luminance = getLuminance(rgb.r, rgb.g, rgb.b)
  const isDark = luminance < 0.5

  if (isDark) {
    // Dark background - use significantly higher contrast
    // Active item bg is whiteAlpha.200 (16%), so hover must be clearly visible above that
    // whiteAlpha.400 = rgba(255,255,255,0.32) = 32% white - 2x the active bg
    // whiteAlpha.500 = rgba(255,255,255,0.48) = 48% white - 3x the active bg
    return {
      normal: 'whiteAlpha.400',
      active: 'whiteAlpha.500',
    }
  } else {
    // Light background - use strong dark overlay for visibility
    // blackAlpha.300 = rgba(0,0,0,0.24) = 24% black
    // blackAlpha.400 = rgba(0,0,0,0.32) = 32% black
    return {
      normal: 'blackAlpha.300',
      active: 'blackAlpha.400',
    }
  }
}

const buildColors = (fontColor) => {
  const base = fontColor && fontColor.trim() ? fontColor : 'rgba(226, 232, 240, 0.87)'
  // For icons, use currentColor to inherit from parent or a visible color
  const icon = 'currentColor'
  return {
    fontColor: base,
    iconColor: icon,
    accentColor: 'white',
    hoverBg: 'whiteAlpha.100',
    activeBg: 'whiteAlpha.200',
    borderColor: 'whiteAlpha.200',
  }
}

const hasActiveChild = (children, pathname) => {
  return children?.some((child) => {
    if (!child) return false
    if (child.type === 'group') {
      return hasActiveChild(child.children, pathname)
    }
    return isActivePath(pathname, child.to)
  })
}

const AppSidebarNav = ({ items, collapsed = false, onNavigate, fontColor, sidebarBg }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const sidebarPinned = useSelector((state) => state.sidebar.sidebarPinned)

  const colors = useMemo(() => buildColors(fontColor), [fontColor])

  // Calculate dynamic hover colors based on sidebar background
  const hoverColors = useMemo(() => calculateHoverColors(sidebarBg), [sidebarBg])

  // Apply hover colors with higher opacity for better visibility
  const navHoverBg = hoverColors.normal
  const navActiveHoverBg = hoverColors.active
  const menuItemHoverBg = hoverColors.normal
  const menuItemActiveBg = hoverColors.active

  const handleNavigate = (target, isExternal = false) => {
    if (!target) return
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    if (isExternal) {
      window.open(target, '_blank', 'noopener,noreferrer')
      return
    }
    if (isMobile) {
      dispatch(setSidebarShow(false))
    } else if (!sidebarPinned) {
      dispatch(setSidebarUnfoldable(true))
    }
    onNavigate?.(target)
    navigate(target)
  }

  const renderLink = (item, depth = 0, opts = {}) => {
    const collapsedOverride = opts.collapsed ?? collapsed
    const active = isActivePath(location.pathname, item.to)
    const key = item.to || item.href || `${item.label}-${depth}`

    const content = (
      <>
        <Box
          as="span"
          w="1.5rem"
          h="1.5rem"
          minW="1.5rem"
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          {item.icon ? (
            <item.icon size={ICON_SIZE_MD} color={colors.iconColor} strokeWidth={1.75} />
          ) : (
            <Box
              w="6px"
              h="6px"
              borderRadius="full"
              bg="currentColor"
            />
          )}
        </Box>
        {!collapsedOverride && (
          <Text
            as="span"
            flex="1"
            minW="0"
            whiteSpace="nowrap"
            textAlign="left"
            lineHeight="1.4"
          >
            {item.label}
          </Text>
        )}
        {!collapsedOverride && item.badge && (
          <Text
            as="span"
            fontSize="0.65rem"
            fontWeight="600"
            px="0.45rem"
            py="0.1rem"
            borderRadius="full"
            bg="whiteAlpha.200"
          >
            {item.badge.text}
          </Text>
        )}
      </>
    )

    if (item.to) {
      return (
        <Box as="li" key={key} position="relative" p={0}>
          <AppButton
            type="button"
            title={collapsedOverride ? item.label : undefined}
            onClick={() => handleNavigate(item.to)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handleNavigate(item.to)
              }
            }}
            aria-current={active ? 'page' : undefined}
            variant="unstyled"
            w="full"
            display="flex"
            alignItems="center"
            justifyContent={collapsedOverride ? 'center' : 'flex-start'}
            gap="0.75rem"
            fontSize="0.95rem"
            fontWeight={active ? '600' : '500'}
            px={collapsedOverride ? 0 : '0.85rem'}
            py="0.75rem"
            minH="44px"
            borderRadius={{ base: '6px', lg: '8px' }}
            color={active ? colors.accentColor : colors.fontColor}
            bg={active ? colors.activeBg : 'transparent'}
            transition="background 0.15s ease, color 0.15s ease"
            _hover={{
              bg: active ? navActiveHoverBg : navHoverBg,
            }}
          >
            {content}
          </AppButton>
        </Box>
      )
    }

    if (item.href) {
      return (
        <Box as="li" key={key} position="relative" p={0}>
          <Box
            as="a"
            title={collapsedOverride ? item.label : undefined}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            display="flex"
            alignItems="center"
            justifyContent={collapsedOverride ? 'center' : 'flex-start'}
            gap="0.75rem"
            fontSize="0.95rem"
            fontWeight={active ? '600' : '500'}
            px={collapsedOverride ? 0 : '0.85rem'}
            py="0.75rem"
            minH="44px"
            borderRadius={{ base: '6px', lg: '8px' }}
            color={active ? colors.accentColor : colors.fontColor}
            bg={active ? colors.activeBg : 'transparent'}
            transition="background 0.15s ease, color 0.15s ease"
            textDecoration="none"
            cursor="pointer"
            _hover={{
              bg: active ? navActiveHoverBg : navHoverBg,
            }}
          >
            {content}
          </Box>
        </Box>
      )
    }

    return null
  }

  const renderCollapsedGroupMenuItems = (children, depth = 0) => {
    return children?.map((child) => {
      if (child.type === 'group') {
        const nested = renderCollapsedGroupMenuItems(child.children, depth + 1)
        if (!nested || nested.length === 0) return null
        return (
          <MenuItem
            key={`${child.label}-${depth}`}
            isDisabled
            fontSize="0.75rem"
            fontWeight="600"
            textTransform="uppercase"
            letterSpacing="0.08em"
            opacity="0.8"
            px="0.9rem"
            py="0.35rem"
          >
            {child.label}
          </MenuItem>
        )
      }

      const active = isActivePath(location.pathname, child.to)
      return (
        <MenuItem
          key={`${child.to || child.label}-${depth}`}
          onClick={() => handleNavigate(child.to)}
          fontSize="0.9rem"
          minH="44px"
          px="0.75rem"
          py="0.5rem"
          bg={active ? menuItemActiveBg : 'transparent'}
          _hover={{
            bg: active ? menuItemActiveBg : menuItemHoverBg,
          }}
        >
          <Flex align="center" gap="0.75rem" w="full">
            <Box
              as="span"
              w="1.5rem"
              h="1.5rem"
              minW="1.5rem"
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              {child.icon ? (
                <child.icon size={ICON_SIZE_MD} color={colors.iconColor} strokeWidth={1.75} />
              ) : (
                <Box w="6px" h="6px" borderRadius="full" bg="currentColor" />
              )}
            </Box>
            <Text as="span">{child.label}</Text>
          </Flex>
        </MenuItem>
      )
    })
  }

  const renderGroupCollapsed = (item, depth = 0) => {
    const active = hasActiveChild(item.children, location.pathname)
    const key = `${item.label}-${depth}`

    return (
      <Box as="li" key={key} position="relative">
        <Menu placement="right-start" offset={[8, 12]} isLazy>
          <MenuButton
            as={AppButton}
            type="button"
            title={item.label}
            aria-label={`${item.label} navigation`}
            variant="unstyled"
            w="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
            minH="44px"
            px={0}
            py="0.75rem"
            color={active ? colors.accentColor : colors.fontColor}
            bg={active ? colors.activeBg : 'transparent'}
            _hover={{
              bg: active ? navActiveHoverBg : navHoverBg,
            }}
          >
            <Box
              as="span"
              w="1.5rem"
              h="1.5rem"
              minW="1.5rem"
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              {item.icon ? (
                <item.icon size={ICON_SIZE_MD} color={colors.iconColor} strokeWidth={1.75} />
              ) : (
                <Box w="6px" h="6px" borderRadius="full" bg="currentColor" />
              )}
            </Box>
          </MenuButton>
          <MenuList
            minW="220px"
            bg="slate.900"
            color="slate.50"
            border="1px solid"
            borderColor="whiteAlpha.200"
            borderRadius="12px"
            py="0.35rem"
          >
            <Box
              fontSize="0.75rem"
              fontWeight="600"
              textTransform="uppercase"
              letterSpacing="0.08em"
              opacity="0.8"
              px="0.9rem"
              py="0.35rem"
              pb="0.15rem"
            >
              {item.label}
            </Box>
            {renderCollapsedGroupMenuItems(item.children, depth + 1)}
          </MenuList>
        </Menu>
      </Box>
    )
  }

  // Child component to safely use hooks per-group without violating parent hook order
  const NavGroupExpanded = React.memo(function NavGroupExpanded({ item, depth }) {
    const active = hasActiveChild(item.children, location.pathname)
    const [open, setOpen] = useState(active)

    const handleToggle = () => setOpen((prev) => !prev)

    return (
      <Box as="li" position="relative">
        <AppButton
          type="button"
          onClick={handleToggle}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              handleToggle()
            }
          }}
          aria-expanded={open}
          variant="unstyled"
          w="full"
          display="flex"
          alignItems="center"
          justifyContent="flex-start"
          gap="0.75rem"
          fontSize="0.95rem"
          fontWeight={open || active ? '600' : '500'}
          px="0.85rem"
          py="0.75rem"
          minH="44px"
          borderRadius={{ base: '6px', lg: '8px' }}
          color={open || active ? colors.accentColor : colors.fontColor}
          bg={open || active ? colors.activeBg : 'transparent'}
          transition="background 0.15s ease, color 0.15s ease"
          _hover={{
            bg: open || active ? navActiveHoverBg : navHoverBg,
          }}
        >
          <Box
            as="span"
            w="1.5rem"
            h="1.5rem"
            minW="1.5rem"
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            {item.icon ? (
              <item.icon size={ICON_SIZE_MD} color={colors.iconColor} strokeWidth={1.75} />
            ) : (
              <Box w="6px" h="6px" borderRadius="full" bg="currentColor" />
            )}
          </Box>
          <Text as="span" flex="1" minW="0" whiteSpace="nowrap" textAlign="left" lineHeight="1.4">
            {item.label}
          </Text>
          <Box as="span" ml="auto" display="inline-flex" alignItems="center">
            <ChevronDown size={ICON_SIZE_SM} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </Box>
        </AppButton>
        <Box
          as="ul"
          listStyleType="none"
          m={0}
          py="0.15rem"
          pb="0.25rem"
          display={open ? 'block' : 'none'}
        >
          {item.children?.map((child) => {
            if (child.type === 'group') {
              return (
                <NavGroupExpanded key={`${child.label}-${depth + 1}`} item={child} depth={depth + 1} />
              )
            }
            return (
              <React.Fragment key={child.to || child.label}>
                {renderLink(child, depth + 1, { collapsed: false })}
              </React.Fragment>
            )
          })}
        </Box>
      </Box>
    )
  })

  const renderGroupExpanded = (item, depth = 0) => {
    return <NavGroupExpanded key={`${item.label}-${depth}`} item={item} depth={depth} />
  }

  const renderItem = (item, depth = 0) => {
    if (item.type === 'group') {
      return collapsed ? renderGroupCollapsed(item, depth) : renderGroupExpanded(item, depth)
    }
    return renderLink(item, depth)
  }

  return (
    <Box maxH="100%" h="100%" overflowY="auto" overflowX="hidden">
      <Box
        as="ul"
        listStyleType="none"
        m={0}
        py={{ base: '0.25rem', lg: '0.5rem' }}
        px={{ base: '0.5rem', lg: '0.75rem' }}
      >
        {items?.map((item) => renderItem(item))}
      </Box>
    </Box>
  )
}

AppSidebarNav.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      to: PropTypes.string,
      href: PropTypes.string,
      icon: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
      children: PropTypes.array,
      badge: PropTypes.shape({
        text: PropTypes.string,
        color: PropTypes.string,
      }),
    }),
  ).isRequired,
  collapsed: PropTypes.bool,
  onNavigate: PropTypes.func,
  fontColor: PropTypes.string,
  sidebarBg: PropTypes.string,
}

export default AppSidebarNav
