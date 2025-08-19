import { configureStore } from '@reduxjs/toolkit';
import sidebarReducer from './slices/sidebarSlice';
import dashboardReducer from './slices/dashboardSlice';
import customerReducer from './slices/customerSlice';
import manufacturersReducer from './slices/manufacturersSlice';
import multiManufacturerReducer from './slices/manufacturersMultiplierSlice';
import userReducer from './slices/userSlice';
import userGroupReducer from './slices/userGroupSlice';
import locationReducer from './slices/locationSlice';
import taxReducer from './slices/taxSlice';
import proposalReducer from './slices/proposalSlice';
import customizationReducer from './slices/customizationSlice';
import selectedVersionReducer from './slices/selectedVersionSlice';
import selectVersionNewReducer from './slices/selectVersionNewSlice';

import selectedVersionEditReducer from './slices/selectedVersionEditSlice';
import selectVersionNewEditReducer from './slices/selectedVersionEditSlice';
import contractsReducer from './slices/contractsSlice'

const store = configureStore({
  reducer: {
    sidebar: sidebarReducer,
    dashboard: dashboardReducer,
    customers: customerReducer,
    manufacturers: manufacturersReducer,
    multiManufacturer: multiManufacturerReducer,
    users: userReducer,
    usersGroup: userGroupReducer,
    locations: locationReducer,
    taxes: taxReducer,
    proposal: proposalReducer,
    customization: customizationReducer,
    selectedVersion: selectedVersionReducer,
    selectVersionNew: selectVersionNewReducer,
    selectedVersionEdit: selectedVersionEditReducer,
    selectVersionNewEdit: selectVersionNewEditReducer,
    contracts: contractsReducer,

  },
});

export default store;