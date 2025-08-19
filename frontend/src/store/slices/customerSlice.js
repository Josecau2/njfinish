import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async ({ page = 1, limit }) => {
    const api_url = import.meta.env.VITE_API_URL;
    const response = await fetch(`${api_url}/api/customers?page=${page}&limit=${limit}`);
    const data = await response.json();
    return data;
  }
);

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
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});


export default customerSlice.reducer;
