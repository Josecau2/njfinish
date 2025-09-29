import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  Flex,
  HStack,
  Stack,
  Icon,
  Text,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
} from '@chakra-ui/react'

const isActivePath = (pathname, target) => {
  if (!target) return false
  if (pathname === target) return true
  return pathname.startsWith(`${target}/`)
}

const SidebarLink = ({ item, collapsed, onNavigate, active }) => {
  // Always call hooks unconditionally to maintain consistent hook order
  const inactiveIconColor = useColorModeValue('slate.500', 'slate.300')
  const inactiveTextColor = useColorModeValue('slate.700', 'slate.200')
  const hoverBg = useColorModeValue('brand.50', 'slate.700')

  // Use the hook results conditionally
  const iconColor = active ? 'brand.600' : inactiveIconColor
  const textColor = active ? 'brand.600' : inactiveTextColor

  if (collapsed) {
    return (
      <Tooltip label={item.label} placement="right" hasArrow>
        <Box
          as="button"
          onClick={() => onNavigate?.(item.to)}
          w="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
          py={2}
          borderRadius="md"
          bg={active ? hoverBg : 'transparent'}
          _hover={{ bg: hoverBg }}
        >
          <Icon as={item.icon} boxSize={5} color={iconColor} />
        </Box>
      </Tooltip>
    )
  }

  return (
    <Flex
      role="button"
      tabIndex={0}
      onClick={() => onNavigate?.(item.to)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onNavigate?.(item.to)
        }
      }}
      align="center"
      gap={3}
      px={3}
      py={2.5}
      borderRadius="md"
      bg={active ? hoverBg : 'transparent'}
      color={textColor}
      _hover={{ bg: hoverBg, color: 'brand.600' }}
      cursor="pointer"
    >
      <Icon as={item.icon} boxSize={5} color={iconColor} />
      <Text fontWeight={active ? 'semibold' : 'medium'} fontSize="sm" noOfLines={1}>
        {item.label}
      </Text>
    </Flex>
  )
}

const CollapsedGroup = ({ item, onNavigate, active }) => {
  const hoverBg = useColorModeValue('brand.50', 'slate.700')
  const inactiveIconColor = useColorModeValue('slate.500', 'slate.300')
  const iconColor = active ? 'brand.600' : inactiveIconColor

  return (
    <Menu placement="right-start">
      <Tooltip label={item.label} placement="right" hasArrow>
        <MenuButton
          as={Box}
          w="full"
          py={2}
          borderRadius="md"
          display="flex"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          bg={active ? hoverBg : 'transparent'}
          _hover={{ bg: hoverBg }}
        >
          <Icon as={item.icon} boxSize={5} color={iconColor} />
        </MenuButton>
      </Tooltip>
      <MenuList ml={2} minW="220px">
        {item.children?.map((child) => (
          <MenuItem key={child.to || child.label} onClick={() => onNavigate(child.to)}>
            <HStack spacing={3}>
              <Icon as={child.icon} boxSize={4} />
              <Text fontSize="sm">{child.label}</Text>
            </HStack>
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  )
}

const ExpandedGroup = ({ item, onNavigate, pathname }) => {
  const activeChildIndex = useMemo(() => {
    const index = item.children?.findIndex((child) => isActivePath(pathname, child.to))
    return index !== undefined && index >= 0 ? index : -1
  }, [item.children, pathname])

  const defaultIndex = activeChildIndex >= 0 ? [0] : []
  const hoverBg = useColorModeValue('brand.50', 'slate.700')
  const iconColor = useColorModeValue('slate.500', 'slate.300')
  const inactiveTextColor = useColorModeValue('slate.700', 'slate.200')

  return (
    <Accordion allowMultiple defaultIndex={defaultIndex} reduceMotion>
      <AccordionItem border="none">
        {({ isExpanded }) => (
          <>
            <AccordionButton
              px={3}
              py={2.5}
              borderRadius="md"
              _expanded={{ bg: hoverBg, color: 'brand.600' }}
              _hover={{ bg: hoverBg }}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <HStack
                spacing={3}
                flex="1"
                minW={0}
                color={isExpanded || activeChildIndex >= 0 ? 'brand.600' : inactiveTextColor}
              >
                <Icon
                  as={item.icon}
                  boxSize={5}
                  color={isExpanded || activeChildIndex >= 0 ? 'brand.600' : iconColor}
                />
                <Text fontWeight={isExpanded || activeChildIndex >= 0 ? 'semibold' : 'medium'} fontSize="sm" noOfLines={1}>
                  {item.label}
                </Text>
              </HStack>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pl={3} pr={2} pb={2} pt={1}>
              <Stack spacing={1}>
                {item.children?.map((child) => (
                  <SidebarLink
                    key={child.to || child.label}
                    item={child}
                    collapsed={false}
                    onNavigate={onNavigate}
                    active={isActivePath(pathname, child.to)}
                  />
                ))}
              </Stack>
            </AccordionPanel>
          </>
        )}
      </AccordionItem>
    </Accordion>
  )
}

const AppSidebarNav = ({ items, collapsed = false, onNavigate }) => {
  const location = useLocation()
  const navigate = useNavigate()

  const handleNavigate = (target) => {
    if (!target) return
    onNavigate?.(target)
    navigate(target)
  }

  return (
    <Stack spacing={1} py={2} px={collapsed ? 1 : 2}>
      {items?.map((item) => {
        if (item.type === 'group') {
          const active = item.children?.some((child) => isActivePath(location.pathname, child.to))
          return collapsed ? (
            <CollapsedGroup key={item.label} item={item} onNavigate={handleNavigate} active={active} />
          ) : (
            <ExpandedGroup
              key={item.label}
              item={item}
              onNavigate={handleNavigate}
              pathname={location.pathname}
            />
          )
        }
        return (
          <SidebarLink
            key={item.to || item.label}
            item={item}
            collapsed={collapsed}
            onNavigate={handleNavigate}
            active={isActivePath(location.pathname, item.to)}
          />
        )
      })}
    </Stack>
  )
}

AppSidebarNav.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      to: PropTypes.string,
      icon: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
      children: PropTypes.array,
    }),
  ).isRequired,
  collapsed: PropTypes.bool,
  onNavigate: PropTypes.func,
}

SidebarLink.propTypes = {
  item: PropTypes.object.isRequired,
  collapsed: PropTypes.bool,
  onNavigate: PropTypes.func,
  active: PropTypes.bool,
}

CollapsedGroup.propTypes = {
  item: PropTypes.object.isRequired,
  onNavigate: PropTypes.func,
  active: PropTypes.bool,
}

ExpandedGroup.propTypes = {
  item: PropTypes.object.isRequired,
  onNavigate: PropTypes.func,
  pathname: PropTypes.string.isRequired,
}

export default AppSidebarNav
