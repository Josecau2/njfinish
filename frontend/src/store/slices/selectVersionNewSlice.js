// store/slices/selectVersionNewSlice.js
import { createSlice } from '@reduxjs/toolkit'

const selectVersionNewSlice = createSlice({
  name: 'selectVersionNew',
  initialState: {
    data: null,
  },
  reducers: {
    // Redux Toolkit uses Immer - direct state assignments are safe and converted to immutable updates
    setSelectVersionNew(state, action) {
      state.data = action.payload
    },
    clearSelectVersionNew(state) {
      state.data = null
    },
  },
})

export const { setSelectVersionNew, clearSelectVersionNew } = selectVersionNewSlice.actions
export default selectVersionNewSlice.reducer
