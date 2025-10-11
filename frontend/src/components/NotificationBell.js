import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Box,
  IconButton,
  Badge,
  Spinner,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Flex,
  Text,
  Button,
  Stack,
  VisuallyHidden,
  useColorModeValue,
} from '@chakra-ui/react'
import { Bell, BellRing, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import axiosInstance from '../helpers/axiosInstance'
import { getContrastColor } from '../utils/colorUtils'
import { getFreshestToken } from '../utils/authToken'
import { ICON_SIZE_MD } from '../constants/iconSizes'

const ICON_CONFIG = {
  proposal_accepted: { icon: CheckCircle2, color: 'brand.500' },
  proposal_rejected: { icon: AlertTriangle, color: 'orange.500' },
  customer_created: { icon: Info, color: 'brand.500' },
  system: { icon: Info, color: 'muted' },
  default: { icon: Info, color: 'muted' },
}

const NotificationBell = () => {
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth?.user)
  const customization = useSelector((state) => state.customization) || {}

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [liveMessage, setLiveMessage] = useState('')
  const prevUnreadCount = useRef()
  const [menuOpen, setMenuOpen] = useState(false)
  const [fetching, setFetching] = useState(false)
  const intervalRef = useRef(null)

  const tokenRef = useRef(getFreshestToken())
  tokenRef.current = getFreshestToken()
  const isAuthenticated = Boolean(user && tokenRef.current)

  const fallbackTextColor = useColorModeValue('slate.900', 'gray.200')
  const optimalTextColor = customization.headerBg
    ? getContrastColor(customization.headerBg)
    : fallbackTextColor

  const menuBg = useColorModeValue('white', 'slate.800')
  const menuBorder = useColorModeValue('blackAlpha.200', 'whiteAlpha.200')
  const unreadBackground = useColorModeValue('brand.50', 'slate.700')
  const emptyStateColor = useColorModeValue('muted', 'slate.300')

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const token = tokenRef.current
      if (!token) return
      const { data } = await axiosInstance.get('/api/notifications/unread-count', {
        __suppressAuthLogout: true,
      })
      if (data && typeof data.unreadCount === 'number') {
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      if (axios.isCancel && axios.isCancel(error)) return
      const status = error?.response?.status
      if (status === 401 || status === 403) {
        setUnreadCount(0)
      }
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([])
      setUnreadCount(0)
      setLiveMessage('')
      return
    }

    fetchUnreadCount()
    const pollMs = Number(import.meta.env.VITE_NOTIFICATIONS_POLL_INTERVAL_MS) || 15000
    intervalRef.current = setInterval(() => {
      fetchUnreadCount()
    }, pollMs)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchUnreadCount, isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || typeof unreadCount !== 'number') return

    const prev = prevUnreadCount.current
    let message

    if (typeof prev !== 'number') {
      message =
        unreadCount === 0
          ? 'No unread notifications.'
          : unreadCount === 1
            ? '1 unread notification.'
            : `${unreadCount} unread notifications.`
    } else if (unreadCount > prev) {
      const delta = unreadCount - prev
      message = delta === 1 ? '1 new notification.' : `${delta} new notifications.`
    } else if (unreadCount < prev) {
      message =
        unreadCount === 0
          ? 'No unread notifications remaining.'
          : unreadCount === 1
            ? '1 unread notification remaining.'
            : `${unreadCount} unread notifications remaining.`
    }

    if (message) {
      setLiveMessage(message)
    }
    prevUnreadCount.current = unreadCount
  }, [unreadCount, isAuthenticated])

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || fetching) return
    setFetching(true)
    try {
      const token = tokenRef.current
      if (!token) return
      const { data } = await axiosInstance.get('/api/notifications', {
        params: { limit: 10 },
        __suppressAuthLogout: true,
      })
      if (data) {
        setNotifications(data.data || [])
        if (typeof data.unreadCount === 'number') setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      if (axios.isCancel && axios.isCancel(error)) return
    } finally {
      setFetching(false)
    }
  }, [fetching, isAuthenticated])

  const markAllReadSilently = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const token = tokenRef.current
      if (!token) return
      await axiosInstance.post('/api/notifications/mark-all-read', null, {
        __suppressAuthLogout: true,
      })
      setUnreadCount(0)
      const nowIso = new Date().toISOString()
      if (Array.isArray(notifications) && notifications.length > 0) {
        const updated = notifications.map((n) =>
          n.is_read ? n : { ...n, is_read: true, read_at: nowIso },
        )
        setNotifications(updated)
      }
    } catch (error) {
      if (axios.isCancel && axios.isCancel(error)) return
    }
  }, [isAuthenticated, notifications])

  const handleToggle = useCallback(
    async (nextOpen) => {
      if (!isAuthenticated) return
      setMenuOpen(nextOpen)
      if (nextOpen) {
        await fetchNotifications()
        await markAllReadSilently()
      }
    },
    [fetchNotifications, markAllReadSilently, isAuthenticated],
  )

  const handleMarkAsRead = useCallback(
    async (notificationId) => {
      if (!isAuthenticated) return
      try {
        const token = tokenRef.current
        if (!token) return
        await axiosInstance.post(`/api/notifications/${notificationId}/read`, null, {
          __suppressAuthLogout: true,
        })
        setNotifications((prevNotifications) =>
          prevNotifications.map((n) =>
            n.id === notificationId
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n,
          ),
        )
        fetchUnreadCount()
      } catch (error) {
        if (axios.isCancel && axios.isCancel(error)) return
      }
    },
    [fetchUnreadCount, isAuthenticated],
  )

  const handleMarkAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const token = tokenRef.current
      if (!token) return
      await axiosInstance.post('/api/notifications/mark-all-read', null, {
        __suppressAuthLogout: true,
      })
      setUnreadCount(0)
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })),
      )
    } catch (error) {
      if (axios.isCancel && axios.isCancel(error)) return
    }
  }, [isAuthenticated])

  const renderNotificationIcon = useCallback((type) => {
    const config = ICON_CONFIG[type] || ICON_CONFIG.default
    const IconComponent = config.icon
    return (
      <Flex
        align="center"
        justify="center"
        boxSize="32px"
        borderRadius="full"
        bg={`${config.color}12`}
        color={config.color}
        flexShrink={0}
      >
        <IconComponent size={16} strokeWidth={2} aria-hidden="true" />
      </Flex>
    )
  }, [])

  const resolveNotificationUrl = useCallback((notification) => {
    if (!notification) return null
    if (notification.url) return notification.url
    if (notification.link) return notification.link
    const proposalId = notification?.payload?.proposalId
    if (proposalId) return `/quotes/${proposalId}/admin-view`
    return null
  }, [])

  const handleNavigateToList = useCallback(() => {
    if (!user) return
    const role = String(user.role || '').toLowerCase()
    const isAdmin = role === 'admin' || role === 'super_admin'
    navigate(isAdmin ? '/admin/notifications' : '/notifications')
  }, [navigate, user])

  if (!isAuthenticated) {
    return null
  }

  return (
    <Menu isOpen={menuOpen} onClose={() => handleToggle(false)} placement="bottom-end">
      <MenuButton
        as={IconButton}
        aria-label="Notifications"
        variant="ghost"
        minW="44px"
        minH="44px"
        color={optimalTextColor}
        onClick={() => handleToggle(!menuOpen)}
        _hover={{ bg: 'whiteAlpha.300' }}
        _active={{ bg: 'whiteAlpha.400' }}
      >
        <VisuallyHidden>Notifications</VisuallyHidden>
        <Box position="relative">
          {unreadCount > 0 ? (
            <BellRing size={ICON_SIZE_MD} strokeWidth={2} />
          ) : (
            <Bell size={ICON_SIZE_MD} strokeWidth={2} />
          )}
          <Badge
            position="absolute"
            top="-6px"
            right="-6px"
            borderRadius="full"
            minW="20px"
            h="20px"
            px="1"
            bg="brand.500"
            color="white"
            fontSize="xs"
            fontWeight="bold"
            display={unreadCount > 0 ? 'flex' : 'none'}
            alignItems="center"
            justifyContent="center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        </Box>
      </MenuButton>
      <MenuList
        bg={menuBg}
        borderColor={menuBorder}
        minW={{ base: "calc(100vw - 32px)", sm: "320px" }}
        maxW={{ base: "calc(100vw - 32px)", sm: "360px" }}
        maxH="420px"
        overflowY="auto"
        p={0}
        onMouseLeave={() => handleToggle(false)}
      >
        <Box px={4} py={3} borderBottom="1px solid" borderColor={menuBorder}>
          <Flex align="center" justify="space-between">
            <Text fontWeight="semibold">Notifications</Text>
            {unreadCount > 0 && (
              <Button size="sm" minH="32px" variant="ghost" onClick={handleMarkAllAsRead} isDisabled={fetching}>
                Mark all read
              </Button>
            )}
          </Flex>
        </Box>

        {fetching ? (
          <Flex py={6} align="center" justify="center">
            <Spinner size="sm" />
          </Flex>
        ) : Array.isArray(notifications) && notifications.length > 0 ? (
          <Stack spacing={1} px={2} py={2}>
            {notifications.map((n) => {
              const url = resolveNotificationUrl(n)
              const iconMarkup = renderNotificationIcon(n.type)
              const ariaLabel = n.title || n.subject || 'Notification'
              const isRead = Boolean(n.is_read)

              const handleNavigate = () => {
                if (!url) return
                if (!isRead && n.id) {
                  handleMarkAsRead(n.id)
                }
                navigate(url)
              }

              return (
                <Box
                  key={n.id || `${n.type}-${n.created_at}`}
                  role={url ? 'button' : 'presentation'}
                  tabIndex={url ? 0 : undefined}
                  onClick={handleNavigate}
                  onKeyDown={(e) => {
                    if (!url) return
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleNavigate()
                    }
                  }}
                  px={3}
                  py={2}
                  borderRadius="md"
                  bg={isRead ? 'transparent' : unreadBackground}
                  _hover={{ bg: unreadBackground }}
                >
                  <Flex gap={3} align="flex-start">
                    {iconMarkup}
                    <Box flex="1">
                      <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                        {ariaLabel}
                      </Text>
                      {(n.message || n.body || n.preview) && (
                        <Text fontSize="xs" color="muted" noOfLines={2}>
                          {(n.message || n.body || n.preview).toString()}
                        </Text>
                      )}
                      <Text fontSize="xs" color="muted" mt={1}>
                        {formatTimeAgo(n.created_at || n.createdAt || n.timestamp)}
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              )
            })}
          </Stack>
        ) : (
          <Flex py={6} align="center" justify="center">
            <Text fontSize="sm" color={emptyStateColor}>
              No new notifications
            </Text>
          </Flex>
        )}

        <MenuDivider my={0} />
        <MenuItem onClick={handleNavigateToList}>View all notifications</MenuItem>
      </MenuList>

      <VisuallyHidden aria-live="polite">{liveMessage}</VisuallyHidden>
    </Menu>
  )
}

function formatTimeAgo(dateString) {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return 'N/A'
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  } catch (error) {
    return 'N/A'
  }
}

export default NotificationBell

