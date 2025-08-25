import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null
}

export const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setNotifications: (state, action) => {
      state.notifications = action.payload
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload)
      if (!action.payload.is_read) {
        state.unreadCount += 1
      }
    },
    markNotificationAsRead: (state, action) => {
      const notificationId = action.payload
      const notification = state.notifications.find(n => n.id === notificationId)
      if (notification && !notification.is_read) {
        notification.is_read = true
        notification.read_at = new Date().toISOString()
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        if (!notification.is_read) {
          notification.is_read = true
          notification.read_at = new Date().toISOString()
        }
      })
      state.unreadCount = 0
    },
    removeNotification: (state, action) => {
      const notificationId = action.payload
      const index = state.notifications.findIndex(n => n.id === notificationId)
      if (index !== -1) {
        const notification = state.notifications[index]
        if (!notification.is_read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
        state.notifications.splice(index, 1)
      }
    },
    setError: (state, action) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    }
  }
})

export const {
  setLoading,
  setNotifications,
  setUnreadCount,
  addNotification,
  markNotificationAsRead,
  markAllAsRead,
  removeNotification,
  setError,
  clearError
} = notificationSlice.actions

export default notificationSlice.reducer
