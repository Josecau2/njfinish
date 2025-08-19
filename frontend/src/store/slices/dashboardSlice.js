import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../helpers/axiosInstance'


export const fetchDashboardCounts = createAsyncThunk(
  'dashboard/fetchCounts',
  async () => {
    const res = await axiosInstance.get('/api/dashboard/counts');
    return res.data;
  }
);

export const fetchLatestProposals = createAsyncThunk(
  'dashboard/fetchLatestProposals',
  async () => {
    const res = await axiosInstance.get('/api/dashboard/latest-proposals');
    return res.data;
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    activeProposals: 0,
    activeOrders: 0,
    loading: false,
    latestProposals: [],
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardCounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardCounts.fulfilled, (state, action) => {
        state.activeProposals = action.payload.activeProposals;
        state.activeOrders = action.payload.activeOrders;
        state.loading = false;
      })
      .addCase(fetchDashboardCounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchLatestProposals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLatestProposals.fulfilled, (state, action) => {
        state.latestProposals = action.payload;
        state.loading = false;
      })
      .addCase(fetchLatestProposals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export default dashboardSlice.reducer;
