import React from 'react'

// Pages (Lazy loaded)
const Dashboard = React.lazy(() => import('./pages/dashboard/Dashboard'))
const Customers = React.lazy(() => import('./pages/customers/Customers'))
const CustomerForm = React.lazy(() => import('./pages/customers/CustomerForm'))
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
const UserGroupList = React.lazy(() => import('./pages/settings/usersGroup/UserGroupList'))
const EditUserGroup = React.lazy(() => import('./pages/settings/usersGroup/EditUserGroup'))
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
const Contractors = React.lazy(() => import('./pages/admin/Contractors'))
const ContractorDetail = React.lazy(() => import('./pages/admin/ContractorDetail'))
const NotificationsPage = React.lazy(() => import('./views/notifications/NotificationsPage'))
const AdminProposalView = React.lazy(() => import('./views/proposals/AdminProposalView'))

const routes = [
  { path: '/', name: 'Dashboard', element: Dashboard },
  { path: '/profile', name: 'Profile', element: Profile },
  
  // Customer routes
  { path: '/customers', name: 'Customers', element: Customers, permission: 'customers:read' },
  { path: '/customers/edit/:id', name: 'Edit Customer', element: CustomerForm, permission: 'customers:update' },
  { path: '/customers/add', name: 'Add Customer', element: CustomerForm, permission: 'customers:create' },
  
  // Proposal routes
  { path: '/proposals', name: 'Proposal', element: Proposals, permission: 'proposals:read' },
  { path: '/proposals/create', name: 'CreateProposalForm', element: CreateProposalForm, permission: 'proposals:create' },
  { path: '/proposals/edit/:id', name: 'EditProposal', element: EditProposal, permission: 'proposals:update' },
  
  // Contracts (related to proposals) - blocked for contractors
  { path: '/contracts', name: 'Contracts', element: Contracts, permission: 'proposals:read', contractorBlock: true },
  
  // Resources
  { path: '/resources', name: 'Resources', element: Resources, permission: 'resources:read' },
  
  // Calendar  
  { path: '/calender', name: 'Calender', element: Calender, module: 'calendar' },
  
  // Settings routes (admin only)
  { path: '/settings/manufacturers', name: 'ManufacturersList', element: ManufacturersList, permission: 'settings:manufacturers' },
  { path: '/settings/manufacturers/create', name: 'ManufacturersList', element: ManufacturersForm, permission: 'settings:manufacturers' },
  { path: '/settings/manufacturers/edit/:id', name: 'EditManufacturer', element: EditManufacturer, permission: 'settings:manufacturers' },
  { path: '/settings/usergroup/multipliers', name: 'ManufacturersMultipliers', element: ManufacturersMultipliers, permission: 'settings:manufacturers' },
  
  { path: '/settings/users', name: 'Users', element: UserList, permission: 'settings:users' },
  { path: '/settings/users/create', name: 'Users', element: CreateUser, permission: 'settings:users' },
  { path: '/settings/users/edit/:id', name: 'Users', element: EditUser, permission: 'settings:users' },
  
  { path: '/settings/users/groups', name: 'User Groups', element: UserGroupList, permission: 'settings:groups' },
  { path: '/settings/users/group/create', name: 'Users Group', element: CreateUserGroup, permission: 'settings:groups' },
  { path: '/settings/users/group/edit/:id', name: 'Edit User Group', element: EditUserGroup, permission: 'settings:groups' },
  
  { path: '/settings/locations', name: 'Locations', element: LocationList, permission: 'settings:locations' },
  { path: '/settings/locations/create', name: 'Locations', element: CreateLocation, permission: 'settings:locations' },
  { path: '/settings/locations/edit/:id', name: 'Locations', element: EditLocation, permission: 'settings:locations' },
  
  { path: '/settings/taxes', name: 'Tax', element: Tax, permission: 'settings:taxes' },
  
  { path: '/settings/customization', name: 'customization', element: CustomizationPage, permission: 'settings:customization' },
  { path: '/settings/pdflayoutcustomization', name: 'PdfLayoutCustomization', element: PdfLayoutCustomization, permission: 'settings:customization' },
  { path: '/settings/loginlayoutcustomization', name: 'loginlayoutcustomization', element: LoginCustomizerPage, permission: 'settings:customization' },
  { path: '/settings/ui-customization', name: 'UI Customization', element: UiCustomization, permission: 'settings:customization' },

  // Admin routes
  { path: '/admin/contractors', name: 'Contractors', element: Contractors, adminOnly: true },
  { path: '/admin/contractors/:groupId', name: 'Contractor Detail', element: ContractorDetail, adminOnly: true },
  { path: '/admin/notifications', name: 'Notifications', element: NotificationsPage, permission: 'admin:notifications' },
  { path: '/proposals/:proposalId/admin-view', name: 'Admin Proposal View', element: AdminProposalView, permission: 'admin:proposals_view' },

  // Fallback
  { path: '*', name: '404', element: Page404 },
]

export default routes

