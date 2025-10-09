import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../helpers/axiosInstance'
import { normalizeError } from '../../utils/errorUtils'

export const fetchDashboardCounts = createAsyncThunk('dashboard/fetchCounts', async () => {
  // Suppress global logout on a brief race (token not yet attached)
  const res = await axiosInstance.get('/api/dashboard/counts', { __suppressAuthLogout: true })
  return res.data
})

export const fetchLatestProposals = createAsyncThunk('dashboard/fetchLatestProposals', async () => {
  // Suppress global logout on a brief race (token not yet attached)
  const res = await axiosInstance.get('/api/dashboard/latest-proposals', {
    __suppressAuthLogout: true,
  })
  return res.data
})

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    activeProposals: 0,
    activeOrders: 0,
    loading: false,
    latestProposals: [],
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // Redux Toolkit uses Immer - direct state assignments are safe and converted to immutable updates
    builder
      .addCase(fetchDashboardCounts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDashboardCounts.fulfilled, (state, action) => {
        state.activeProposals = action.payload.activeProposals
        state.activeOrders = action.payload.activeOrders
        state.loading = false
      })
      .addCase(fetchDashboardCounts.rejected, (state, action) => {
        state.loading = false
        state.error = normalizeError(action.payload || action.error)
      })
      .addCase(fetchLatestProposals.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchLatestProposals.fulfilled, (state, action) => {
        state.latestProposals = action.payload
        state.loading = false
      })
      .addCase(fetchLatestProposals.rejected, (state, action) => {
        state.loading = false
        state.error = normalizeError(action.payload || action.error)
      })
  },
})

export default dashboardSlice.reducer
