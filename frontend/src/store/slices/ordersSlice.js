import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../helpers/axiosInstance'

export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async ({ mineOnly = false } = {}, { rejectWithValue }) => {
    try {
      console.log('📋 [DEBUG] fetchOrders thunk called:', {
        mineOnly,
        timestamp: new Date().toISOString()
      });

      const params = new URLSearchParams()
      if (mineOnly) params.append('mine', 'true')
      const url = `/api/orders${params.toString() ? `?${params.toString()}` : ''}`

      console.log('📡 [DEBUG] Making orders API request:', { url });

      const { data } = await axiosInstance.get(url)

      console.log('✅ [DEBUG] Orders API response:', {
        success: data?.success,
        ordersCount: data?.data?.length || 0,
        orders: data?.data
      });

      return data
    } catch (error) {
      console.error('❌ [DEBUG] fetchOrders error:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/api/orders/${id}`)
      return data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    items: [],
    loading: false,
    error: null,
    current: null,
  },
  reducers: {
    clearCurrentOrder: (state) => {
      state.current = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload?.data || []
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false
        state.current = action.payload?.data || null
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { clearCurrentOrder } = ordersSlice.actions
export default ordersSlice.reducer
