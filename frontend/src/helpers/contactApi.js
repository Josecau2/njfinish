import axiosInstance from './axiosInstance'

export const getContactInfo = () => axiosInstance.get('/api/contact/info')
export const saveContactInfo = (data) => axiosInstance.put('/api/contact/info', data)

// Get configuration data from PDF customization
export const getConfigurationInfo = () => axiosInstance.get('/api/settings/customization/pdf')

export const createThread = (payload) => axiosInstance.post('/api/contact/threads', payload)
export const listThreads = (params) => axiosInstance.get('/api/contact/threads', { params })
export const getThread = (id) => axiosInstance.get(`/api/contact/threads/${id}`)
export const postMessage = (id, body) => axiosInstance.post(`/api/contact/threads/${id}/messages`, { body })
export const markRead = (id) => axiosInstance.post(`/api/contact/threads/${id}/read`)
export const closeThread = (id) => axiosInstance.post(`/api/contact/threads/${id}/close`)

export default {
  getContactInfo,
  saveContactInfo,
  getConfigurationInfo,
  createThread,
  listThreads,
  getThread,
  postMessage,
  markRead,
  closeThread,
}
