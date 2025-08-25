import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../helpers/axiosInstance'

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const sendFormDataToBackend = createAsyncThunk(
    'proposal/sendFormDataToBackend',
    async (payload, { rejectWithValue }) => {
        try {
            const { formData } = payload;
            const endpoint = formData.id ? '/api/update-proposals' : '/api/create-proposals';
            
            const response = await axiosInstance.post(endpoint, payload, {
                headers: getAuthHeaders()
            });
            
            return response.data;
        } catch (error) {
            console.error('❌ Proposal request failed:', {
                endpoint: error.config?.url,
                status: error.response?.status,
                message: error.response?.data?.message || error.message
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
            const response = await axiosInstance.get(url, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const getProposalById = createAsyncThunk(
    'proposal/getProposalById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`/api/proposals/proposalByID/${id}`, {
                headers: getAuthHeaders()
            });
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
            const response = await axiosInstance.put(`/api/form/${id}`, updatedData, {
                headers: getAuthHeaders()
            });
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
            const response = await axiosInstance.delete(`/api/delete-proposals/${id}`, {
                headers: getAuthHeaders()
            });
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
            const response = await axiosInstance.put(`/api/proposals/${id}/status`, { action, status }, {
                headers: getAuthHeaders()
            });
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
            const requestBody = {};
            if (externalSignerName) requestBody.external_signer_name = externalSignerName;
            if (externalSignerEmail) requestBody.external_signer_email = externalSignerEmail;
            
            const response = await axiosInstance.post(`/api/proposals/${id}/accept`, requestBody, {
                headers: getAuthHeaders()
            });
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
            const response = await axiosInstance.get(`/api/get-contracts`, {
                headers: getAuthHeaders()
            });
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

