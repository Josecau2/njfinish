import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../helpers/axiosInstance'
import { normalizeError } from '../../utils/errorUtils'

export const fetchManufacturers = createAsyncThunk('manufacturers/fetchManufacturers', async () => {
  try {
    const response = await axiosInstance.get('/api/manufacturers')
    return response.data
  } catch (error) {
    console.error('Error fetching manufacturers:', error)
    throw error
  }
})

export const addManufacturer = createAsyncThunk(
  'manufacturers/addManufacturer',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/manufacturers/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data
    } catch (error) {
      console.error('Manufacturer creation error:', error)
      console.error('Error response:', error.response?.data)
      return rejectWithValue(error.response?.data || error.message)
    }
  },
)

export const updateManufacturerStatus = createAsyncThunk(
  'manufacturers/updateManufacturerStatus',
  async ({ id, enabled }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/api/manufacturers/status/${id}`, { enabled })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  },
)

export const updateManufacturer = createAsyncThunk(
  'manufacturers/updateManufacturer',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/api/manufacturers/${id}`, data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  },
)

export const fetchManufacturerById = createAsyncThunk(
  'manufacturers/fetchById',
  async (idOrParams, { rejectWithValue }) => {
    try {
      // Handle backward compatibility - if just a string/number is passed, use old format
      let id, page, limit, includeCatalog

      if (typeof idOrParams === 'object' && idOrParams !== null) {
        ;({ id, page = 1, limit = 100, includeCatalog = true } = idOrParams)
      } else {
        // Backward compatibility: if just an ID is passed
        id = idOrParams
        page = 1
        limit = 100
        includeCatalog = true
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        includeCatalog: includeCatalog.toString(),
      })

      const response = await axiosInstance.get(`/api/manufacturers/${id}?${params}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  },
)

const manufacturersSlice = createSlice({
  name: 'manufacturers',
  initialState: {
    list: [],
    selected: null,
    loading: false,
    error: null,
    byId: {},
    pagination: null, // Add pagination info for selected manufacturer
  },
  reducers: {},
  extraReducers: (builder) => {
    // Redux Toolkit uses Immer - direct state assignments are safe and converted to immutable updates
    builder
      .addCase(fetchManufacturers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchManufacturers.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload
      })
      .addCase(fetchManufacturers.rejected, (state, action) => {
        state.loading = false
        state.error = normalizeError(action.payload || action.error)
      })
      .addCase(updateManufacturerStatus.pending, (state) => {
        state.error = null
      })
      .addCase(updateManufacturerStatus.fulfilled, (state, action) => {
        const updatedManufacturer = action.payload
        const index = state.list.findIndex((m) => m.id === updatedManufacturer.id)
        if (index !== -1) {
          state.list[index] = updatedManufacturer
        }
      })
      .addCase(updateManufacturerStatus.rejected, (state, action) => {
        state.error = normalizeError(action.payload || action.error)
      })
      .addCase(updateManufacturer.pending, (state) => {
        state.error = null
      })
      .addCase(updateManufacturer.fulfilled, (state, action) => {
        const updated = action.payload
        const index = state.list.findIndex((m) => m.id === updated.id)
        if (index !== -1) {
          state.list[index] = updated
        }
      })
      .addCase(updateManufacturer.rejected, (state, action) => {
        state.error = normalizeError(action.payload || action.error)
      })
      .addCase(fetchManufacturerById.pending, (state) => {
        state.loading = true
        state.error = null
        state.selected = null
        state.pagination = null
      })
      .addCase(fetchManufacturerById.fulfilled, (state, action) => {
        state.loading = false
        // Handle new response format with manufacturer and pagination
        const { manufacturer, pagination } = action.payload
        state.selected = manufacturer || action.payload // Backward compatibility
        state.pagination = pagination || null
        const id = (manufacturer || action.payload).id
        state.byId[id] = manufacturer || action.payload
      })
      .addCase(fetchManufacturerById.rejected, (state, action) => {
        state.loading = false
        state.error = normalizeError(action.payload || action.error)
      })
      .addCase(addManufacturer.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addManufacturer.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload.manufacturer) {
          state.list.unshift(action.payload.manufacturer)
        }
      })
      .addCase(addManufacturer.rejected, (state, action) => {
        state.loading = false
        state.error = normalizeError(action.payload || action.error)
      })
  },
})

export default manufacturersSlice.reducer
