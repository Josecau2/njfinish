import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../helpers/axiosInstance'

export const sendFormDataToBackend = createAsyncThunk(
    'proposal/sendFormDataToBackend',
    async (payload, { rejectWithValue }) => {
        try {
            const { formData } = payload;
            const endpoint = formData.id ? '/api/update-proposals' : '/api/create-proposals';

            const response = await axiosInstance.post(endpoint, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);


export const getProposal = createAsyncThunk(
    'proposal/getProposal',
    async (id, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`/api/get-proposals`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const updateFormData = createAsyncThunk(
    'proposal/updateFormData',
    async ({ id, updatedData }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/api/form/${id}`, updatedData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const deleteFormData = createAsyncThunk(
    'proposal/deleteFormData',
    async (id, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.delete(`/api/delete-proposals/${id}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);



export const getContracts = createAsyncThunk(
    'contracts/getContracts',
    async (id, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`/api/get-contracts`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const formDataSlice = createSlice({
    name: 'proposal',
    initialState: {
        submitting: false,
        success: null,
        error: null,
        response: null,
        data: [],
    },
    reducers: {
        resetFormDataState: (state) => {
            state.submitting = false;
            state.success = null;
            state.error = null;
            state.response = null;
            state.data = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(sendFormDataToBackend.pending, (state) => {
                state.submitting = true;
                state.error = null;
                state.success = null;
            })
            .addCase(sendFormDataToBackend.fulfilled, (state, action) => {
                state.submitting = false;
                state.success = true;
                state.response = action.payload;
            })
            .addCase(sendFormDataToBackend.rejected, (state, action) => {
                state.submitting = false;
                state.success = false;
                state.error = action.payload;
            });

        builder
            .addCase(getProposal.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(getProposal.fulfilled, (state, action) => {
                state.submitting = false;
                state.data = action.payload.data;
            })
            .addCase(getProposal.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            });

        // UPDATE
        builder
            .addCase(updateFormData.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(updateFormData.fulfilled, (state, action) => {
                state.submitting = false;
                state.success = true;
                state.response = action.payload;
            })
            .addCase(updateFormData.rejected, (state, action) => {
                state.submitting = false;
                state.success = false;
                state.error = action.payload;
            });

        // DELETE
        builder
            .addCase(deleteFormData.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(deleteFormData.fulfilled, (state, action) => {
                state.submitting = false;
                state.success = true;
                state.response = action.payload;
                const deletedId = action.meta.arg; // id passed to deleteFormData thunk
                state.data = state.data.filter((item) => item._id !== deletedId);
            })
            .addCase(deleteFormData.rejected, (state, action) => {
                state.submitting = false;
                state.success = false;
                state.error = action.payload;
            });
    },
});



export const { resetFormDataState } = formDataSlice.actions;
export default formDataSlice.reducer;

