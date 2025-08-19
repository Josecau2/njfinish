import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../helpers/axiosInstance';

export const fetchManufacturers = createAsyncThunk(
  'manufacturers/fetchManufacturers',
  async () => {
    const response = await axiosInstance.get('/api/manufacturers');
    return response.data;
  }
);

export const updateManufacturerStatus = createAsyncThunk(
  'manufacturers/updateManufacturerStatus',
  async ({ id, enabled }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/api/manufacturers/status/${id}`, { enabled });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateManufacturer = createAsyncThunk(
  'manufacturers/updateManufacturer',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/api/manufacturers/${id}`, data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const fetchManufacturerById = createAsyncThunk(
  'manufacturers/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/api/manufacturers/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const manufacturersSlice = createSlice({
  name: 'manufacturers',
  initialState: {
    list: [],
    selected: null,
    loading: false,
    error: null,
    byId: {},  
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchManufacturers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchManufacturers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchManufacturers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateManufacturerStatus.pending, (state) => {
        state.error = null;
      })
      .addCase(updateManufacturerStatus.fulfilled, (state, action) => {
        const updatedManufacturer = action.payload;
        const index = state.list.findIndex(m => m.id === updatedManufacturer.id);
        if (index !== -1) {
          state.list[index] = updatedManufacturer;
        }
      })
      .addCase(updateManufacturerStatus.rejected, (state, action) => {
        state.error = action.payload || 'Failed to update manufacturer status';
      })
      .addCase(updateManufacturer.pending, (state) => {
        state.error = null
      })
      .addCase(updateManufacturer.fulfilled, (state, action) => {
        const updated = action.payload
        const index = state.list.findIndex(m => m.id === updated.id)
        if (index !== -1) {
          state.list[index] = updated
        }
      })
      .addCase(updateManufacturer.rejected, (state, action) => {
        state.error = action.payload || 'Failed to update manufacturer'
      })
      .addCase(fetchManufacturerById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.selected = null;
      })
      .addCase(fetchManufacturerById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
        const id = action.payload.id;
        state.byId[id] = action.payload;
      })
      .addCase(fetchManufacturerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch manufacturer';
      });
  }
});

export default manufacturersSlice.reducer;
