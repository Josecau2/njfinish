import { configureStore } from '@reduxjs/toolkit'
import sidebarReducer from './slices/sidebarSlice'
import dashboardReducer from './slices/dashboardSlice'
import customerReducer from './slices/customerSlice'
import manufacturersReducer from './slices/manufacturersSlice'
import multiManufacturerReducer from './slices/manufacturersMultiplierSlice'
import userReducer from './slices/userSlice'
import userGroupReducer from './slices/userGroupSlice'
import locationReducer from './slices/locationSlice'
import taxReducer from './slices/taxSlice'
import customizationReducer from './slices/customizationSlice'
import selectedVersionReducer from './slices/selectedVersionSlice'
import selectVersionNewReducer from './slices/selectVersionNewSlice'
import selectedVersionEditReducer from './slices/selectedVersionEditSlice'
import selectVersionNewEditReducer from './slices/selectVersionNewEditSlice'
import contractorReducer from './slices/contractorSlice'
import authReducer from './slices/authSlice'
import ordersReducer from './slices/ordersSlice'
import paymentsReducer from './slices/paymentsSlice'

const store = configureStore({
  reducer: {
    auth: authReducer,
    sidebar: sidebarReducer,
    dashboard: dashboardReducer,
    customers: customerReducer,
    manufacturers: manufacturersReducer,
    multiManufacturer: multiManufacturerReducer,
    users: userReducer,
    usersGroup: userGroupReducer,
    locations: locationReducer,
    taxes: taxReducer,
    customization: customizationReducer,
    selectedVersion: selectedVersionReducer,
    selectVersionNew: selectVersionNewReducer,
    selectedVersionEdit: selectedVersionEditReducer,
    selectVersionNewEdit: selectVersionNewEditReducer,
    contractors: contractorReducer,
    orders: ordersReducer,
    payments: paymentsReducer,
  },
})

export default store
