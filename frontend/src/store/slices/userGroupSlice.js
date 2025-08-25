import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../helpers/axiosInstance'

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Fetch all user groups
export const fetchUsers = createAsyncThunk(
  'usersgroups/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/api/usersgroups', {
        headers: getAuthHeaders()
      });
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

// Fetch user group multipliers
export const fetchUserMultipliers = createAsyncThunk(
  'usersgroups/fetchUserMultipliers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/api/usersgroupsmultiplier', {
        headers: getAuthHeaders()
      });
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
      const response = await axiosInstance.get(`/api/usersgroups/${id}`, {
        headers: getAuthHeaders()
      });
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

// Fetch single user group for editing
export const fetchSingleUser = createAsyncThunk(
  'usersgroups/fetchSingleUser',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/api/usersgroups/${id}`, {
        headers: getAuthHeaders()
      });
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
      const response = await axiosInstance.post('/api/usersgroups', userData, {
        headers: getAuthHeaders()
      });
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
      const response = await axiosInstance.put(`/api/usersgroups/${id}`, data, {
        headers: getAuthHeaders()
      });
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
      await axiosInstance.delete(`/api/usersgroups/${id}`, {
        headers: getAuthHeaders()
      });
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
    allGroups: [], // Store all user groups here
    selected: null,
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch all user groups
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
  state.loading = false;
  const groups = action.payload.users || [];
  // Store in both fields for backward compatibility with existing components
  state.allGroups = groups;
  state.list = groups;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Fetch user multipliers
      .addCase(fetchUserMultipliers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserMultipliers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.users || []; // users array
      })
      .addCase(fetchUserMultipliers.rejected, (state, action) => {
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
        const updated = action.payload.user || action.payload; // Handle both response formats
        // Update list
        const i1 = state.list.findIndex(user => user.id === updated.id);
        if (i1 !== -1) state.list[i1] = { ...state.list[i1], ...updated };
        // Update allGroups
        const i2 = state.allGroups.findIndex(user => user.id === updated.id);
        if (i2 !== -1) state.allGroups[i2] = { ...state.allGroups[i2], ...updated };
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.error = action.payload
      })

      // Delete
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.list = state.list.filter(user => user.id !== action.payload);
        state.allGroups = state.allGroups.filter(user => user.id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.error = action.payload
      })
  }
})

export default userGroupSlice.reducer
