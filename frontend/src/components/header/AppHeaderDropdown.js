import React from 'react'
import {
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useColorModeValue,
  HStack,
  Text,
  Box,
} from '@chakra-ui/react'
import { User, LogOut } from 'lucide-react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { ICON_SIZE_MD } from '../../constants/iconSizes'
import { getContrastColor } from '../../utils/colorUtils'
import { performLogout } from '../../utils/logout'

const AppHeaderDropdown = () => {
  const navigate = useNavigate()
  const authUser = useSelector((state) => state.auth?.user)
  const customization = useSelector((state) => state.customization)
  const user = authUser || null

  const accent = useColorModeValue('brand.500', 'brand.300')
  const avatarTextColor = getContrastColor(accent)

  const handleLogout = async () => {
    await performLogout({ reason: 'manual' })
  }

  const displayName = user?.name || 'User'

  return (
    <Menu placement="bottom-end" autoSelect={false}>
      <MenuButton borderRadius="full" p={0} cursor="pointer">
        <Avatar
          size="sm"
          name={displayName}
          bg={accent}
          color={avatarTextColor}
          icon={<User size={ICON_SIZE_MD} />}
        />
      </MenuButton>
      <MenuList minW="220px" py={2}>
        {user?.name && (
          <Box px={4} pb={2}>
            <HStack spacing={3} align="center">
              <Avatar size="sm" name={displayName} bg={accent} color={avatarTextColor} />
              <Box>
                <Text fontWeight="semibold" fontSize="sm">
                  {user.name}
                </Text>
                {user.email && (
                  <Text fontSize="xs" color="muted">
                    {user.email}
                  </Text>
                )}
              </Box>
            </HStack>
          </Box>
        )}
        {user?.name && <MenuDivider />}
        <MenuItem icon={<User size={ICON_SIZE_MD} />} onClick={() => navigate('/profile')}>
          Profile
        </MenuItem>
        <MenuItem icon={<LogOut size={ICON_SIZE_MD} />} onClick={handleLogout}>
          Logout
        </MenuItem>
      </MenuList>
    </Menu>
  )
}

export default AppHeaderDropdown
