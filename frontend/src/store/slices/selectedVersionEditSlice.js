import { createSlice } from '@reduxjs/toolkit'

const tableItemsEditSlice = createSlice({
  name: 'tableItems',
  initialState: {
    data: [],
  },
  reducers: {
    // Redux Toolkit uses Immer - direct state assignments are safe and converted to immutable updates
    setTableItemsEdit(state, action) {
      state.data = action.payload // Replace the whole tableItems list
    },
    clearTableItemsEdit(state) {
      state.data = []
    },
  },
})

export const { setTableItemsEdit, clearTableItemsEdit } = tableItemsEditSlice.actions
export default tableItemsEditSlice.reducer
