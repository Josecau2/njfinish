import { createSlice } from '@reduxjs/toolkit'

const tableItemsSlice = createSlice({
  name: 'tableItems',
  initialState: {
    data: [],
  },
  reducers: {
    // Redux Toolkit uses Immer - direct state assignments are safe and converted to immutable updates
    setTableItems(state, action) {
      state.data = action.payload // Replace the whole tableItems list
    },
    clearTableItems(state) {
      state.data = []
    },
  },
})

export const { setTableItems, clearTableItems } = tableItemsSlice.actions
export default tableItemsSlice.reducer
