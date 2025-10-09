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
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../../store/slices/authSlice'
import axiosInstance from '../../helpers/axiosInstance'
import { clearAllTokens } from '../../utils/authToken'
import { forceBrowserCleanup } from '../../utils/browserCleanup'
import { ICON_SIZE_MD, ICON_SIZE_SM } from '../../constants/iconSizes'

const AppHeaderDropdown = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const authUser = useSelector((state) => state.auth?.user)
  const user = authUser || (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  })()

  const accent = useColorModeValue('brand.500', 'brand.300')

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/api/auth/logout')
    } catch {}

    clearAllTokens()
    dispatch(logout())
    forceBrowserCleanup()
    setTimeout(() => {
      window.location.href = `/login?_t=${Date.now()}&_fresh=1`
    }, 100)
  }

  const displayName = user?.name || 'User'

  return (
    <Menu placement="bottom-end" autoSelect={false}>
      <MenuButton borderRadius="full" p={0} cursor="pointer">
        <Avatar
          size="sm"
          name={displayName}
          bg={accent}
          color="white"
          icon={<User size={ICON_SIZE_MD} />}
        />
      </MenuButton>
      <MenuList minW="220px" py={2}>
        {user?.name && (
          <Box px={4} pb={2}>
            <HStack spacing={3} align="center">
              <Avatar size="sm" name={displayName} bg={accent} color="white" />
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



