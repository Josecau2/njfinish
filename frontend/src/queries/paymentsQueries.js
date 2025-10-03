import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '../helpers/axiosInstance'

// Query keys
export const paymentsKeys = {
  all: ['payments'],
  lists: () => [...paymentsKeys.all, 'list'],
  list: (filters) => [...paymentsKeys.lists(), filters],
  details: () => [...paymentsKeys.all, 'detail'],
  detail: (id) => [...paymentsKeys.details(), id],
}

// Fetch payments with pagination
export const usePayments = (filters = {}) => {
  const { page = 1, limit = 10, ...otherFilters } = filters

  return useQuery({
    queryKey: paymentsKeys.list({ page, limit, ...otherFilters }),
    queryFn: async () => {
      const params = { page, limit, ...otherFilters }
      Object.keys(params).forEach((key) => {
        if (params[key] === undefined || params[key] === null || params[key] === '') {
          delete params[key]
        }
      })

      const response = await axiosInstance.get('/api/payments', { params })
      return response.data
    },
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Fetch single payment by ID
export const usePayment = (id) => {
  return useQuery({
    queryKey: paymentsKeys.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/payments/${id}`)
      return response.data
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

// Create payment mutation
export const useCreatePayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (paymentData) => {
      const response = await axiosInstance.post('/api/payments', paymentData)
      return response.data
    },
    onSuccess: () => {
      // Invalidate and refetch payments
      queryClient.invalidateQueries({ queryKey: paymentsKeys.lists() })
    },
    onError: (error) => {
      // Could add toast notification here
      console.error('Payment creation failed:', error)
    },
  })
}

// Apply payment mutation
export const useApplyPayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ paymentId, data }) => {
      const response = await axiosInstance.put(`/api/payments/${paymentId}/apply`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentsKeys.lists() })
    },
  })
}
