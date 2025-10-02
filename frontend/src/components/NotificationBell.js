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
import axiosInstance from '../helpers/axiosInstance'
import axios from 'axios'
import { getContrastColor } from '../utils/colorUtils'
import { getFreshestToken } from '../utils/authToken'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../constants/iconSizes'

const ICON_CONFIG = {
  proposal_accepted: { icon: CheckCircle2, color: 'brand.500' },
  proposal_rejected: { icon: AlertTriangle, color: 'orange.500' },
  customer_created: { icon: Info, color: 'brand.500' },
  system: { icon: Info, color: 'muted' },
  default: { icon: Info, color: 'muted' },
}

const NotificationBell = () => {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user'))
    } catch {
      return null
    }
  })()
  const token = getFreshestToken()

  // Local state for notifications instead of Redux
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const customization = useSelector((state) => state.customization) || {}

  const fallbackTextColor = useColorModeValue('#0f172a', '#e2e8f0')
  const optimalTextColor = customization.headerBg
    ? getContrastColor(customization.headerBg)
    : fallbackTextColor

  const menuBg = useColorModeValue('white', 'slate.800')
  const menuBorder = useColorModeValue('rgba(15,23,42,0.12)', 'rgba(148,163,184,0.24)')
  const unreadBackground = useColorModeValue('brand.50', 'slate.700')
  const emptyStateColor = useColorModeValue('muted', 'slate.300')

  const [liveMessage, setLiveMessage] = useState('')
  const prevUnreadCount = useRef()

  const [menuOpen, setMenuOpen] = useState(false)
  const [fetching, setFetching] = useState(false)
  const intervalRef = useRef(null)
  const disabledRef = useRef(false)

  const hasSession = Boolean(user && token)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const tok = getFreshestToken()
      if (!tok) return
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
  }, [])

  useEffect(() => {
    if (!hasSession || disabledRef.current) return

    fetchUnreadCount()
    const pollMs = Number(import.meta.env.VITE_NOTIFICATIONS_POLL_INTERVAL_MS) || 15000
    intervalRef.current = setInterval(() => {
      if (!disabledRef.current) {
        fetchUnreadCount()
      }
    }, pollMs)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchUnreadCount, hasSession])

  useEffect(() => {
    if (!hasSession || typeof unreadCount !== 'number') return

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
  }, [hasSession, unreadCount])

  if (!hasSession) {
    return null
  }

  const fetchNotifications = async () => {
    if (fetching) return
    setFetching(true)
    try {
      const tok = getFreshestToken()
      if (!tok) return
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
  }

  const markAllReadSilently = async () => {
    try {
      const tok = getFreshestToken()
      if (!tok) return
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
  }

  const handleToggle = async (nextOpen) => {
    setMenuOpen(nextOpen)
    if (nextOpen) {
      await fetchNotifications()
      await markAllReadSilently()
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      const tok = getFreshestToken()
      if (!tok) return
      await axiosInstance.post(`/api/notifications/${notificationId}/read`, null, {
        __suppressAuthLogout: true,
      })
      // Update the specific notification as read locally
      setNotifications(prevNotifications =>
        prevNotifications.map(n =>
          n.id === notificationId
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      )
      fetchUnreadCount()
    } catch (error) {
      if (axios.isCancel && axios.isCancel(error)) return
    }
  }

  const handleMarkAllAsRead = async () => {
    await markAllReadSilently()
    await fetchNotifications()
  }

  const resolveNotificationUrl = (n) => {
    if (!n) return null
    if (n.action_url) return n.action_url
    const payload = n.payload || {}
    if (payload.proposalId) return `/proposals/${payload.proposalId}`
    if (payload.orderId) return `/orders/${payload.orderId}`
    if (payload.customerId) return `/customers/edit/${payload.customerId}`
    return null
  }

  const renderNotificationIcon = (type) => {
    const config = ICON_CONFIG[type] || ICON_CONFIG.default
    const Icon = config.icon || Info
    return (
      <Box color={config.color} mt={0.5} aria-hidden>
        <Icon size={ICON_SIZE_MD} />
      </Box>
    )
  }

  return (
    <Menu isOpen={menuOpen} onOpen={() => handleToggle(true)} onClose={() => handleToggle(false)}>
      <VisuallyHidden aria-live="polite" role="status">
        {liveMessage || ' '}
      </VisuallyHidden>
      <MenuButton
        as={IconButton}
        variant="ghost"
        aria-label={
          unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'Open notifications'
        }
        icon={
          <Box position="relative">
            {unreadCount > 0 ? (
              <BellRing size={22} color={optimalTextColor} />
            ) : (
              <Bell size={22} color={optimalTextColor} />
            )}
            {unreadCount > 0 && (
              <Badge
                colorScheme="red"
                position="absolute"
                top="-1"
                right="-2"
                fontSize="xs"
                borderRadius="full"
                minW="1.1rem"
                h="1.1rem"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Box>
        }
      />
      <MenuList
        bg={menuBg}
        borderColor={menuBorder}
        minW="320px"
        maxW="360px"
        maxH="420px"
        overflowY="auto"
        p={0}
      >
        <Box px={4} py={3} borderBottom="1px solid" borderColor={menuBorder}>
          <Flex align="center" justify="space-between">
            <Text fontWeight="semibold">Notifications</Text>
            {unreadCount > 0 && (
              <Button size="sm" variant="ghost" onClick={handleMarkAllAsRead} isDisabled={fetching}>
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
                window.location.href = url
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
        <MenuItem
          onClick={() =>
            (window.location.href =
              String(user.role).toLowerCase() === 'admin' ||
              String(user.role).toLowerCase() === 'super_admin'
                ? '/admin/notifications'
                : '/notifications')
          }
        >
          View all notifications
        </MenuItem>
      </MenuList>
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
