import axiosInstance from '../helpers/axiosInstance'

// Legacy Redux-style action creators for backwards compatibility
// These functions simulate Redux actions but don't actually dispatch to Redux
export const setNotifications = (notifications) => {
  // This is a compatibility function - the component will manage state directly
  return { type: 'SET_NOTIFICATIONS', payload: notifications }
}

export const setLoading = (loading) => {
  // This is a compatibility function - the component will manage state directly
  return { type: 'SET_LOADING', payload: loading }
}

export const setError = (error) => {
  // This is a compatibility function - the component will manage state directly
  return { type: 'SET_ERROR', payload: error }
}

export const markNotificationAsRead = (id) => {
  // This is a compatibility function - the component will manage state directly
  return { type: 'MARK_AS_READ', payload: id }
}

export const markAllAsRead = () => {
  // This is a compatibility function - the component will manage state directly
  return { type: 'MARK_ALL_READ' }
}

export const setUnreadCount = (count) => {
  // This is a compatibility function - the component will manage state directly
  return { type: 'SET_UNREAD_COUNT', payload: count }
}

// API functions
export const fetchNotifications = (params = {}) => {
  return axiosInstance.get('/api/notifications', { params })
}

export const markNotificationAsReadAPI = (notificationId) => {
  return axiosInstance.post(`/api/notifications/${notificationId}/read`)
}

export const markAllAsReadAPI = () => {
  return axiosInstance.post('/api/notifications/mark-all-read')
}
