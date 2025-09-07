import React, { useState, useEffect } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CRow,
  CSpinner,
  CBadge,
  CAlert,
  CPagination,
  CPaginationItem,
  CButtonGroup,
  CFormCheck
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckAlt, cilReload } from '@coreui/icons'
import { useDispatch, useSelector } from 'react-redux'
import { setNotifications, setLoading, setError, markNotificationAsRead, markAllAsRead } from '../../store/notificationSlice'
import axiosInstance from '../../helpers/axiosInstance'
import EmptyState from '../../components/common/EmptyState'
import { notifyError, notifySuccess } from '../../helpers/notify'
import { useTranslation } from 'react-i18next'

const NotificationsPage = () => {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const { notifications, loading, error } = useSelector((state) => state.notification)
  const authUser = useSelector((state) => state.auth?.user)
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

  useEffect(() => {
    fetchNotifications()
  }, [currentPage, filter, typeFilter])

  // Contractors: auto mark all read when landing on the page
  useEffect(() => {
    if (!isAdmin && notifications && notifications.some(n => !n.is_read)) {
      (async () => {
        try {
          await axiosInstance.post('/api/notifications/mark-all-read')
          dispatch(markAllAsRead())
        } catch (err) {
          // Non-fatal; ignore
        }
      })()
    }
  }, [isAdmin, notifications?.length])

  const fetchNotifications = async (showSpinner = true) => {
    if (showSpinner) {
      dispatch(setLoading(true))
    }

    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...(filter === 'unread' && { unread_only: 'true' }),
        ...(filter === 'read' && { read_only: 'true' }),
        ...(typeFilter && { type: typeFilter })
      }

      const { data } = await axiosInstance.get('/api/notifications', { params })
      dispatch(setNotifications(data.data))
      setTotalPages(data?.pagination?.totalPages || 1)
      dispatch(setError(null))

    } catch (error) {
      // Do not force logout on notifications auth errors
      const status = error?.response?.status
      if (status === 401 || status === 403) {
        dispatch(setError('Not authorized to view notifications.'))
      } else {
        console.error('Error fetching notifications:', error)
        dispatch(setError(error.message))
      }
    } finally {
      dispatch(setLoading(false))
      setRefreshing(false)
    }
  }
  useEffect(() => {
    if (error) {
      notifyError(t('notifications.errors.load','Failed to load notifications'), typeof error === 'string' ? error : '')
    }
  }, [error])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchNotifications(false)
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axiosInstance.post(`/api/notifications/${notificationId}/read`)
      dispatch(markNotificationAsRead(notificationId))
    } catch (error) {
  console.error('Error marking notification as read:', error)
  notifyError(t('notifications.errors.markOne','Failed to mark as read'), error.message)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await axiosInstance.post('/api/notifications/mark-all-read')
      dispatch(markAllAsRead())
      // Refresh to update the list
      fetchNotifications(false)
  notifySuccess(t('notifications.success.allReadTitle','All caught up'), t('notifications.success.allReadText','All notifications marked as read'))
    } catch (error) {
  console.error('Error marking all notifications as read:', error)
  notifyError(t('notifications.errors.markAll','Failed to mark all as read'), error.message)
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

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.is_read
    if (filter === 'read') return notification.is_read
    return true
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <CContainer fluid className="py-4">
      <CRow>
        <CCol>
          <CCard>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">{t('notifications.header','Notifications')}</h4>
              <div className="d-flex gap-2">
                <CButton
                  variant="outline"
                  color="primary"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <CIcon icon={cilReload} className={refreshing ? 'fa-spin' : ''} />
                  {refreshing ? ' Refreshing...' : ' Refresh'}
                </CButton>
                {unreadCount > 0 && (
                  <CButton
                    color="success"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                  >
                    <CIcon icon={cilCheckAlt} />
                    Mark All Read ({unreadCount})
                  </CButton>
                )}
              </div>
            </CCardHeader>

            <CCardBody>
              {/* Filter Buttons */}
              <div className="mb-3 d-flex flex-wrap gap-2 align-items-center">
                <CButtonGroup>
                  <CFormCheck
                    type="radio"
                    button={{ color: 'outline-primary', variant: 'outline' }}
                    name="filter"
                    id="filter-all"
                    label="All"
                    checked={filter === 'all'}
                    onChange={() => {
                      setFilter('all')
                      setCurrentPage(1)
                    }}
                  />
                  <CFormCheck
                    type="radio"
                    button={{ color: 'outline-primary', variant: 'outline' }}
                    name="filter"
                    id="filter-unread"
                    label={`Unread (${unreadCount})`}
                    checked={filter === 'unread'}
                    onChange={() => {
                      setFilter('unread')
                      setCurrentPage(1)
                    }}
                  />
                  <CFormCheck
                    type="radio"
                    button={{ color: 'outline-primary', variant: 'outline' }}
                    name="filter"
                    id="filter-read"
                    label="Read"
                    checked={filter === 'read'}
                    onChange={() => {
                      setFilter('read')
                      setCurrentPage(1)
                    }}
                  />
                </CButtonGroup>
                <div className="ms-2 d-flex align-items-center">
                  <label htmlFor="type-filter" className="me-2 mb-0 small text-muted">Type</label>
                  <select
                    id="type-filter"
                    className="form-select form-select-sm"
                    style={{ width: '220px' }}
                    value={typeFilter}
                    onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1) }}
                  >
                    <option value=''>All types</option>
                    <option value='proposal_accepted'>Proposal accepted</option>
                    <option value='proposal_rejected'>Proposal rejected</option>
                    <option value='customer_created'>Customer created</option>
                    <option value='system'>System</option>
                  </select>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-3">
                  <EmptyState title="Could not load notifications" subtitle={error} />
                </div>
              )}

              {/* Loading Spinner */}
              {loading && (
                <div className="text-center py-4">
                  <CSpinner />
                </div>
              )}

              {/* Notifications List */}
              {!loading && filteredNotifications.length === 0 && (
                <EmptyState
                  title={filter === 'unread' ? 'No unread notifications' : filter === 'read' ? 'No read notifications' : 'No notifications'}
                  subtitle={typeFilter ? `No notifications for type "${typeFilter}"` : 'You are all caught up.'}
                />
              )}

              {!loading && filteredNotifications.map((notification) => (
                <CCard
                  key={notification.id}
                  className={`mb-3 notification-card ${!notification.is_read ? 'notification-unread' : ''}`}
                  style={{
                    borderLeft: !notification.is_read ? '4px solid #007bff' : '1px solid #dee2e6',
                    backgroundColor: !notification.is_read ? '#f8f9fa' : 'white',
                    cursor: notification.action_url ? 'pointer' : 'default'
                  }}
                  onClick={() => {
                    if (notification.action_url) {
                      window.location.href = notification.action_url
                    }
                  }}
                >
                  <CCardBody className="py-3">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="d-flex align-items-start flex-grow-1">
                        <div className="me-3 mt-1">
                          <span style={{ fontSize: '1.5rem' }}>
                            {getNotificationIcon(notification.type)}
                          </span>
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <h6 className="mb-1">
                              {notification.title}
                              {!notification.is_read && (
                                <CBadge color="primary" className="ms-2">New</CBadge>
                              )}
                            </h6>
                            <CBadge color={getPriorityColor(notification.priority)}>
                              {notification.priority}
                            </CBadge>
                          </div>
                          <p className="text-muted mb-2">{notification.message}</p>
                          <div className="d-flex justify-content-between align-items-center">
                            <small className="text-muted">
                              {formatDate(notification.createdAt)}
                              {notification.createdByUser && (
                                <> • by {notification.createdByUser.name}</>
                              )}
                            </small>
                            <div>
                              {isAdmin && !notification.is_read && (
                                <CButton
                                  size="sm"
                                  variant="ghost"
                                  color="primary"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleMarkAsRead(notification.id)
                                  }}
                                >
                                  Mark as read
                                </CButton>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CCardBody>
                </CCard>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <CPagination>
                    <CPaginationItem
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </CPaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <CPaginationItem
                        key={page}
                        active={page === currentPage}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </CPaginationItem>
                    ))}

                    <CPaginationItem
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </CPaginationItem>
                  </CPagination>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  )
}

export default NotificationsPage
