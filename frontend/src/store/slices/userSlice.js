import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../helpers/axiosInstance'
import { normalizeError } from '../../utils/errorUtils'

// Fetch all users
export const fetchUsers = createAsyncThunk('users/fetchUsers', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get('/api/users')
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message)
  }
})

// Fetch single user by ID
export const fetchUserById = createAsyncThunk(
  'users/fetchUserById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/api/users/${id}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  },
)

// Add new user
export const addUser = createAsyncThunk('users/addUser', async (userData, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post('/api/users', userData)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message)
  }
})

// Update user
export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/api/users/${id}`, data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  },
)

// Delete user
export const deleteUser = createAsyncThunk('users/deleteUser', async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/api/users/${id}`)
    return id
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message)
  }
})

const userSlice = createSlice({
  name: 'users',
  initialState: {
    list: [],
    selected: null,
    loading: {
      fetch: false,
      fetchById: false,
      add: false,
      update: false,
      delete: false,
    },
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // Redux Toolkit uses Immer - direct state assignments are safe and converted to immutable updates
    builder
      // Fetch all
      .addCase(fetchUsers.pending, (state) => {
        state.loading.fetch = true
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading.fetch = false
        state.list = action.payload.users || [] // users array
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading.fetch = false
        state.error = normalizeError(action.payload || action.error)
      })

      // Fetch one
      .addCase(fetchUserById.pending, (state) => {
        state.loading.fetchById = true
        state.error = null
        state.selected = null
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading.fetchById = false
        state.selected = action.payload
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading.fetchById = false
        state.error = normalizeError(action.payload || action.error)
      })

      // Add
      .addCase(addUser.pending, (state) => {
        state.loading.add = true
        state.error = null
      })
      .addCase(addUser.fulfilled, (state, action) => {
        state.loading.add = false
        state.list.push(action.payload)
      })
      .addCase(addUser.rejected, (state, action) => {
        state.loading.add = false
        state.error = normalizeError(action.payload || action.error)
      })

      // Update
      .addCase(updateUser.pending, (state) => {
        state.loading.update = true
        state.error = null
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading.update = false
        const index = state.list.findIndex((user) => user.id === action.payload.id)
        if (index !== -1) {
          state.list[index] = action.payload
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading.update = false
        state.error = normalizeError(action.payload || action.error)
      })

      // Delete
      .addCase(deleteUser.pending, (state) => {
        state.loading.delete = true
        state.error = null
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading.delete = false
        state.list = state.list.filter((user) => user.id !== action.payload)
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading.delete = false
        state.error = normalizeError(action.payload || action.error)
      })
  },
})

export default userSlice.reducer
