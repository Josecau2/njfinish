import axiosInstance from './axiosInstance'

export const getLatestTerms = () => axiosInstance.get('/api/terms/latest')
export const saveTerms = (data) => axiosInstance.post('/api/terms', data)
export const getAcceptance = () => axiosInstance.get('/api/terms/acceptance')
export const acceptTerms = () => axiosInstance.post('/api/terms/accept')
