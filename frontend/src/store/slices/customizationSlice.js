import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  headerBg: '#ffffff',
  headerFontColor: '#333333',
  sidebarBg: '#2e2e2e',
  sidebarFontColor: '#ffffff',
  logoText: 'NJ Cabinets',
  logoImage: null,
}

const customizationSlice = createSlice({
  name: 'customization',
  initialState,
  reducers: {
    setCustomization: (state, action) => {
      return { ...state, ...action.payload }
    },
  },
})

export const { setCustomization } = customizationSlice.actions
export default customizationSlice.reducer
