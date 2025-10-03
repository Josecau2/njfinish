import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '../helpers/axiosInstance'

// Query keys
export const proposalKeys = {
  all: ['proposals'],
  lists: () => [...proposalKeys.all, 'list'],
  list: (filters) => [...proposalKeys.lists(), filters],
  details: () => [...proposalKeys.all, 'detail'],
  detail: (id) => [...proposalKeys.details(), id],
  orders: () => [...proposalKeys.all, 'orders'],
  ordersList: (filters) => [...proposalKeys.orders(), filters],
}

// Fetch proposals list
export const useProposals = (groupId = null) => {
  return useQuery({
    queryKey: proposalKeys.list({ groupId }),
    queryFn: async () => {
      let url = '/api/get-proposals'
      if (groupId) {
        url += `?group_id=${groupId}`
      }
      const response = await axiosInstance.get(url)
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Fetch orders (accepted proposals)
export const useOrders = ({ groupId = null, mineOnly = false } = {}) => {
  return useQuery({
    queryKey: proposalKeys.ordersList({ groupId, mineOnly }),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (groupId) params.append('group_id', groupId)
      params.append('status', 'accepted')
      if (mineOnly) params.append('mine', 'true')
      const url = `/api/get-proposals?${params.toString()}`
      const response = await axiosInstance.get(url)
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Fetch single proposal by ID
export const useProposal = (id) => {
  return useQuery({
    queryKey: proposalKeys.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/quotes/proposalByID/${id}`)
      return response.data
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Update proposal status mutation with optimistic updates for rejection
export const useUpdateProposalStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, action, status }) => {
      const response = await axiosInstance.put(`/api/quotes/${id}/status`, { action, status })
      return response.data
    },
    // Optimistic update for rejection (Hades 1: Sales Flow Optimization)
    onMutate: async ({ id, action, status }) => {
      if (action !== 'reject') return

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: proposalKeys.lists() })
      await queryClient.cancelQueries({ queryKey: proposalKeys.detail(id) })

      // Snapshot previous values for rollback
      const previousProposals = queryClient.getQueriesData({ queryKey: proposalKeys.lists() })
      const previousDetail = queryClient.getQueryData(proposalKeys.detail(id))

      // Optimistically update proposals list
      queryClient.setQueriesData({ queryKey: proposalKeys.lists() }, (old) => {
        if (!old) return old
        return old.map((proposal) =>
          proposal.id === parseInt(id)
            ? { ...proposal, status: status, updated_at: new Date().toISOString() }
            : proposal
        )
      })

      // Optimistically update proposal detail
      if (previousDetail) {
        queryClient.setQueryData(proposalKeys.detail(id), {
          ...previousDetail,
          status: status,
          updated_at: new Date().toISOString(),
        })
      }

      return { previousProposals, previousDetail }
    },
    onError: (err, variables, context) => {
      if (variables.action !== 'reject') return

      // Rollback optimistic updates on error
      if (context?.previousProposals) {
        context.previousProposals.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(proposalKeys.detail(variables.id), context.previousDetail)
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch to ensure UI is in sync with server
      queryClient.invalidateQueries({ queryKey: proposalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: proposalKeys.detail(variables.id) })
    },
  })
}

// Accept proposal mutation with optimistic updates for instant UI feedback
export const useAcceptProposal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, externalSignerName, externalSignerEmail }) => {
      const requestBody = {}
      if (externalSignerName) requestBody.external_signer_name = externalSignerName
      if (externalSignerEmail) requestBody.external_signer_email = externalSignerEmail

      const response = await axiosInstance.post(`/api/quotes/${id}/accept`, requestBody)
      return response.data
    },
    // Optimistic update for instant UI feedback (Hades 1: Sales Flow Optimization)
    onMutate: async ({ id }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: proposalKeys.lists() })
      await queryClient.cancelQueries({ queryKey: proposalKeys.detail(id) })

      // Snapshot previous values for rollback
      const previousProposals = queryClient.getQueriesData({ queryKey: proposalKeys.lists() })
      const previousDetail = queryClient.getQueryData(proposalKeys.detail(id))

      // Optimistically update proposals list
      queryClient.setQueriesData({ queryKey: proposalKeys.lists() }, (old) => {
        if (!old) return old
        return old.map((proposal) =>
          proposal.id === parseInt(id)
            ? { ...proposal, status: 'accepted', updated_at: new Date().toISOString() }
            : proposal
        )
      })

      // Optimistically update proposal detail
      if (previousDetail) {
        queryClient.setQueryData(proposalKeys.detail(id), {
          ...previousDetail,
          status: 'accepted',
          updated_at: new Date().toISOString(),
        })
      }

      return { previousProposals, previousDetail }
    },
    onError: (err, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousProposals) {
        context.previousProposals.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(proposalKeys.detail(variables.id), context.previousDetail)
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch to ensure UI is in sync with server
      queryClient.invalidateQueries({ queryKey: proposalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: proposalKeys.detail(variables.id) })
    },
  })
}

// Delete proposal mutation
export const useDeleteProposal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const response = await axiosInstance.delete(`/api/delete-proposals/${id}`)
      return response.data
    },
    onSuccess: () => {
      // Invalidate proposals list
      queryClient.invalidateQueries({ queryKey: proposalKeys.lists() })
    },
  })
}

// Admin delete proposal mutation
export const useAdminDeleteProposal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const response = await axiosInstance.delete(`/api/admin/proposals/${id}`)
      return response.data
    },
    onSuccess: () => {
      // Invalidate proposals list
      queryClient.invalidateQueries({ queryKey: proposalKeys.lists() })
    },
  })
}

// Create/Update proposal mutation (replaces sendFormDataToBackend)
export const useCreateProposal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData) => {
      const response = await axiosInstance.post('/api/send-form-data-to-backend', formData)
      return response.data
    },
    onSuccess: () => {
      // Invalidate proposals list
      queryClient.invalidateQueries({ queryKey: proposalKeys.lists() })
    },
  })
}

// Update proposal mutation
export const useUpdateProposal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, formData }) => {
      const response = await axiosInstance.put(`/api/proposals/${id}`, formData)
      return response.data
    },
    onSuccess: (data, variables) => {
      // Invalidate proposals list and detail
      queryClient.invalidateQueries({ queryKey: proposalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: proposalKeys.detail(variables.id) })
    },
  })
}

// Get contracts query
export const useContracts = (groupId = null) => {
  return useQuery({
    queryKey: ['contracts', { groupId }],
    queryFn: async () => {
      let url = '/api/contracts'
      if (groupId) {
        url += `?group_id=${groupId}`
      }
      const response = await axiosInstance.get(url)
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Legacy exports for backwards compatibility during migration
export const sendFormDataToBackend = (payload) => {
  // Route to correct endpoint based on whether we're creating or updating
  const isUpdate = payload.action === '1' || payload.formData?.id
  const endpoint = isUpdate ? '/api/update-proposals' : '/api/create-proposals'

  return axiosInstance.post(endpoint, payload.formData || payload)
}

export const getContracts = (groupId = null) => {
  let url = '/api/contracts'
  if (groupId) {
    url += `?group_id=${groupId}`
  }
  return axiosInstance.get(url)
}

export const acceptProposal = (id, data = {}) => {
  return axiosInstance.post(`/api/quotes/${id}/accept`, data)
}
