import React, { useState, useEffect, useRef } from 'react'
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CSpinner
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilBell, cilBellExclamation } from '@coreui/icons'
import { useDispatch, useSelector } from 'react-redux'
import { setNotifications, setUnreadCount, markNotificationAsRead } from '../store/notificationSlice'
import axiosInstance from '../helpers/axiosInstance'
import axios from 'axios'
import { getContrastColor } from '../utils/colorUtils'
import { getFreshestToken } from '../utils/authToken'

const NotificationBell = () => {
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')) } catch { return null } })()
  const token = getFreshestToken()
  // Show bell for any authenticated user (admins and contractors)
  if (!user || !token) return null
  const isAdmin = user && (String(user.role).toLowerCase() === 'admin' || String(user.role).toLowerCase() === 'super_admin')

  // Get customization for proper contrast
  const customization = useSelector((state) => state.customization) || {}
  const optimalTextColor = getContrastColor(customization.headerBg || '#ffffff')

  const dispatch = useDispatch()
  const { notifications, unreadCount, loading } = useSelector((state) => state.notification)
  const [isOpen, setIsOpen] = useState(false)
  const [fetching, setFetching] = useState(false)
  const intervalRef = useRef(null)
  const disabledRef = useRef(false)

  // Fetch unread count periodically
  useEffect(() => {
  if (disabledRef.current) return
  fetchUnreadCount()

    // Poll for new notifications (configurable via VITE_NOTIFICATIONS_POLL_INTERVAL_MS)
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
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const token = getFreshestToken()
      if (!token) return
      const { data } = await axiosInstance.get('/api/notifications/unread-count', { __suppressAuthLogout: true })
      if (data && typeof data.unreadCount === 'number') {
        dispatch(setUnreadCount(data.unreadCount))
      }
    } catch (error) {
      if (axios.isCancel && axios.isCancel(error)) return
      const status = error?.response?.status
      if (status === 401 || status === 403) {
        // Stay silent & show zero; do NOT logout or stop entire app
        dispatch(setUnreadCount(0))
        return
      }
      if ((error?.message || '').toLowerCase() === 'auth-expired') return
      // eslint-disable-next-line no-console
      console.warn('Bell fetch error (non-auth):', error?.message || error)
    }
  }

  const fetchNotifications = async () => {
    if (fetching) return

    setFetching(true)
    try {
      const token = getFreshestToken()
      if (!token) return

      const { data } = await axiosInstance.get('/api/notifications', {
        params: { limit: 10 },
        __suppressAuthLogout: true
      })
      if (data) {
        dispatch(setNotifications(data.data || []))
        if (typeof data.unreadCount === 'number') dispatch(setUnreadCount(data.unreadCount))
      }
    } catch (error) {
      if (axios.isCancel && axios.isCancel(error)) return
      const status = error?.response?.status
      if (status === 401 || status === 403) {
        return
      }
      // eslint-disable-next-line no-console
      console.warn('Error fetching notifications:', error?.message || error)
    } finally {
      setFetching(false)
    }
  }

  const markAllReadSilently = async () => {
    try {
      const token = getFreshestToken()
      if (!token) return
  await axiosInstance.post('/api/notifications/mark-all-read', null, { __suppressAuthLogout: true })
      // Optimistically zero the badge and mark local items as read
      dispatch(setUnreadCount(0))
      const nowIso = new Date().toISOString()
      if (Array.isArray(notifications) && notifications.length > 0) {
        const updated = notifications.map(n => n.is_read ? n : { ...n, is_read: true, read_at: nowIso })
        dispatch(setNotifications(updated))
      }
  } catch (error) {
      if (axios.isCancel && axios.isCancel(error)) return
      // Non-fatal; leave as-is if API fails
      const status = error?.response?.status
      if (status !== 401 && status !== 403) {
        console.error('Error marking all read on open:', error?.message || error)
      }
    }
  }

  const handleToggle = async () => {
    const nextOpen = !isOpen
    setIsOpen(nextOpen)
    if (nextOpen) {
      // Always load a fresh preview
      await fetchNotifications()
      // Zero the counter upon opening and mark as read
      await markAllReadSilently()
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = getFreshestToken()
      if (!token) return

  await axiosInstance.post(`/api/notifications/${notificationId}/read`, null, { __suppressAuthLogout: true })
      dispatch(markNotificationAsRead(notificationId))
      fetchUnreadCount()
    } catch (error) {
      if (axios.isCancel && axios.isCancel(error)) return
      const status = error?.response?.status
      if (status === 401 || status === 403) {
        return
      }
      console.error('Error marking notification as read:', error?.message || error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const token = getFreshestToken()
      if (!token) return

  await axiosInstance.post('/api/notifications/mark-all-read', null, { __suppressAuthLogout: true })
      dispatch(setUnreadCount(0))
      fetchNotifications()
    } catch (error) {
      if (axios.isCancel && axios.isCancel(error)) return
      const status = error?.response?.status
      if (status === 401 || status === 403) {
        return
      }
      console.error('Error marking all notifications as read:', error?.message || error)
    }
  }

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }

      const now = new Date()
      const diffInSeconds = Math.floor((now - date) / 1000)

      if (diffInSeconds < 60) return 'Just now'
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
      return date.toLocaleDateString()
    } catch (error) {
      console.error('Error formatting time ago:', error);
      return 'N/A';
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'proposal_accepted':
        return '✅'
      case 'proposal_rejected':
        return '❌'
      case 'customer_created':
        return '👤'
      case 'system':
        return '⚙️'
      default:
        return '📧'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'danger'
      case 'medium':
        return 'warning'
      case 'low':
        return 'info'
      default:
        return 'secondary'
    }
  }

  return (
    <CDropdown
      variant="nav-item"
      placement="bottom-end"
      alignment="end"
      visible={isOpen}
      onToggle={handleToggle}
    >
      <CDropdownToggle
        caret={false}
        className="position-relative"
  style={{ border: 'none', background: 'transparent', minHeight: '44px', minWidth: '44px' }}
        aria-label={unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'Open notifications'}
      >
        <CIcon
          icon={unreadCount > 0 ? cilBellExclamation : cilBell}
          size="lg"
          style={{
            color: unreadCount > 0 ? '#ffc107' : optimalTextColor
          }}
        />
        {unreadCount > 0 && (
          <CBadge
            position="top-end"
            shape="rounded-pill"
            color="danger"
            className="position-absolute translate-middle"
            style={{ fontSize: '0.75rem', minWidth: '1.25rem' }}
            aria-live="polite"
            aria-atomic="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </CBadge>
        )}
      </CDropdownToggle>

      <CDropdownMenu
        className="notification-mobile-dropdown"
        // Let Popper keep it in viewport on desktop
        // eslint-disable-next-line react/forbid-component-props
        popper="true"
        // eslint-disable-next-line react/forbid-component-props
        placement="bottom-end"
        style={{
          width: '350px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}
        aria-label="Notifications list"
      >
        <div className="dropdown-header d-flex justify-content-between align-items-center px-3 py-2">
          <strong>Notifications</strong>
          {unreadCount > 0 && (
            <CButton
              size="sm"
              variant="ghost"
              color="primary"
              onClick={handleMarkAllAsRead}
              type="button"
              aria-label="Mark all notifications as read"
              style={{ minHeight: '44px' }}
            >
              Mark all read
            </CButton>
          )}
        </div>

        {fetching && (
          <div className="text-center py-3">
            <CSpinner size="sm" />
          </div>
        )}

        {!fetching && (
          <CDropdownItem disabled className="text-center py-3" aria-live="polite">
            No new notifications
          </CDropdownItem>
        )}

        <CDropdownItem
          className="text-center"
          style={{ cursor: 'pointer' }}
          onClick={() => window.location.href = isAdmin ? '/admin/notifications' : '/notifications'}
          aria-label="View all notifications"
        >
          View all notifications
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default NotificationBell
