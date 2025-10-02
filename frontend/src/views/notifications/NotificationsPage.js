import StandardCard from '../../components/StandardCard'
import React, { useState, useEffect, useCallback } from 'react'
import { Alert, AlertDescription, AlertIcon, Badge, Box, Button, ButtonGroup, Container, Flex, Heading, Icon, HStack, Select, Spinner, Stack, Text } from '@chakra-ui/react'
import { Bell, Check, CheckCircle2, Info, RefreshCw, UserPlus, XCircle } from 'lucide-react'
import { useSelector } from 'react-redux'
import axiosInstance from '../../helpers/axiosInstance'
import EmptyState from '../../components/common/EmptyState'
import { notifyError, notifySuccess } from '../../helpers/notify'
import { useTranslation } from 'react-i18next'

const NotificationsPage = () => {
  const { t } = useTranslation()
  const authUser = useSelector((state) => state.auth?.user)

  // Local state management instead of Redux
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const isAdmin = (() => {
    const role = String(authUser?.role || '').toLowerCase()
    return role === 'admin' || role === 'super_admin'
  })()

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState('all') // 'all', 'unread', 'read'
  const [typeFilter, setTypeFilter] = useState('') // '', 'proposal_accepted', ...
  const [refreshing, setRefreshing] = useState(false)

  const itemsPerPage = 20

  const fetchNotifications = useCallback(
    async (showSpinner = true) => {
      if (showSpinner) {
        setLoading(true)
      }

      try {
        const params = {
          page: currentPage,
          limit: itemsPerPage,
          ...(filter === 'unread' && { unread_only: 'true' }),
          ...(filter === 'read' && { read_only: 'true' }),
          ...(typeFilter && { type: typeFilter }),
        }

        const { data } = await axiosInstance.get('/api/notifications', { params })
        setNotifications(data.data)
        setTotalPages(data?.pagination?.totalPages || 1)
        setError(null)
      } catch (error) {
        // Do not force logout on notifications auth errors
        const status = error?.response?.status
        if (status === 401 || status === 403) {
          setError('Not authorized to view notifications.')
        } else {
          console.error('Error fetching notifications:', error)
          setError(error.message)
        }
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [currentPage, filter, itemsPerPage, typeFilter],
  )

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Contractors: auto mark all read when landing on the page
  useEffect(() => {
    if (!isAdmin && notifications && notifications.some((n) => !n.is_read)) {
      ;(async () => {
        try {
          await axiosInstance.post('/api/notifications/mark-all-read')
          // Update local state
          setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        } catch (err) {
          // Non-fatal; ignore
        }
      })()
    }
  }, [isAdmin, notifications])
  useEffect(() => {
    if (error) {
      notifyError(
        t('notifications.errors.load', 'Failed to load notifications'),
        typeof error === 'string' ? error : '',
      )
    }
  }, [error, t])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchNotifications(false)
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axiosInstance.post(`/api/notifications/${notificationId}/read`)
      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
      notifyError(t('notifications.errors.markOne', 'Failed to mark as read'), error.message)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await axiosInstance.post('/api/notifications/mark-all-read')
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      // Refresh to update the list
      fetchNotifications(false)
      notifySuccess(
        t('notifications.success.allReadTitle', 'All caught up'),
        t('notifications.success.allReadText', 'All notifications marked as read'),
      )
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      notifyError(t('notifications.errors.markAll', 'Failed to mark all as read'), error.message)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'proposal_accepted':
        return CheckCircle2
      case 'proposal_rejected':
        return XCircle
      case 'customer_created':
        return UserPlus
      case 'system':
        return Info
      default:
        return Bell
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'red'
      case 'medium':
        return 'orange'
      case 'low':
        return 'blue'
      default:
        return 'gray'
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'unread') return !notification.is_read
    if (filter === 'read') return notification.is_read
    return true
  })

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const emptyTitle = (() => {
    if (filter === 'unread') {
      return t('notifications.empty.unread', 'No unread notifications')
    }
    if (filter === 'read') {
      return t('notifications.empty.read', 'No read notifications')
    }
    return t('notifications.empty.none', 'No notifications')
  })()

  const emptySubtitle = typeFilter
    ? t('notifications.empty.byType', "No notifications for type \"" + typeFilter + "\"")
    : t('notifications.empty.caughtUp', 'You are all caught up.')

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)


  const onCardKeyDown = (e, url) => {
    if (!url) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      window.location.href = url
    }
  }


  return (
    <Container maxW="6xl" py={6} aria-busy={loading}>
      <StandardCard>
        <CardHeader>
          <Flex
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align={{ base: 'flex-start', md: 'center' }}
            gap={4}
            flexWrap="wrap"
          >
            <Heading size="md">{t('notifications.header', 'Notifications')}</Heading>
            <HStack spacing={3} align="center" flexWrap="wrap">
              <Button
                variant="outline"
                colorScheme="brand"
                size="sm"
                minH="44px"
                onClick={handleRefresh}
                isLoading={refreshing}
                loadingText={t('notifications.actions.refreshing', 'Refreshing...')}
                leftIcon={!refreshing ? <Icon as={RefreshCw} boxSize={4} /> : undefined}
                type="button"
                aria-label={refreshing ? t('notifications.actions.refreshing', 'Refreshing notifications') : t('notifications.actions.refresh', 'Refresh notifications')}
              >
                {t('notifications.actions.refresh', 'Refresh')}
              </Button>
              {unreadCount > 0 && (
                <Button
                  colorScheme="brand"
                  size="sm"
                  minH="44px"
                  onClick={handleMarkAllAsRead}
                  type="button"
                  leftIcon={<Icon as={Check} boxSize={4} />}
                  aria-label={t('notifications.actions.markAllReadAria', 'Mark all notifications as read')}
                >
                  {t('notifications.actions.markAllRead', 'Mark all as read')} ({unreadCount})
                </Button>
              )}
            </HStack>
          </Flex>
        </CardHeader>
        <CardBody>
          <Stack spacing={6}>
            <Flex
              direction={{ base: 'column', xl: 'row' }}
              align={{ base: 'stretch', xl: 'center' }}
              justify="space-between"
              gap={4}
              flexWrap="wrap"
            >
              <HStack spacing={2} flexWrap="wrap">
                <Button
                  variant={filter === 'all' ? 'solid' : 'outline'}
                  colorScheme={filter === 'all' ? 'brand' : 'gray'}
                  size="sm"
                  minH="44px"
                  onClick={() => {
                    setFilter('all')
                    setCurrentPage(1)
                  }}
                  aria-pressed={filter === 'all'}
                >
                  {t('notifications.filters.all', 'All')}
                </Button>
                <Button
                  variant={filter === 'unread' ? 'solid' : 'outline'}
                  colorScheme={filter === 'unread' ? 'brand' : 'gray'}
                  size="sm"
                  minH="44px"
                  onClick={() => {
                    setFilter('unread')
                    setCurrentPage(1)
                  }}
                  aria-pressed={filter === 'unread'}
                >
                  {t('notifications.filters.unread', 'Unread')} ({unreadCount})
                </Button>
                <Button
                  variant={filter === 'read' ? 'solid' : 'outline'}
                  colorScheme={filter === 'read' ? 'brand' : 'gray'}
                  size="sm"
                  minH="44px"
                  onClick={() => {
                    setFilter('read')
                    setCurrentPage(1)
                  }}
                  aria-pressed={filter === 'read'}
                >
                  {t('notifications.filters.read', 'Read')}
                </Button>
              </HStack>
              <HStack spacing={3} align="center" flexWrap="wrap">
                <Text fontSize="sm" color="gray.600">{t('notifications.filters.typeLabel', 'Type')}</Text>
                <Select
                  id="type-filter"
                  size="sm"
                  maxW="220px"
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  aria-label={t('notifications.filters.typeAria', 'Filter by type')}
                >
                  <option value="">{t('notifications.filters.allTypes', 'All types')}</option>
                  <option value="proposal_accepted">{t('notifications.filters.proposalAccepted', 'Proposal accepted')}</option>
                  <option value="proposal_rejected">{t('notifications.filters.proposalRejected', 'Proposal rejected')}</option>
                  <option value="customer_created">{t('notifications.filters.customerCreated', 'Customer created')}</option>
                  <option value="system">{t('notifications.filters.system', 'System')}</option>
                </Select>
              </HStack>
            </Flex>

            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading && (
              <Flex justify="center" py={6}>
                <Spinner size="lg" />
              </Flex>
            )}

            {!loading && filteredNotifications.length === 0 && (
              <EmptyState title={emptyTitle} subtitle={emptySubtitle} />
            )}

            {!loading && filteredNotifications.length > 0 && (
              <Stack spacing={3}>
                {filteredNotifications.map((notification) => {
                  const NotificationIcon = getNotificationIcon(notification.type)
                  const priorityColor = getPriorityColor(notification.priority)
                  const clickable = Boolean(notification.action_url)
                  return (
                    <StandardCard
                      key={notification.id}
                      borderWidth={1}
                      borderLeftWidth={!notification.is_read ? 4 : 2}
                      borderLeftColor={!notification.is_read ? 'brand.500' : 'gray.200'}
                      bg={!notification.is_read ? 'gray.50' : 'white'}
                      shadow="sm"
                      cursor={clickable ? 'pointer' : 'default'}
                      transition="all 0.2s ease"
                      _hover={clickable ? { shadow: 'md', transform: 'translateY(-1px)' } : undefined}
                      _focusVisible={{ boxShadow: 'outline' }}
                      onClick={() => {
                        if (clickable) {
                          window.location.href = notification.action_url
                        }
                      }}
                      role={clickable ? 'button' : undefined}
                      tabIndex={clickable ? 0 : undefined}
                      aria-label={clickable ? t('notifications.aria.openNotification', { defaultValue: 'Open notification: {{title}}', title: notification.title }) : undefined}
                      onKeyDown={(e) => onCardKeyDown(e, notification.action_url)}
                    >
                      <CardBody py={3}>
                        <Flex justify="space-between" align="flex-start" gap={3}>
                          <Flex align="flex-start" gap={3} flex="1">
                            <Box mt={1} color="brand.500">
                              <Icon as={NotificationIcon} boxSize={6} />
                            </Box>
                            <Box flex="1">
                              <Flex justify="space-between" align="flex-start" gap={3} flexWrap="wrap" mb={1}>
                                <Heading size="sm">
                                  {notification.title}
                                  {!notification.is_read && (
                                    <Badge ml={2} colorScheme="blue">{t('notifications.badges.new', 'New')}</Badge>
                                  )}
                                </Heading>
                                {notification.priority && (
                                  <Badge colorScheme={priorityColor} textTransform="capitalize">
                                    {notification.priority}
                                  </Badge>
                                )}
                              </Flex>
                              <Text color="gray.600" mb={2}>
                                {notification.message}
                              </Text>
                              <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={3} flexWrap="wrap">
                                <Text fontSize="sm" color="gray.500">
                                  {formatDate(notification.createdAt)}
                                  {notification.createdByUser && ' by ' + notification.createdByUser.name}
                                </Text>
                                {isAdmin && !notification.is_read && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="brand"
                                    minH="36px"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleMarkAsRead(notification.id)
                                    }}
                                    type="button"
                                  >
                                    {t('notifications.actions.markRead', 'Mark as read')}
                                  </Button>
                                )}
                              </Flex>
                            </Box>
                          </Flex>
                        </Flex>
                      </CardBody>
                    </StandardCard>
                  )
                })}
              </Stack>
            )}

            {totalPages > 1 && (
              <HStack justify="center" spacing={2}>
                <Button
                  variant="outline"
                  size="sm"
                  minH="44px"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  isDisabled={currentPage === 1}
                  aria-label={t('notifications.pagination.previous', 'Previous page')}
                >
                  {t('notifications.pagination.previousShort', 'Previous')}
                </Button>
                {pageNumbers.map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'solid' : 'outline'}
                    colorScheme={page === currentPage ? 'brand' : 'gray'}
                    size="sm"
                    minH="44px"
                    onClick={() => setCurrentPage(page)}
                    aria-current={page === currentPage ? 'page' : undefined}
                    aria-label={t('notifications.pagination.goTo', { defaultValue: 'Go to page {{page}}', page })}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  minH="44px"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  isDisabled={currentPage === totalPages}
                  aria-label={t('notifications.pagination.next', 'Next page')}
                >
                  {t('notifications.pagination.nextShort', 'Next')}
                </Button>
              </HStack>
            )}
          </Stack>
        </CardBody>
      </StandardCard>
    </Container>
  )

}

export default NotificationsPage


