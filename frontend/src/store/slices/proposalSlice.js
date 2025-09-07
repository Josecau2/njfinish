import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../helpers/axiosInstance'

export const sendFormDataToBackend = createAsyncThunk(
    'proposal/sendFormDataToBackend',
    async (payload, { rejectWithValue }) => {
        try {
            console.log('🚀 [DEBUG] sendFormDataToBackend thunk called:', {
                action: payload?.action,
                proposalId: payload?.formData?.id,
                customerId: payload?.formData?.customerId,
                customerName: payload?.formData?.customerName,
                status: payload?.formData?.status,
                payloadSize: JSON.stringify(payload).length,
                timestamp: new Date().toISOString()
            });

            const { formData } = payload;
            const endpoint = formData.id ? '/api/update-proposals' : '/api/create-proposals';

            console.log('📡 [DEBUG] Making API request:', {
                endpoint,
                method: 'POST',
                isUpdate: !!formData.id,
                proposalId: formData.id || 'new'
            });

            const response = await axiosInstance.post(endpoint, payload);

            console.log('📥 [DEBUG] API response received:', {
                status: response.status,
                success: response.data?.success,
                message: response.data?.message,
                dataId: response.data?.data?.id,
                timestamp: new Date().toISOString()
            });

            return response.data;
        } catch (error) {
            console.error('❌ [DEBUG] sendFormDataToBackend thunk error:', {
                endpoint: error.config?.url,
                status: error.response?.status,
                message: error.response?.data?.message || error.message,
                proposalId: payload?.formData?.id,
                action: payload?.action,
                timestamp: new Date().toISOString()
            });
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const getProposal = createAsyncThunk(
    'proposal/getProposal',
    async (groupId = null, { rejectWithValue }) => {
        try {
            let url = '/api/get-proposals';
            if (groupId) {
                url += `?group_id=${groupId}`;
            }
            const response = await axiosInstance.get(url);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Fetch orders: accepted and/or locked proposals
export const getOrders = createAsyncThunk(
    'proposal/getOrders',
    async ({ groupId = null, mineOnly = false } = {}, { rejectWithValue }) => {
        try {
            const params = new URLSearchParams()
            if (groupId) params.append('group_id', groupId)
            // Show only accepted orders; backend expands to include legacy 'Proposal accepted'
            params.append('status', 'accepted')
            if (mineOnly) params.append('mine', 'true')
            const url = `/api/get-proposals?${params.toString()}`
            const response = await axiosInstance.get(url)
            return response.data
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message)
        }
    }
)

export const getProposalById = createAsyncThunk(
    'proposal/getProposalById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`/api/quotes/proposalByID/${id}`);
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



export const updateProposalStatus = createAsyncThunk(
    'proposal/updateProposalStatus',
    async ({ id, action, status }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/api/quotes/${id}/status`, { action, status });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const acceptProposal = createAsyncThunk(
    'proposal/acceptProposal',
    async ({ id, externalSignerName, externalSignerEmail }, { rejectWithValue }) => {
        try {
            console.log('🚀 [DEBUG] acceptProposal thunk called:', {
                id,
                externalSignerName,
                externalSignerEmail,
                timestamp: new Date().toISOString()
            });

            const requestBody = {};
            if (externalSignerName) requestBody.external_signer_name = externalSignerName;
            if (externalSignerEmail) requestBody.external_signer_email = externalSignerEmail;

            console.log('📡 [DEBUG] Making API request to accept proposal:', {
                url: `/api/quotes/${id}/accept`,
                requestBody
            });

            const response = await axiosInstance.post(`/api/quotes/${id}/accept`, requestBody);

            console.log('✅ [DEBUG] API response received:', {
                status: response.status,
                success: response.data?.success,
                message: response.data?.message,
                data: response.data?.data
            });

            return response.data;
        } catch (error) {
            console.error('❌ [DEBUG] acceptProposal thunk error:', {
                error: error.message,
                response: error.response?.data,
                status: error.response?.status,
                id,
                timestamp: new Date().toISOString()
            });
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
        currentProposal: null,
        loading: false,
    },
    reducers: {
        resetFormDataState: (state) => {
            state.submitting = false;
            state.success = null;
            state.error = null;
            state.response = null;
            state.data = null;
            state.currentProposal = null;
        },
        clearCurrentProposal: (state) => {
            state.currentProposal = null;
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
                state.loading = true;
                state.error = null;
            })
            .addCase(getProposal.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload.data;
            })
            .addCase(getProposal.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // GET ORDERS
        builder
            .addCase(getOrders.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload.data;
            })
            .addCase(getOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // GET PROPOSAL BY ID
        builder
            .addCase(getProposalById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getProposalById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentProposal = action.payload;
            })
            .addCase(getProposalById.rejected, (state, action) => {
                state.loading = false;
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

        // UPDATE PROPOSAL STATUS
        builder
            .addCase(updateProposalStatus.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(updateProposalStatus.fulfilled, (state, action) => {
                state.submitting = false;
                state.success = true;
                state.response = action.payload;
                // Update the proposal in the list if it exists
                const proposalIndex = state.data.findIndex(p => p.id === action.payload.data.id);
                if (proposalIndex !== -1) {
                    state.data[proposalIndex] = action.payload.data;
                }
            })
            .addCase(updateProposalStatus.rejected, (state, action) => {
                state.submitting = false;
                state.success = false;
                state.error = action.payload;
            });

        // ACCEPT PROPOSAL
        builder
            .addCase(acceptProposal.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(acceptProposal.fulfilled, (state, action) => {
                state.submitting = false;
                state.success = true;
                state.response = action.payload;
                // Update the proposal in the list if it exists
                const proposalIndex = state.data.findIndex(p => p.id === action.payload.data.id);
                if (proposalIndex !== -1) {
                    state.data[proposalIndex] = action.payload.data;
                }
                // Update current proposal if viewing details
                if (state.currentProposal && state.currentProposal.id === action.payload.data.id) {
                    state.currentProposal = action.payload.data;
                }
            })
            .addCase(acceptProposal.rejected, (state, action) => {
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



export const { resetFormDataState, clearCurrentProposal } = formDataSlice.actions;
export default formDataSlice.reducer;

