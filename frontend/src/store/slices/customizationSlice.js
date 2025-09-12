import { createSlice } from '@reduxjs/toolkit'
import { CUSTOMIZATION_CONFIG } from '../../config/customization'

// Use generated static config as initial state to avoid flicker before API load
const initialState = {
  headerBg: CUSTOMIZATION_CONFIG.headerBg || '#ffffff',
  headerFontColor: CUSTOMIZATION_CONFIG.headerFontColor || '#333333',
  sidebarBg: CUSTOMIZATION_CONFIG.sidebarBg || '#2e2e2e',
  sidebarFontColor: CUSTOMIZATION_CONFIG.sidebarFontColor || '#ffffff',
  logoText: CUSTOMIZATION_CONFIG.logoText || 'NJ Cabinets',
  logoImage: CUSTOMIZATION_CONFIG.logoImage || null,
  logoBg: CUSTOMIZATION_CONFIG.logoBg || '#000000',
  companyName: CUSTOMIZATION_CONFIG.companyName || ''
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
