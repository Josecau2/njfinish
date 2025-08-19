import React from 'react'

// Pages (Lazy loaded)
const Dashboard = React.lazy(() => import('./pages/dashboard/Dashboard'))
const Customers = React.lazy(() => import('./pages/customers/Customers'))
const AddCustomerForm = React.lazy(() => import('./pages/customers/AddCustomerForm'))
const Proposals = React.lazy(() => import('./pages/proposals/Proposals'))
const CreateProposalForm = React.lazy(() => import('./pages/proposals/CreateProposalForm'))
const EditProposal = React.lazy(() => import('./pages/proposals/EditProposal/EditProposal'))
const ManufacturersList = React.lazy(() => import('./pages/settings/manufacturers/ManufacturersList'))
const ManufacturersForm = React.lazy(() => import('./pages/settings/manufacturers/ManufacturersForm'))
const EditManufacturer = React.lazy(() => import('./pages/settings/manufacturers/EditManufacturer'))
const ManufacturersMultipliers = React.lazy(() => import('./pages/settings/multipliers/ManuMultipliers'))
const UserList = React.lazy(() => import('./pages/settings/users/UserList'))
const CreateUser = React.lazy(() => import('./pages/settings/users/CreateUser'))
const CreateUserGroup = React.lazy(() => import('./pages/settings/usersGroup/CreateUserGroup'))
const EditUser = React.lazy(() => import('./pages/settings/users/EditUser'))
const LocationList = React.lazy(() => import('./pages/settings/locations/LocationList'))
const CreateLocation = React.lazy(() => import('./pages/settings/locations/CreateLocation'))
const EditLocation = React.lazy(() => import('./pages/settings/locations/EditLocation'))
const Profile = React.lazy(() => import('./pages/profile'))
const Tax = React.lazy(() => import('./pages/settings/taxes/TaxesPage'))
const EditCustomerPage = React.lazy(() => import('./pages/customers/EditCustomerPage'))
const CustomizationPage = React.lazy(() => import('./pages/settings/customization/CustomizationPage'))
const PdfLayoutCustomization = React.lazy(() => import('./pages/settings/customization/PdfLayoutCustomization'))
const LoginCustomizerPage = React.lazy(() => import('./pages/settings/customization/LoginCustomizerPage'))
const Contracts = React.lazy(() => import('./pages/contracts'))
const UiCustomization = React.lazy(() => import('./pages/settings/customization'))

const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))
const Resources = React.lazy(() => import('../src/pages/Resources'))
const Calender = React.lazy(() => import('./pages/calender'))

const routes = [
  { path: '/', name: 'Dashboard', element: Dashboard },
  { path: '/profile', name: 'Profile', element: Profile },
  { path: '/customers', name: 'Customers', element: Customers },
  { path: '/customers/edit/:customerId', name: 'EditCustomerPage', element: EditCustomerPage },
  { path: '/customers/add', name: 'AddCustomerForm', element: AddCustomerForm },
  { path: '/proposals', name: 'Proposal', element: Proposals },
  { path: '/proposals/create', name: 'CreateProposalForm', element: CreateProposalForm },
  { path: '/settings/manufacturers', name: 'ManufacturersList', element: ManufacturersList },
  { path: '/settings/manufacturers/create', name: 'ManufacturersList', element: ManufacturersForm },
  { path: '/settings/manufacturers/edit/:id', name: 'EditManufacturer', element: EditManufacturer },
  { path: '/settings/usergroup/multipliers', name: 'ManufacturersMultipliers', element: ManufacturersMultipliers },
  { path: '/settings/users', name: 'Users', element: UserList },
  { path: '/settings/users/create', name: 'Users', element: CreateUser },
  { path: '/settings/users/group/create', name: 'Users Group', element: CreateUserGroup },
  { path: '/settings/users/edit/:id', name: 'Users', element: EditUser },
  { path: '/settings/locations', name: 'Locations', element: LocationList },
  { path: '/settings/locations/create', name: 'Locations', element: CreateLocation },
  { path: '/settings/locations/edit/:id', name: 'Locations', element: EditLocation },
  { path: '/settings/taxes', name: 'Tax', element: Tax },
  { path: '*', name: '404', element: Page404 },
  { path: '/settings/customization', name: 'customization', element: CustomizationPage },
  { path: '/settings/pdflayoutcustomization', name: 'PdfLayoutCustomization', element: PdfLayoutCustomization },
  { path: '/settings/loginlayoutcustomization', name: 'loginlayoutcustomization', element: LoginCustomizerPage },
  { path: '/proposals/edit/:id', name: 'EditProposal', element: EditProposal },
  { path: '/contracts', name: 'Contracts', element: Contracts },
  { path: '/settings/ui-customization', name: 'UI Customization', element: UiCustomization },

  { path: '/resources', name: 'Resources', element: Resources },
  { path: '/calender', name: 'Calender', element: Calender },



]

export default routes

