import { createSlice } from '@reduxjs/toolkit'
import { getContracts } from './proposalSlice' 

const contractsSlice = createSlice({
  name: 'contracts',
  initialState: {
    loading: false,
    error: null,
    data: [],
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getContracts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getContracts.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload.data || []
      })
      .addCase(getContracts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export default contractsSlice.reducer
