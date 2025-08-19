import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../helpers/axiosInstance'

// Fetch all locations
export const fetchLocations = createAsyncThunk(
    'locations/fetchLocations',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('/api/locations')
            return response.data
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message)
        }
    }
)

// Fetch single location by ID
export const fetchLocationById = createAsyncThunk(
    'locations/fetchLocationById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`/api/locations/${id}`)
            return response.data
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message)
        }
    }
)

// Add new location
export const addLocation = createAsyncThunk(
    'locations/addLocation',
    async (locationData, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('/api/locations', locationData)
            return response.data
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message)
        }
    }
)

// Update location
export const updateLocation = createAsyncThunk(
    'locations/updateLocation',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/api/locations/${id}`, data)
            return response.data
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message)
        }
    }
)

// Delete location
export const deleteLocation = createAsyncThunk(
    'locations/deleteLocation',
    async (id, { rejectWithValue }) => {
        try {
            await axiosInstance.delete(`/api/locations/${id}`)
            return id
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message)
        }
    }
)

const locationSlice = createSlice({
    name: 'locations',
    initialState: {
        list: [],
        selected: null,
        loading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch all
            .addCase(fetchLocations.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchLocations.fulfilled, (state, action) => {
                state.loading = false
                state.list = action.payload.locations
            })
            .addCase(fetchLocations.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

            // Fetch one
            .addCase(fetchLocationById.pending, (state) => {
                state.loading = true
                state.error = null
                state.selected = null
            })
            .addCase(fetchLocationById.fulfilled, (state, action) => {
                state.loading = false
                state.selected = action.payload
            })
            .addCase(fetchLocationById.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

            // Add
            .addCase(addLocation.pending, (state) => {
                state.error = null
            })
            .addCase(addLocation.fulfilled, (state, action) => {
                state.list.push(action.payload)
            })
            .addCase(addLocation.rejected, (state, action) => {
                state.error = action.payload
            })

            // Update
            .addCase(updateLocation.fulfilled, (state, action) => {
                const index = state.list.findIndex(loc => loc.id === action.payload.id)
                if (index !== -1) {
                    state.list[index] = action.payload
                }
            })
            .addCase(updateLocation.rejected, (state, action) => {
                state.error = action.payload
            })

            // Delete
            .addCase(deleteLocation.fulfilled, (state, action) => {
                state.list = state.list.filter(loc => loc.id !== action.payload)
            })
            .addCase(deleteLocation.rejected, (state, action) => {
                state.error = action.payload
            })
    }
})

export default locationSlice.reducer
