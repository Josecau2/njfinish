import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../helpers/axiosInstance';

// Async thunks
export const fetchPayments = createAsyncThunk(
  'payments/fetchPayments',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, status, orderId } = params;
      const response = await axiosInstance.get('/api/payments', {
        params: { page, limit, status, orderId },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: error.message });
    }
  }
);

export const fetchPaymentById = createAsyncThunk(
  'payments/fetchPaymentById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/api/payments/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: error.message });
    }
  }
);

export const createPayment = createAsyncThunk(
  'payments/createPayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/payments', paymentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: error.message });
    }
  }
);

export const updatePaymentStatus = createAsyncThunk(
  'payments/updatePaymentStatus',
  async ({ id, status, transactionId, gatewayResponse }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/api/payments/${id}/status`, {
        status,
        transactionId,
        gatewayResponse,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: error.message });
    }
  }
);

export const deletePayment = createAsyncThunk(
  'payments/deletePayment',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/api/payments/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: error.message });
    }
  }
);

// Payment configuration thunks
export const fetchPaymentConfig = createAsyncThunk(
  'payments/fetchPaymentConfig',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/api/payment-config');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: error.message });
    }
  }
);

export const fetchPublicPaymentConfig = createAsyncThunk(
  'payments/fetchPublicPaymentConfig',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/api/payment-config/public');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: error.message });
    }
  }
);

export const savePaymentConfig = createAsyncThunk(
  'payments/savePaymentConfig',
  async (configData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/payment-config', configData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: error.message });
    }
  }
);

export const updatePaymentConfig = createAsyncThunk(
  'payments/updatePaymentConfig',
  async ({ id, ...configData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/api/payment-config/${id}`, configData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: error.message });
    }
  }
);

const initialState = {
  payments: [],
  currentPayment: null,
  paymentConfig: null,
  publicPaymentConfig: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  },
  loading: false,
  configLoading: false,
  error: null,
  configError: null,
};

const paymentsSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearConfigError: (state) => {
      state.configError = null;
    },
    clearCurrentPayment: (state) => {
      state.currentPayment = null;
    },
    resetPayments: (state) => {
      state.payments = [];
      state.pagination = initialState.pagination;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch payments
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload.payments;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch payments';
      })

      // Fetch payment by ID
      .addCase(fetchPaymentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPayment = action.payload;
      })
      .addCase(fetchPaymentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch payment';
      })

      // Create payment
      .addCase(createPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.payments.unshift(action.payload);
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to create payment';
      })

      // Update payment status
      .addCase(updatePaymentStatus.fulfilled, (state, action) => {
        const index = state.payments.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.payments[index] = action.payload;
        }
        if (state.currentPayment?.id === action.payload.id) {
          state.currentPayment = action.payload;
        }
      })

      // Delete payment
      .addCase(deletePayment.fulfilled, (state, action) => {
        state.payments = state.payments.filter(p => p.id !== action.payload);
        if (state.currentPayment?.id === action.payload) {
          state.currentPayment = null;
        }
      })

      // Payment configuration
      .addCase(fetchPaymentConfig.pending, (state) => {
        state.configLoading = true;
        state.configError = null;
      })
      .addCase(fetchPaymentConfig.fulfilled, (state, action) => {
        state.configLoading = false;
        state.paymentConfig = action.payload;
      })
      .addCase(fetchPaymentConfig.rejected, (state, action) => {
        state.configLoading = false;
        state.configError = action.payload?.error || 'Failed to fetch payment configuration';
      })

      // Public payment configuration
      .addCase(fetchPublicPaymentConfig.fulfilled, (state, action) => {
        state.publicPaymentConfig = action.payload;
      })

      // Save payment configuration
      .addCase(savePaymentConfig.pending, (state) => {
        state.configLoading = true;
        state.configError = null;
      })
      .addCase(savePaymentConfig.fulfilled, (state, action) => {
        state.configLoading = false;
        state.paymentConfig = action.payload;
      })
      .addCase(savePaymentConfig.rejected, (state, action) => {
        state.configLoading = false;
        state.configError = action.payload?.error || 'Failed to save payment configuration';
      })

      // Update payment configuration
      .addCase(updatePaymentConfig.fulfilled, (state, action) => {
        state.paymentConfig = action.payload;
      });
  },
});

export const { clearError, clearConfigError, clearCurrentPayment, resetPayments } = paymentsSlice.actions;

export default paymentsSlice.reducer;
