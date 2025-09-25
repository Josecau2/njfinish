import { createSlice } from '@reduxjs/toolkit'

const brandSnapshot = (typeof window !== 'undefined' && window.__BRAND__) || {}
const brandColors = brandSnapshot.colors || {}
const brandApp = brandSnapshot.app || {}

const initialState = {
  headerBg: brandColors.headerBg || '#ffffff',
  headerFontColor: brandColors.headerText || '#333333',
  sidebarBg: brandColors.sidebarBg || '#2e2e2e',
  sidebarFontColor: brandColors.sidebarText || '#ffffff',
  logoText: brandApp.logoText || brandSnapshot.logoAlt || 'NJ Cabinets',
  logoImage: brandSnapshot.logoDataURI || brandApp.logoImage || null,
  logoBg: brandColors.logoBg || '#000000',
  companyName: brandApp.companyName || '',
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
export { initialState as initialCustomizationState }
