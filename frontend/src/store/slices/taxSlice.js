import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../helpers/axiosInstance'

// Fetch all taxes
export const fetchTaxes = createAsyncThunk('taxes/fetchTaxes', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/api/taxes')
    return res.data
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message)
  }
})

// Add new tax
export const addTax = createAsyncThunk('taxes/addTax', async (tax, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post('/api/taxes', tax)
    return res.data
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message)
  }
})

// Delete tax
export const deleteTax = createAsyncThunk('taxes/deleteTax', async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/api/taxes/${id}`)
    return id
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message)
  }
})

// Set default tax
export const setDefaultTax = createAsyncThunk(
  'taxes/setDefaultTax',
  async (id, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(`/api/taxes/${id}`)
      return res.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  },
)

const taxSlice = createSlice({
  name: 'taxes',
  initialState: {
    taxes: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch taxes
      .addCase(fetchTaxes.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTaxes.fulfilled, (state, action) => {
        state.loading = false
        state.taxes = action.payload
      })
      .addCase(fetchTaxes.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Add tax
      .addCase(addTax.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addTax.fulfilled, (state, action) => {
        state.loading = false
        state.taxes.push(action.payload)
      })
      .addCase(addTax.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Delete tax
      .addCase(deleteTax.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteTax.fulfilled, (state, action) => {
        state.loading = false
        state.taxes = state.taxes.filter((t) => t.id !== action.payload)
      })
      .addCase(deleteTax.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Set default tax
      .addCase(setDefaultTax.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(setDefaultTax.fulfilled, (state, action) => {
        state.loading = false
        state.taxes = action.payload
      })
      .addCase(setDefaultTax.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export default taxSlice.reducer
