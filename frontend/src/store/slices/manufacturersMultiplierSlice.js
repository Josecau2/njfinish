import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../helpers/axiosInstance'
import { normalizeError } from '../../utils/errorUtils'

export const fetchMultiManufacturers = createAsyncThunk(
  'multiManufacturer/fetchManufacturers',
  async () => {
    try {
      const response = await axiosInstance.get(`/api/multi-manufacturer`)
      return response.data.manufacturers
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  },
)

export const updateManufacturerStatus = createAsyncThunk(
  'multiManufacturer/updateManufacturerStatus',
  async ({ id, enabled }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/api/multi-manufacturer/${id}`, { enabled })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  },
)

export const updateMultiManufacturer = createAsyncThunk(
  'manufacturersMultiplierSlice/updateMultiManufacturer',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/api/multi-manufacturer/${id}`, data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  },
)

export const createMultiManufacturer = createAsyncThunk(
  'manufacturersMultiplierSlice/createMultiManufacturer',
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/api/multi-manufacturer`, data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  },
)

const manufacturersSlice = createSlice({
  name: 'multiManufacturer',
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // Redux Toolkit uses Immer - direct state assignments are safe and converted to immutable updates
    builder
      .addCase(fetchMultiManufacturers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMultiManufacturers.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload
      })
      .addCase(fetchMultiManufacturers.rejected, (state, action) => {
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
      .addCase(updateMultiManufacturer.pending, (state) => {
        state.error = null
      })
      .addCase(updateMultiManufacturer.fulfilled, (state, action) => {
        const updated = action.payload
        const index = state.list.findIndex((m) => m.id === updated.id)
        if (index !== -1) {
          state.list[index] = updated
        }
      })
      .addCase(updateMultiManufacturer.rejected, (state, action) => {
        state.error = normalizeError(action.payload || action.error)
      })
      .addCase(createMultiManufacturer.pending, (state) => {
        state.error = null
      })
      .addCase(createMultiManufacturer.fulfilled, (state, action) => {
        state.list.push(action.payload.manufacturer)
      })
      .addCase(createMultiManufacturer.rejected, (state, action) => {
        state.error = normalizeError(action.payload || action.error)
      })
  },
})

export default manufacturersSlice.reducer
