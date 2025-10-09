import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../helpers/axiosInstance'
import { normalizeError } from '../../utils/errorUtils'

export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async ({ page = 1, limit, groupId = null }, { rejectWithValue }) => {
    try {
      let url = `/api/customers?page=${page}&limit=${limit}`
      if (groupId) {
        url += `&group_id=${groupId}`
      }

      const response = await axiosInstance.get(url)

      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  },
)

export const createCustomer = createAsyncThunk(
  'customers/createCustomer',
  async (customerData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/customers/add', customerData)

      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  },
)

export const updateCustomer = createAsyncThunk(
  'customers/updateCustomer',
  async ({ id, customerData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/api/customers/update/${id}`, customerData)

      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  },
)

export const deleteCustomer = createAsyncThunk(
  'customers/deleteCustomer',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/api/customers/delete/${id}`)

      return { id, message: response.data.message }
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  },
)

const customerSlice = createSlice({
  name: 'customers',
  initialState: {
    list: [],
    loading: false,
    error: null,
    total: 0,
    page: 1,
    totalPages: 10,
  },
  reducers: {
    // Redux Toolkit uses Immer - direct state assignments are safe and converted to immutable updates
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Redux Toolkit uses Immer - direct state assignments are safe and converted to immutable updates
    builder
      // Fetch customers
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload.data
        state.total = action.payload.total
        state.page = action.payload.page
        state.totalPages = action.payload.totalPages
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false
        state.error = normalizeError(action.payload || action.error)
      })

      // Create customer
      .addCase(createCustomer.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.loading = false
        // Add the new customer to the list
        state.list.push(action.payload.customer)
        state.total += 1
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.loading = false
        state.error = normalizeError(action.payload || action.error)
      })

      // Update customer
      .addCase(updateCustomer.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.loading = false
        // Update the customer in the list
        const index = state.list.findIndex((customer) => customer.id === action.payload.customer.id)
        if (index !== -1) {
          state.list[index] = action.payload.customer
        }
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.loading = false
        state.error = normalizeError(action.payload || action.error)
      })

      // Delete customer
      .addCase(deleteCustomer.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.loading = false
        // Remove the customer from the list
        state.list = state.list.filter((customer) => customer.id !== action.payload.id)
        state.total -= 1
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.loading = false
        state.error = normalizeError(action.payload || action.error)
      })
  },
})

export const { clearError } = customerSlice.actions
export default customerSlice.reducer
