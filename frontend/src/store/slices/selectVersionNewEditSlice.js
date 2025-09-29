// store/slices/selectVersionNewSlice.js
import { createSlice } from '@reduxjs/toolkit'

const selectVersionNewEditSlice = createSlice({
  name: 'selectVersionNew',
  initialState: {
    data: null,
  },
  reducers: {
    setSelectVersionNewEdit(state, action) {
      state.data = action.payload
    },
    clearSelectVersionNewEdit(state) {
      state.data = null
    },
  },
})

export const { setSelectVersionNewEdit, clearSelectVersionNewEdit } =
  selectVersionNewEditSlice.actions
export default selectVersionNewEditSlice.reducer
