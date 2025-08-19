import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../helpers/axiosInstance'

// Fetch all users
export const fetchUsers = createAsyncThunk(
  'usersgroups/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/api/usersgroupsmultiplier')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

// Fetch single user by ID
export const fetchUserById = createAsyncThunk(
  'usersgroups/fetchUserById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/api/usersgroups/${id}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

// Add new user
export const  addUser = createAsyncThunk(
  'usersgroups/addUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/usersgroups', userData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

// Update user
export const updateUser = createAsyncThunk(
  'usersgroups/updateUser',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/api/usersgroups/${id}`, data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

// Delete user
export const deleteUser = createAsyncThunk(
  'usersgroups/deleteUser',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/api/usersgroups/${id}`)
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

const userGroupSlice = createSlice({
  name: 'usersGroup',
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
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.users || []; // users array
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Fetch one
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true
        state.error = null
        state.selected = null
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false
        state.selected = action.payload
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Add
      .addCase(addUser.pending, (state) => {
        state.error = null
      })
      .addCase(addUser.fulfilled, (state, action) => {
        state.list.push(action.payload)
      })
      .addCase(addUser.rejected, (state, action) => {
        const payload = action.payload;
        state.error =
          typeof payload === 'string'
            ? payload
            : payload?.message || 'Failed to add user';
      })

      // Update
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.list.findIndex(user => user.id === action.payload.id)
        if (index !== -1) {
          state.list[index] = action.payload
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.error = action.payload
      })

      // Delete
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.list = state.list.filter(user => user.id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.error = action.payload
      })
  }
})

export default userGroupSlice.reducer
