import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
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
  const { page, ...otherFilters } = filters

  return useInfiniteQuery({
    queryKey: paymentsKeys.list({ page, ...otherFilters }),
    queryFn: async ({ pageParam = page || 1 }) => {
      const params = new URLSearchParams({
        page: pageParam,
        limit: 20, // Keep page sizes modest
        ...otherFilters,
      })

      const response = await axiosInstance.get(`/api/payments?${params}`)
      return response.data
    },
    getNextPageParam: (lastPage, pages) => {
      // Return next page number if there are more results
      if (lastPage.hasMore) {
        return pages.length + 1
      }
      return undefined
    },
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

// Apply payment mutation with optimistic updates
export const useApplyPayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ paymentId, data }) => {
      const response = await axiosInstance.post(`/api/payments/${paymentId}/apply`, data)
      return response.data
    },
    onMutate: async ({ paymentId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: paymentsKeys.lists() })

      // Snapshot previous value
      const previousPayments = queryClient.getQueryData(paymentsKeys.lists())

      // Optimistically update to the new value
      queryClient.setQueryData(paymentsKeys.lists(), (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            data: page.data.map(payment =>
              payment.id === paymentId
                ? { ...payment, status: 'applied', ...data }
                : payment
            )
          }))
        }
      })

      // Return context with snapshotted value
      return { previousPayments }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPayments) {
        queryClient.setQueryData(paymentsKeys.lists(), context.previousPayments)
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: paymentsKeys.lists() })
    },
  })
}