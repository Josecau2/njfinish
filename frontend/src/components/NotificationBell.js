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

const NotificationBell = () => {
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')) } catch { return null } })()
  const isAdmin = user && (String(user.role).toLowerCase() === 'admin' || String(user.role).toLowerCase() === 'super_admin')
  if (!isAdmin) return null
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
      const token = localStorage.getItem('token')
      if (!token) return

      const { data } = await axiosInstance.get('/api/notifications/unread-count')
      if (data && typeof data.unreadCount === 'number') {
        dispatch(setUnreadCount(data.unreadCount))
      }
    } catch (error) {
      const status = error?.response?.status
      if (status === 401 || status === 403) {
        // Do not force logout on notifications auth errors; disable polling silently
        disabledRef.current = true
        if (intervalRef.current) clearInterval(intervalRef.current)
        return
      }
      console.error('Error fetching unread count:', error?.message || error)
    }
  }

  const fetchNotifications = async () => {
    if (fetching) return

    setFetching(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const { data } = await axiosInstance.get('/api/notifications', {
        params: { limit: 10 },
      })
      if (data) {
        dispatch(setNotifications(data.data || []))
        if (typeof data.unreadCount === 'number') dispatch(setUnreadCount(data.unreadCount))
      }
    } catch (error) {
      const status = error?.response?.status
      if (status === 401 || status === 403) {
        // Do not logout on notifications auth errors
        disabledRef.current = true
        if (intervalRef.current) clearInterval(intervalRef.current)
        return
      }
      console.error('Error fetching notifications:', error?.message || error)
    } finally {
      setFetching(false)
    }
  }

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen && notifications.length === 0) {
      fetchNotifications()
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      await axiosInstance.post(`/api/notifications/${notificationId}/read`)
      dispatch(markNotificationAsRead(notificationId))
      fetchUnreadCount()
    } catch (error) {
      const status = error?.response?.status
      if (status === 401 || status === 403) {
        // Ignore auth errors here
        return
      }
      console.error('Error marking notification as read:', error?.message || error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      await axiosInstance.post('/api/notifications/mark-all-read')
      dispatch(setUnreadCount(0))
      fetchNotifications()
    } catch (error) {
      const status = error?.response?.status
      if (status === 401 || status === 403) {
        // Ignore auth errors here
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
        style={{ border: 'none', background: 'transparent' }}
      >
        <CIcon 
          icon={unreadCount > 0 ? cilBellExclamation : cilBell} 
          size="lg"
          className={unreadCount > 0 ? 'text-warning' : 'text-muted'}
        />
        {unreadCount > 0 && (
          <CBadge 
            position="top-end" 
            shape="rounded-pill" 
            color="danger"
            className="position-absolute translate-middle"
            style={{ fontSize: '0.75rem', minWidth: '1.25rem' }}
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
      >
        <div className="dropdown-header d-flex justify-content-between align-items-center px-3 py-2">
          <strong>Notifications</strong>
          {unreadCount > 0 && (
            <CButton 
              size="sm" 
              variant="ghost" 
              color="primary"
              onClick={handleMarkAllAsRead}
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

        {!fetching && notifications.length === 0 && (
          <CDropdownItem disabled className="text-center py-3">
            No notifications
          </CDropdownItem>
        )}

        {!fetching && notifications.map((notification) => (
          <CDropdownItem
            key={notification.id}
            className={`notification-item ${!notification.is_read ? 'notification-unread' : ''}`}
            onClick={() => {
              if (!notification.is_read) {
                handleMarkAsRead(notification.id)
              }
              if (notification.action_url) {
                window.location.href = notification.action_url
              }
            }}
            style={{ 
              borderLeft: !notification.is_read ? '4px solid #007bff' : 'none',
              backgroundColor: !notification.is_read ? '#f8f9fa' : 'transparent',
              cursor: 'pointer'
            }}
          >
            <div className="d-flex align-items-start">
              <div className="me-2 mt-1">
                <span style={{ fontSize: '1.2rem' }}>
                  {getNotificationIcon(notification.type)}
                </span>
              </div>
              <div className="flex-grow-1 min-width-0">
                <div className="d-flex justify-content-between align-items-start">
                  <strong className="text-truncate" style={{ fontSize: '0.875rem' }}>
                    {notification.title}
                  </strong>
                  <CBadge 
                    color={getPriorityColor(notification.priority)} 
                    size="sm"
                    className="ms-1"
                  >
                    {notification.priority}
                  </CBadge>
                </div>
                <div 
                  className="text-muted small text-truncate"
                  style={{ fontSize: '0.8rem' }}
                >
                  {notification.message}
                </div>
                <div className="d-flex justify-content-between align-items-center mt-1">
                  <small className="text-muted">
                    {formatTimeAgo(notification.createdAt)}
                  </small>
                  {!notification.is_read && (
                    <div 
                      className="bg-primary rounded-circle"
                      style={{ width: '6px', height: '6px' }}
                    />
                  )}
                </div>
              </div>
            </div>
          </CDropdownItem>
        ))}

        {notifications.length > 0 && (
          <div className="dropdown-divider" />
        )}
        
        <CDropdownItem 
          className="text-center"
          onClick={() => window.location.href = '/admin/notifications'}
        >
          View all notifications
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default NotificationBell
