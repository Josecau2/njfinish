import React from 'react'
import {
  RedirectToNoisyEditProposal,
  RedirectToNoisyEditCustomer,
  RedirectToNoisyEditManufacturer,
  RedirectToNoisyEditUser,
  RedirectToNoisyEditUserGroup,
  RedirectToNoisyEditLocation,
  RedirectToNoisyContractorDetail,
  RedirectToNoisyAdminProposalView,
} from './components/NoisyRedirects'

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
const TermsPage = React.lazy(() => import('./pages/settings/terms/TermsPage'))
const AdminOrders = React.lazy(() => import('./pages/orders/AdminOrders'))
const MyOrders = React.lazy(() => import('./pages/orders/MyOrders'))
const OrderDetails = React.lazy(() => import('./pages/orders/OrderDetails'))

const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))
const Resources = React.lazy(() => import('../src/pages/Resources'))
const Calender = React.lazy(() => import('./pages/calender'))
const Contractors = React.lazy(() => import('./pages/admin/Contractors'))
const ContractorDetail = React.lazy(() => import('./pages/admin/ContractorDetail'))
const NotificationsPage = React.lazy(() => import('./views/notifications/NotificationsPage'))
const AdminProposalView = React.lazy(() => import('./views/proposals/AdminProposalView'))
const ContactUs = React.lazy(() => import('./pages/contact/ContactUs'))

const routes = [
  { path: '/', name: 'Dashboard', element: Dashboard },
  { path: '/profile', name: 'Profile', element: Profile },
  
  // Customer routes
  { path: '/customers', name: 'Customers', element: Customers, permission: 'customers:read' },
  // Plain path -> redirect to canonical noisy path
  { path: '/customers/edit/:id', name: 'Edit Customer (redirect)', element: RedirectToNoisyEditCustomer, permission: 'customers:update' },
  { path: '/:noise1/:noise2/customers/edit/:id', name: 'Edit Customer (noisy)', element: CustomerForm, permission: 'customers:update' },
  { path: '/customers/add', name: 'Add Customer', element: CustomerForm, permission: 'customers:create' },
  
  // Quote routes
  { path: '/quotes', name: 'Quote', element: Proposals, permission: 'proposals:read' },
  { path: '/quotes/create', name: 'CreateQuoteForm', element: CreateProposalForm, permission: 'proposals:create' },
  { path: '/quotes/edit/:id', name: 'EditQuote (redirect)', element: RedirectToNoisyEditProposal, permission: 'proposals:update' },
  { path: '/:noise1/:noise2/quotes/edit/:id', name: 'EditQuote (noisy)', element: EditProposal, permission: 'proposals:update' },
  
  // Contracts (related to quotes) - blocked for contractors
  { path: '/contracts', name: 'Contracts', element: Contracts, permission: 'proposals:read', contractorBlock: true },

  // Orders routes
  { path: '/orders', name: 'Orders', element: AdminOrders, permission: 'proposals:read', contractorBlock: true },
  { path: '/my-orders', name: 'My Orders', element: MyOrders, permission: 'proposals:read' },
  { path: '/orders/:id', name: 'Order Details', element: OrderDetails, permission: 'proposals:read', contractorBlock: true },
  { path: '/my-orders/:id', name: 'My Order Details', element: OrderDetails, permission: 'proposals:read' },
  
  // Resources
  { path: '/resources', name: 'Resources', element: Resources, permission: 'resources:read' },
  { path: '/contact', name: 'Contact Us', element: ContactUs },
  
  // Calendar  
  { path: '/calender', name: 'Calender', element: Calender, module: 'calendar' },
  
  // Settings routes (admin only)
  { path: '/settings/manufacturers', name: 'ManufacturersList', element: ManufacturersList, permission: 'settings:manufacturers' },
  { path: '/settings/manufacturers/create', name: 'ManufacturersList', element: ManufacturersForm, permission: 'settings:manufacturers' },
  { path: '/settings/manufacturers/edit/:id', name: 'EditManufacturer (redirect)', element: RedirectToNoisyEditManufacturer, permission: 'settings:manufacturers' },
  { path: '/:noise1/:noise2/settings/manufacturers/edit/:id', name: 'EditManufacturer (noisy)', element: EditManufacturer, permission: 'settings:manufacturers' },
  { path: '/settings/usergroup/multipliers', name: 'ManufacturersMultipliers', element: ManufacturersMultipliers, permission: 'settings:manufacturers' },
  
  { path: '/settings/users', name: 'Users', element: UserList, permission: 'settings:users' },
  { path: '/settings/users/create', name: 'Users', element: CreateUser, permission: 'settings:users' },
  { path: '/settings/users/edit/:id', name: 'Users (redirect)', element: RedirectToNoisyEditUser, permission: 'settings:users' },
  { path: '/:noise1/:noise2/settings/users/edit/:id', name: 'Users (noisy)', element: EditUser, permission: 'settings:users' },
  
  { path: '/settings/users/groups', name: 'User Groups', element: UserGroupList, permission: 'settings:groups' },
  { path: '/settings/users/group/create', name: 'Users Group', element: CreateUserGroup, permission: 'settings:groups' },
  { path: '/settings/users/group/edit/:id', name: 'Edit User Group (redirect)', element: RedirectToNoisyEditUserGroup, permission: 'settings:groups' },
  { path: '/:noise1/:noise2/settings/users/group/edit/:id', name: 'Edit User Group (noisy)', element: EditUserGroup, permission: 'settings:groups' },
  
  { path: '/settings/locations', name: 'Locations', element: LocationList, permission: 'settings:locations' },
  { path: '/settings/locations/create', name: 'Locations', element: CreateLocation, permission: 'settings:locations' },
  { path: '/settings/locations/edit/:id', name: 'Locations (redirect)', element: RedirectToNoisyEditLocation, permission: 'settings:locations' },
  { path: '/:noise1/:noise2/settings/locations/edit/:id', name: 'Locations (noisy)', element: EditLocation, permission: 'settings:locations' },
  
  { path: '/settings/taxes', name: 'Tax', element: Tax, permission: 'settings:taxes' },
  
  { path: '/settings/customization', name: 'customization', element: CustomizationPage, permission: 'settings:customization' },
  { path: '/settings/pdflayoutcustomization', name: 'PdfLayoutCustomization', element: PdfLayoutCustomization, permission: 'settings:customization' },
  { path: '/settings/loginlayoutcustomization', name: 'loginlayoutcustomization', element: LoginCustomizerPage, permission: 'settings:customization' },
  { path: '/settings/ui-customization', name: 'UI Customization', element: UiCustomization, permission: 'settings:customization' },
  { path: '/settings/terms', name: 'Terms & Conditions', element: TermsPage, permission: 'settings:customization' },

  // Admin routes
  { path: '/admin/contractors', name: 'Contractors', element: Contractors, adminOnly: true },
  { path: '/admin/contractors/:groupId', name: 'Contractor Detail (redirect)', element: RedirectToNoisyContractorDetail, adminOnly: true },
  { path: '/:noise1/:noise2/admin/contractors/:groupId', name: 'Contractor Detail (noisy)', element: ContractorDetail, adminOnly: true },
  { path: '/admin/notifications', name: 'Notifications', element: NotificationsPage, permission: 'admin:notifications' },
  // General notifications page for all authenticated users (contractors included)
  { path: '/notifications', name: 'Notifications', element: NotificationsPage },
  { path: '/quotes/:proposalId/admin-view', name: 'Admin Quote View (redirect)', element: RedirectToNoisyAdminProposalView, permission: 'admin:proposals_view' },
  { path: '/:noise1/:noise2/quotes/:proposalId/admin-view', name: 'Admin Quote View (noisy)', element: AdminProposalView, permission: 'admin:proposals_view' },

  // Fallback
  { path: '*', name: '404', element: Page404 },
]

export default routes

