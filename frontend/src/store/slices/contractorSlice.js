import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../helpers/axiosInstance'

export const fetchContractors = createAsyncThunk(
  'contractors/fetchContractors',
  async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/api/contractors', { params: { page, limit } })
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

export const fetchContractor = createAsyncThunk(
  'contractors/fetchContractor',
  async (groupId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/api/contractors/${groupId}`)
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

export const fetchContractorProposals = createAsyncThunk(
  'contractors/fetchContractorProposals',
  async ({ groupId, page = 1, limit = 10, status = 'all', search = '' }) => {
    const params = {
      page: page.toString(),
      limit: limit.toString(),
      ...(status !== 'all' && { status }),
      ...(search && { search }),
    }
    const { data } = await axiosInstance.get(`/api/contractors/${groupId}/proposals`, { params })
    return data
  },
)

export const fetchContractorCustomers = createAsyncThunk(
  'contractors/fetchContractorCustomers',
  async ({ groupId, page = 1, limit = 10, search = '' }) => {
    const params = {
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    }
    const { data } = await axiosInstance.get(`/api/contractors/${groupId}/customers`, { params })
    return data
  },
)

export const fetchProposalDetails = createAsyncThunk(
  'contractors/fetchProposalDetails',
  async (proposalId) => {
    const { data } = await axiosInstance.get(`/api/proposals/${proposalId}/details`)
    return data
  },
)

const contractorSlice = createSlice({
  name: 'contractors',
  initialState: {
    list: [],
    selectedContractor: null,
    contractorProposals: {
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      loading: false,
      error: null,
    },
    contractorCustomers: {
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      loading: false,
      error: null,
    },
    proposalDetails: {
      data: null,
      loading: false,
      error: null,
    },
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
  },
  reducers: {
    clearSelectedContractor: (state) => {
      state.selectedContractor = null
    },
    clearProposalDetails: (state) => {
      state.proposalDetails = { data: null, loading: false, error: null }
    },
    clearError: (state) => {
      state.error = null
      state.contractorProposals.error = null
      state.contractorCustomers.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch contractors list
      .addCase(fetchContractors.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchContractors.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload.data
        state.pagination = action.payload.pagination
      })
      .addCase(fetchContractors.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message
      })
      // Fetch single contractor
      .addCase(fetchContractor.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchContractor.fulfilled, (state, action) => {
        state.loading = false
        state.selectedContractor = action.payload.data
      })
      .addCase(fetchContractor.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message
      })
      // Fetch contractor proposals
      .addCase(fetchContractorProposals.pending, (state) => {
        state.contractorProposals.loading = true
        state.contractorProposals.error = null
      })
      .addCase(fetchContractorProposals.fulfilled, (state, action) => {
        state.contractorProposals.loading = false
        state.contractorProposals.data = action.payload.data
        state.contractorProposals.pagination = action.payload.pagination
      })
      .addCase(fetchContractorProposals.rejected, (state, action) => {
        state.contractorProposals.loading = false
        state.contractorProposals.error = action.error.message
      })
      // Fetch contractor customers
      .addCase(fetchContractorCustomers.pending, (state) => {
        state.contractorCustomers.loading = true
        state.contractorCustomers.error = null
      })
      .addCase(fetchContractorCustomers.fulfilled, (state, action) => {
        state.contractorCustomers.loading = false
        state.contractorCustomers.data = action.payload.data
        state.contractorCustomers.pagination = action.payload.pagination
      })
      .addCase(fetchContractorCustomers.rejected, (state, action) => {
        state.contractorCustomers.loading = false
        state.contractorCustomers.error = action.error.message
      })
      // Fetch proposal details
      .addCase(fetchProposalDetails.pending, (state) => {
        state.proposalDetails.loading = true
        state.proposalDetails.error = null
      })
      .addCase(fetchProposalDetails.fulfilled, (state, action) => {
        state.proposalDetails.loading = false
        state.proposalDetails.data = action.payload.data
      })
      .addCase(fetchProposalDetails.rejected, (state, action) => {
        state.proposalDetails.loading = false
        state.proposalDetails.error = action.error.message
      })
  },
})

export const { clearSelectedContractor, clearProposalDetails, clearError } = contractorSlice.actions
export default contractorSlice.reducer
