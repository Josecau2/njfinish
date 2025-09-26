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

  // Resolve a destination URL for a notification
  const resolveNotificationUrl = (n) => {
    if (!n) return null
    if (n.action_url) return n.action_url
    const p = n.payload || {}
    if (p.proposalId) return `/proposals/${p.proposalId}`
    if (p.orderId) return `/orders/${p.orderId}`
    if (p.customerId) return `/customers/edit/${p.customerId}`
    return null
  }

  return (
    <>
      {/* Notification badge positioning fix */}
      <style>{`
        .notification-bell {
          position: relative;
          overflow: visible !important;
        }
        .notification-bell .dropdown-toggle {
          overflow: visible !important;
        }
        .notification-badge {
          position: absolute;
          top: 4px;
          right: 2px;
          font-size: 0.7rem;
          min-width: 1.1rem;
          height: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #dc3545;
          color: white;
          font-weight: 600;
          border: 2px solid ${customization.headerBg || '#ffffff'};
          z-index: 10;
          transform: none;
        }
        /* Mobile specific fixes */
        @media (max-width: 767.98px) {
          .notification-bell {
            margin-right: 4px;
          }
          .notification-badge {
            top: 0px;
            right: 4px;
            font-size: 0.65rem;
            min-width: 1rem;
            height: 1rem;
          }
        }

        /* Preview list styles */
        .notification-list { max-height: 320px; overflow-y: auto; }
        .notification-item { border-radius: 8px; transition: background .15s ease; }
        .notification-item:hover { background: rgba(0,0,0,.04); }
        [data-coreui-theme="dark"] .notification-item:hover { background: rgba(255,255,255,.06); }
        .notification-item.is-read { opacity: .7; }
        .notif-icon { width: 24px; height: 24px; display: grid; place-items: center; font-size: 16px; }
        .notif-title { line-height: 1.25; }
        .clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>

      <CDropdown
        variant="nav-item"
        placement="bottom-end"
        alignment="end"
        visible={isOpen}
        onToggle={handleToggle}
        offset={[0, 12]}
        portal
        className="modern-header__nav-item notification-bell"
      >
        <CDropdownToggle
          caret={false}
          className="modern-header__dropdown-toggle nav-link border-0 bg-transparent position-relative d-flex align-items-center justify-content-center"
          style={{ border: 'none', background: 'transparent', minHeight: '44px', minWidth: '44px', overflow: 'visible' }}
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
            <span
              className="notification-badge"
              aria-live="polite"
              aria-atomic="true"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </CDropdownToggle>

      <CDropdownMenu
        className="notification-mobile-dropdown header-dropdown__menu notification-bell__menu"
        style={{
          width: 'clamp(260px, 85vw, 360px)',
          maxHeight: 'min(420px, calc(100vh - 96px))',
          overflowY: 'auto',
          zIndex: 2050
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
          <div className="text-center py-4">
            <CSpinner size="sm" />
          </div>
        )}

        {!fetching && Array.isArray(notifications) && notifications.length > 0 ? (
          <div className="notification-list px-2 pb-2">
            {notifications.map((n) => {
              const url = resolveNotificationUrl(n)
              const aria = n.title || n.subject || 'Notification'
              return (
              <div
                key={n.id || `${n.type}-${n.created_at}`}
                className={`notification-item d-flex gap-2 align-items-start px-2 py-2 ${n.is_read ? 'is-read' : ''} ${url ? 'clickable' : ''}`}
                role={url ? 'button' : undefined}
                tabIndex={url ? 0 : undefined}
                aria-label={url ? `Open ${aria}` : aria}
                onClick={() => {
                  const target = url
                  if (target) {
                    // Best effort mark-as-read, then navigate
                    if (!n.is_read && n.id) {
                      handleMarkAsRead(n.id)
                    }
                    window.location.href = target
                  }
                }}
                onKeyDown={(e) => {
                  const target = url
                  if (!target) return
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    window.location.href = target
                  }
                }}
              >
                <div className="notif-icon" aria-hidden>
                  {getNotificationIcon(n.type)}
                </div>
                <div className="flex-grow-1">
                  <div className="notif-title fw-semibold">
                    {n.title || n.subject || 'Notification'}
                  </div>
                  {n.message || n.body || n.preview ? (
                    <div className="notif-body text-muted small clamp-2">
                      {(n.message || n.body || n.preview).toString()}
                    </div>
                  ) : null}
                  <div className="notif-meta text-muted small mt-1">
                    {formatTimeAgo(n.created_at || n.createdAt || n.timestamp)}
                  </div>
                </div>
              </div>
            )})}
          </div>
        ) : (!fetching && (
          <div className="text-center py-4 text-muted">No new notifications</div>
        ))}

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
    </>
  )
}

export default NotificationBell
