# LEGACY VS CURRENT FLOW AUDIT - PART 2: ORDERS, CUSTOMERS, USERS, PAYMENTS, AUTH, SETTINGS

**Audit Date**: 2025-10-03
**Branches Compared**: `master` (legacy) vs `njnewui` (current)
**Auditor**: Comprehensive automated analysis

---

## EXECUTIVE SUMMARY

This document (Part 2) covers the remaining critical flows: Orders, Customers, Users, Payments, Authentication, and Settings. Part 1 covered the Proposals flow.

**Key Architectural Changes**:
- ✅ Backend controllers remain **IDENTICAL** (all business logic preserved)
- ❌ Frontend completely migrated from **CoreUI → Chakra UI**
- ❌ State management shifted from **Redux-only → React Query + Redux hybrid**
- ✅ Dark mode support added throughout
- ✅ Mobile-responsive layouts added
- ❌ Several Redux slices **completely deleted** (proposalSlice, contractsSlice, notificationSlice)

---

## CRITICAL ARCHITECTURAL CHANGES

### Inconsistency #1: Complete UI Framework Migration
**Files**: All frontend components (100+ files)
**Severity**: **CRITICAL - BREAKING CHANGE**

**Description**:
The entire application has been migrated from CoreUI to Chakra UI. This is a complete rewrite of every UI component.

**Legacy Code (master)**:
```js
// CoreUI components
import { CBadge, CButton, CTable, CTableBody, CFormInput } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilCreditCard } from '@coreui/icons'

<CButton color="primary">Click</CButton>
<CTable hover>
  <CTableHead>...</CTableHead>
</CTable>
```

**Current Code (njnewui)**:
```js
// Chakra UI components
import { Badge, Button, Table, Thead, Input, useColorModeValue } from '@chakra-ui/react'
import { Search, CreditCard } from 'lucide-react'

<Button colorScheme="brand">Click</Button>
<TableContainer>
  <Table size="sm" variant="simple">
    <Thead>...</Thead>
  </Table>
</TableContainer>
```

**Impact**:
- **Breaking**: All component APIs changed
- **Breaking**: Icon libraries changed (CoreUI icons → Lucide React)
- **New**: Built-in dark mode support via `useColorModeValue`
- **New**: Responsive design patterns changed
- **Risk**: Entire UI behavior may differ (event handling, accessibility, styling)

---

### Inconsistency #2: State Management Architecture - Redux Slice Removal
**Files**:
- master: `frontend/src/store/slices/proposalSlice.js` (350+ lines)
- njnewui: **FILE DELETED**
- master: `frontend/src/store/slices/contractsSlice.js`
- njnewui: **FILE DELETED**
- master: `frontend/src/store/notificationSlice.js`
- njnewui: **FILE DELETED**

**Severity**: **CRITICAL - BREAKING CHANGE**

**Description**:
Major Redux slices completely removed from the store. Business logic migrated to React Query.

**Legacy Code (master store/index.js)**:
```js
import proposalReducer from './slices/proposalSlice';
import contractsReducer from './slices/contractsSlice';
import notificationReducer from './notificationSlice';

const store = configureStore({
  reducer: {
    proposal: proposalReducer,      // ← REMOVED
    contracts: contractsReducer,     // ← REMOVED
    notification: notificationReducer, // ← REMOVED
    orders: ordersReducer,
    payments: paymentsReducer,
  },
});
```

**Current Code (njnewui store/index.js)**:
```js
// proposalSlice, contractsSlice, notificationSlice NOT imported

const store = configureStore({
  reducer: {
    // proposal: REMOVED - now uses React Query
    // contracts: REMOVED - now uses React Query
    // notification: REMOVED - now uses toast notifications
    orders: ordersReducer,
    payments: paymentsReducer,
  },
});
```

**Impact**:
- **Breaking**: All components using `useSelector(state => state.proposal)` will break
- **Breaking**: All `dispatch(sendFormDataToBackend(...))` calls must be refactored
- **Breaking**: All `dispatch(getProposal(...))` calls must be refactored
- **Migration Path**: Must use React Query hooks instead

---

### Inconsistency #3: React Query Introduction for Data Fetching
**Files**:
- master: No React Query files exist
- njnewui:
  - `frontend/src/queries/proposalQueries.js` (NEW - 288 lines)
  - `frontend/src/queries/paymentsQueries.js` (NEW)
  - `frontend/src/queries/contractQueries.js` (NEW)
  - `frontend/src/queries/notificationQueries.js` (NEW)

**Severity**: **CRITICAL - ARCHITECTURAL CHANGE**

**Description**:
njnewui introduces @tanstack/react-query for server state management, replacing Redux thunks for data fetching.

**Legacy Code (master - proposalSlice.js)**:
```js
// Redux thunk approach
export const sendFormDataToBackend = createAsyncThunk(
  'proposal/sendFormDataToBackend',
  async (payload, { rejectWithValue }) => {
    const endpoint = formData.id ? '/api/update-proposals' : '/api/create-proposals';
    const response = await axiosInstance.post(endpoint, payload);
    return response.data;
  }
);

export const getProposal = createAsyncThunk(
  'proposal/getProposal',
  async (groupId = null, { rejectWithValue }) => {
    let url = '/api/get-proposals';
    if (groupId) url += `?group_id=${groupId}`;
    const response = await axiosInstance.get(url);
    return response.data;
  }
);

// Usage in components:
const dispatch = useDispatch();
const { proposals, loading } = useSelector(s => s.proposal);

useEffect(() => {
  dispatch(getProposal(groupId));
}, [dispatch, groupId]);
```

**Current Code (njnewui - proposalQueries.js)**:
```js
// React Query approach
export const proposalKeys = {
  all: ['proposals'],
  lists: () => [...proposalKeys.all, 'list'],
  list: (filters) => [...proposalKeys.lists(), filters],
  details: () => [...proposalKeys.all, 'detail'],
  detail: (id) => [...proposalKeys.details(), id],
}

export const useProposals = (groupId = null) => {
  return useQuery({
    queryKey: proposalKeys.list({ groupId }),
    queryFn: async () => {
      let url = '/api/get-proposals'
      if (groupId) url += `?group_id=${groupId}`
      const response = await axiosInstance.get(url)
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Usage in components:
const { data: proposals, isLoading, error } = useProposals(groupId);
// No dispatch, no useEffect needed!
```

**Impact**:
- **Breaking**: All Redux-based data fetching replaced with React Query hooks
- **New**: Automatic caching with 5-minute stale time
- **New**: Automatic background refetching
- **New**: Optimistic updates for mutations
- **Performance**: Better caching and deduplication
- **Migration Required**: All components must be refactored from Redux patterns to React Query patterns

---

## ORDERS FLOW INCONSISTENCIES

### Inconsistency #4: Orders List - Status Filter Addition
**Files**:
- master: `frontend/src/pages/orders/OrdersList.jsx`
- njnewui: `frontend/src/pages/orders/OrdersList.jsx`

**Lines**: master:N/A vs njnewui:56,62,467-480,209-214
**Severity**: **HIGH - NEW FEATURE**

**Description**:
njnewui adds status filtering UI that doesn't exist in master.

**Legacy Code (master)**:
```js
// NO status filter state
const [search, setSearch] = useState('')
const [page, setPage] = useState(1)

// Simple search filter only
const filtered = useMemo(() => {
  const list = Array.isArray(orders) ? orders : []
  const term = (search || '').toLowerCase()
  return list.filter((p) => {
    if (!term) return true
    // ... customer name search only
  })
}, [orders, search])
```

**Current Code (njnewui)**:
```js
const [statusFilter, setStatusFilter] = useState('All')
const STATUS_OPTIONS = ['All', 'New', 'Processing', 'Paid', 'Cancelled']

// Status filter buttons UI
<HStack spacing={4} wrap="wrap" mb={4}>
  {STATUS_OPTIONS.map((status) => (
    <Button
      key={status}
      variant={statusFilter === status ? 'solid' : 'outline'}
      colorScheme={statusFilter === status ? 'brand' : 'gray'}
      onClick={() => {
        setStatusFilter(status)
        setPage(1)
      }}
    >
      {status}
    </Button>
  ))}
</HStack>

// Apply status filter FIRST, then search
const filtered = useMemo(() => {
  const list = Array.isArray(orders) ? orders : []

  let statusFiltered = list
  if (statusFilter !== 'All') {
    statusFiltered = list.filter((p) => {
      const paymentStatus = p.payment_status || p.paymentStatus || ''
      return paymentStatus.toLowerCase() === statusFilter.toLowerCase()
    })
  }

  // Then apply search to statusFiltered
  return statusFiltered.filter(...)
}, [orders, search, statusFilter])
```

**Impact**:
- **New Feature**: Users can filter orders by payment status (New/Processing/Paid/Cancelled)
- **UX Enhancement**: Visible status filter buttons above the orders table
- **Business Logic**: Two-stage filtering (status → search) vs single-stage (search only)
- **Risk**: Status values must match backend payment status values exactly

---

### Inconsistency #5: Orders Search Enhancement
**Files**:
- master: `frontend/src/pages/orders/OrdersList.jsx`
- njnewui: `frontend/src/pages/orders/OrdersList.jsx`

**Lines**: master:178-191 vs njnewui:217-248
**Severity**: **MEDIUM**

**Description**:
njnewui adds search by order number and description, master only searches by customer name.

**Legacy Code (master)**:
```js
const filtered = useMemo(() => {
  const base = list.filter((p) => {
    if (!term) return true

    // Enhanced customer name search with multiple fallbacks
    const customerName = (
      p.customer?.name ||
      p.proposal?.customerName ||
      p.customer_name ||
      ''
    ).toLowerCase()
    if (customerName.includes(term)) return true

    if (!isContractor) {
      const contractor = (
        p?.Owner?.name ||
        p?.ownerGroup?.name ||
        p?.Owner?.group?.name ||
        ''
      ).toLowerCase()
      if (contractor.includes(term)) return true
    }
    return false // Only customer and contractor search
  })
}, [orders, search, isContractor])
```

**Current Code (njnewui)**:
```js
const base = statusFiltered.filter((p) => {
  if (!term) return true

  // Enhanced search: customer name, order number, description
  const customerName = (
    p.customer?.name ||
    p.proposal?.customerName ||
    p.customer_name ||
    ''
  ).toLowerCase()
  if (customerName.includes(term)) return true

  // Search by order number ← NEW
  const orderNumber = (p.orderNumber || p.order_number || '').toString().toLowerCase()
  if (orderNumber.includes(term)) return true

  // Search by description ← NEW
  const description = (p.description || '').toLowerCase()
  if (description.includes(term)) return true

  if (!isContractor) {
    const contractor = (
      p?.Owner?.name ||
      p?.ownerGroup?.name ||
      p?.Owner?.group?.name ||
      ''
    ).toLowerCase()
    if (contractor.includes(term)) return true
  }
  return false
})
```

**Impact**:
- **Enhancement**: Users can now search orders by order number (e.g., "#12345")
- **Enhancement**: Users can search by description text
- **UX**: Better search discoverability
- **Minor**: Search placeholder text updated to reflect new capabilities

---

### Inconsistency #6: Dark Mode Support Throughout Application
**Files**: All frontend components
**Severity**: **HIGH - NEW FEATURE**

**Description**:
njnewui implements comprehensive dark mode support using Chakra UI's `useColorModeValue` hook.

**Legacy Code (master)**:
```js
// No dark mode support
<CTable hover className="table-modern">
  <CTableHead>
    <CTableHeaderCell>Order #</CTableHeaderCell>
  </CTableHead>
</CTable>

// Hardcoded colors
<div style={{ color: 'gray' }}>No orders found</div>
```

**Current Code (njnewui)**:
```js
// Dark mode color tokens
const hoverBg = useColorModeValue('gray.50', 'gray.700')
const stickyBg = useColorModeValue('white', 'gray.800')
const emptyIconColor = useColorModeValue('gray.400', 'gray.500')
const emptyTextColor = useColorModeValue("gray.500", "gray.400")

<Table size="sm" variant="simple">
  <Thead>
    <Tr>
      <Th position="sticky" left={0} bg={stickyBg} zIndex={1}>
        Order #
      </Th>
    </Tr>
  </Thead>
  <Tbody>
    <Tr _hover={{ bg: hoverBg }}>...</Tr>
  </Tbody>
</Table>

<Text color={emptyTextColor}>No orders found</Text>
```

**Impact**:
- **New Feature**: Full dark mode support across all pages
- **Accessibility**: Improved contrast and readability
- **Modern UX**: Matches OS/browser theme preferences
- **Consistency**: All color values use semantic tokens

---

### Inconsistency #7: Mobile Responsive Design Patterns
**Files**:
- master: `frontend/src/pages/orders/OrdersList.jsx`
- njnewui: `frontend/src/pages/orders/OrdersList.jsx`

**Lines**: master:N/A vs njnewui:619-737
**Severity**: **HIGH - NEW FEATURE**

**Description**:
njnewui implements dedicated mobile card layouts, master only has desktop table view.

**Legacy Code (master)**:
```js
// Single table view, no mobile adaptation
return (
  <CContainer>
    <CTable hover className="table-modern">
      <CTableHead>...</CTableHead>
      <CTableBody>
        {paged.map(item => (
          <CTableRow key={item.id}>
            <CTableDataCell>{item.customer?.name}</CTableDataCell>
            ...
          </CTableRow>
        ))}
      </CTableBody>
    </CTable>
  </CContainer>
)
```

**Current Code (njnewui)**:
```js
// Desktop table (hidden on mobile)
<Box display={{ base: 'none', lg: 'block' }}>
  <TableContainer>
    <Table size="sm">...</Table>
  </TableContainer>
</Box>

// Mobile card list (hidden on desktop) ← NEW
<VStack display={{ base: 'flex', lg: 'none' }} spacing={4}>
  {paged.map((item) => (
    <MobileListCard
      key={item.id}
      minH="280px"
      interactive
      onClick={() => openDetails(item.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          openDetails(item.id)
        }
      }}
    >
      <VStack align="stretch" spacing={4}>
        <Text fontWeight="semibold">{item.customer?.name}</Text>
        <Badge>{item.status}</Badge>
        <Text fontSize="sm">{item.description}</Text>
        <Button>Make Payment</Button>
      </VStack>
    </MobileListCard>
  ))}
</VStack>
```

**Impact**:
- **New**: Touch-optimized card interface for mobile devices
- **Accessibility**: Proper keyboard navigation (Enter/Space keys)
- **Responsive**: Different layouts for `base` (mobile) vs `lg` (desktop)
- **UX**: Better mobile experience with tap targets and vertical layout
- **Risk**: Different HTML structure means different test selectors

---

## PAYMENTS FLOW INCONSISTENCIES

### Inconsistency #8: Payments Flow - Redux to React Query Migration
**Files**:
- master: `frontend/src/pages/payments/PaymentsList.jsx` (734 lines)
- njnewui: `frontend/src/pages/payments/PaymentsList.jsx` (599 lines, refactored)

**Lines**: Complete refactor
**Severity**: **CRITICAL**

**Description**:
PaymentsList completely refactored from Redux dispatch pattern to React Query hooks.

**Legacy Code (master)**:
```js
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPayments,
  fetchPublicPaymentConfig,
  createPayment,
  applyPayment,
} from '../../store/slices/paymentsSlice';

const PaymentsList = () => {
  const dispatch = useDispatch();
  const {
    payments,
    pagination,
    loading,
    error,
    publicPaymentConfig,
  } = useSelector((state) => state.payments);

  useEffect(() => {
    dispatch(
      fetchPayments({
        page,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
    );
  }, [dispatch, page, statusFilter]);

  useEffect(() => {
    dispatch(fetchPublicPaymentConfig()).unwrap();
  }, [dispatch]);

  const handleCreatePayment = async (orderId, gateway) => {
    await dispatch(createPayment({ orderId, gateway })).unwrap();
  };
};
```

**Current Code (njnewui)**:
```js
import { usePayments, useCreatePayment, useApplyPayment } from '../../queries/paymentsQueries'
import { useToast, useDisclosure } from '@chakra-ui/react'

const PaymentsList = () => {
  const toast = useToast()
  const { publicPaymentConfig } = useSelector((state) => state.payments)

  // React Query hooks - no useEffect needed!
  const { data: paymentsData, isLoading: loading, error } = usePayments({
    page,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  })

  const createPaymentMutation = useCreatePayment()

  const handleCreatePayment = async (orderId, gateway) => {
    createPaymentMutation.mutate({ orderId, gateway })
  };
};
```

**Impact**:
- **Breaking**: Redux state management removed for payments fetching
- **New**: Automatic refetching and caching via React Query
- **New**: Toast notifications via Chakra UI instead of SweetAlert patterns
- **Simplified**: No manual useEffect management for data fetching
- **Risk**: Cache invalidation logic differs from Redux state updates

---

## AUTHENTICATION FLOWS INCONSISTENCIES

### Inconsistency #9: Authentication Pages - UI Framework Migration
**Files**:
- master: `frontend/src/pages/auth/LoginPage.jsx` (262 lines)
- njnewui: `frontend/src/pages/auth/LoginPage.jsx` (refactored)
- Similar for: `RequestAccessPage.jsx`, `ForgotPasswordPage.jsx`, `ResetPasswordPage.jsx`, `SignupPage.jsx`

**Severity**: **CRITICAL**

**Description**:
All authentication pages migrated from CoreUI forms to Chakra UI forms.

**Legacy Code (master)**:
```jsx
import { CFormInput, CButton, CFormCheck } from '@coreui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'

<CFormInput
  type="email"
  placeholder="Enter email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

<CButton type="submit" color="primary">
  Login
</CButton>

<FontAwesomeIcon
  icon={showPassword ? faEyeSlash : faEye}
  onClick={() => setShowPassword(!showPassword)}
/>
```

**Current Code (njnewui)**:
```jsx
import { Input, InputGroup, InputRightElement, IconButton, Button, FormControl, FormLabel, useColorModeValue } from '@chakra-ui/react'
import { Eye, EyeOff } from 'lucide-react'

<FormControl>
  <FormLabel htmlFor="email" fontWeight="500">
    {t('auth.email')}
  </FormLabel>
  <Input
    id="email"
    type="email"
    size="lg"
    placeholder={t('auth.emailPlaceholder')}
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    minH="44px"
  />
</FormControl>

<Button
  type="submit"
  colorScheme="brand"
  size="lg"
  width="100%"
  minH="44px"
>
  {t('auth.login')}
</Button>

<InputRightElement width="44px" height="44px">
  <IconButton
    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
    icon={showPassword ? <EyeOff size={ICON_SIZE_MD} /> : <Eye size={ICON_SIZE_MD} />}
    onClick={() => setShowPassword(!showPassword)}
    variant="ghost"
    minW="44px"
    minH="44px"
  />
</InputRightElement>
```

**Impact**:
- **Breaking**: Complete form component API change
- **Accessibility**: Better ARIA labels and semantic HTML
- **Icons**: FontAwesome → Lucide React migration
- **Touch Targets**: Explicit `minH="44px"` for better mobile UX
- **i18n**: More comprehensive translation coverage
- **Risk**: Form validation behavior may differ between frameworks

---

## CUSTOMERS FLOW INCONSISTENCIES

### Inconsistency #10: Customer Pages - Complete Refactor
**Files**:
- `Customers.jsx`: 941 lines changed
- `AddCustomerForm.jsx`: 731 lines changed
- `EditCustomerPage.jsx`: 812 lines changed
- `CustomerForm.jsx`: 533 lines changed
- **Removed**: `Customers_broken.jsx` (719 lines deleted)
- **Removed**: `Customers_fixed.jsx` (470 lines deleted)

**Severity**: **CRITICAL**

**Description**:
Customer management completely refactored. Legacy broken/fixed variants deleted.

**Impact**:
- **Breaking**: All customer CRUD operations use new UI
- **Cleanup**: Removed debug/broken file variants
- **Risk**: Customer form validation logic may differ
- **Testing**: Complete customer workflow testing required

---

## USERS MANAGEMENT INCONSISTENCIES

### Inconsistency #11: User Management Refactoring
**Files**:
- `UserList.jsx`: 655 lines changed
- `CreateUser.jsx`: 753 lines changed
- `EditUser.jsx`: 1,060 lines changed
- `UserGroupList.jsx`: 479 lines changed
- `CreateUserGroup.jsx`: 799 lines changed
- `EditUserGroup.jsx`: 770 lines changed

**Severity**: **HIGH**

**Description**:
All user and user group management pages refactored to Chakra UI.

**Impact**:
- **Breaking**: User creation/editing forms completely different
- **Risk**: Role/permission assignment UI may behave differently
- **Testing**: User management workflows require full regression testing

---

## SETTINGS PAGES INCONSISTENCIES

### Inconsistency #12: Settings Pages - Massive Refactoring
**Files**: 29 settings-related files changed (25,064 insertions, 14,548 deletions)
**Severity**: **CRITICAL**

**Description**:
All settings pages completely refactored. Largest changes in:
- `CatalogMappingTab.jsx`: 10,091 lines changed
- `GlobalModsPage.jsx`: 2,643 lines changed
- `TypesTab.jsx`: 2,367 lines changed
- `LoginCustomizerPage.jsx`: 1,368 lines changed
- `PdfLayoutCustomization.jsx`: 1,333 lines changed
- `StylePicturesTab.jsx`: 1,095 lines changed (currently modified on njnewui)

**Legacy Code (master - example from ManufacturersList)**:
```js
import { CTable, CButton, CBadge } from '@coreui/react'

<CTable hover>
  <CTableBody>
    {manufacturers.map(m => (
      <CTableRow key={m.id}>
        <CTableDataCell>{m.name}</CTableDataCell>
        <CTableDataCell>
          <CButton color="primary" onClick={() => editManufacturer(m.id)}>
            Edit
          </CButton>
        </CTableDataCell>
      </CTableRow>
    ))}
  </CTableBody>
</CTable>
```

**Current Code (njnewui)**:
```js
import { Table, Thead, Tbody, Tr, Td, Button, Badge, useColorModeValue } from '@chakra-ui/react'

const hoverBg = useColorModeValue('gray.50', 'gray.700')

<TableContainer>
  <Table size="sm" variant="simple">
    <Thead>
      <Tr>
        <Th>{t('manufacturers.name')}</Th>
        <Th>{t('common.actions')}</Th>
      </Tr>
    </Thead>
    <Tbody>
      {manufacturers.map(m => (
        <Tr key={m.id} _hover={{ bg: hoverBg }}>
          <Td>{m.name}</Td>
          <Td>
            <Button
              colorScheme="brand"
              size="sm"
              onClick={() => editManufacturer(m.id)}
            >
              {t('common.edit')}
            </Button>
          </Td>
        </Tr>
      ))}
    </Tbody>
  </Table>
</TableContainer>
```

**Impact**:
- **Breaking**: Every settings page uses different UI components
- **New**: Internationalization via react-i18next throughout
- **New**: Dark mode support throughout settings
- **Risk**: Complex forms like CatalogMappingTab may have behavioral differences
- **Testing**: All settings workflows require complete re-testing

---

## PACKAGE DEPENDENCIES INCONSISTENCIES

### Inconsistency #13: Package Dependencies - Major Additions/Removals
**Files**: `frontend/package.json`
**Severity**: **CRITICAL**

**Description**:
Major dependency changes reflecting architectural shift.

**Removed Dependencies (master)**:
```json
{
  "@coreui/chartjs": "^4.1.0",
  "@coreui/coreui": "^5.3.1",
  "@coreui/icons": "^3.0.1",
  "@coreui/icons-react": "^2.3.0",
  "@coreui/react": "^5.5.0",
  "@coreui/react-chartjs": "^3.0.0",
  "@coreui/utils": "^2.0.2",
  "@fortawesome/fontawesome-svg-core": "^6.7.2",
  "@fortawesome/free-solid-svg-icons": "^6.7.2",
  "@fortawesome/react-fontawesome": "^0.2.2",
  "react-icons": "^5.5.0"
}
```

**Added Dependencies (njnewui)**:
```json
{
  "@chakra-ui/react": "^2.10.9",
  "@chakra-ui/theme-tools": "^2.2.9",
  "@emotion/react": "^11.14.0",
  "@emotion/styled": "^11.14.0",
  "@tanstack/react-query": "^5.90.2",
  "react-hook-form": "^7.63.0",
  "i18next-browser-languagedetector": "^8.2.0",
  "framer-motion": "^11.x" // (implied by Chakra UI)
}
```

**Kept Dependencies**:
```json
{
  "lucide-react": "^0.511.0" // Kept, now primary icon library
}
```

**Impact**:
- **Bundle Size**: Significant change (CoreUI + FontAwesome → Chakra + Emotion)
- **Performance**: React Query adds caching layer
- **Forms**: react-hook-form for better form performance
- **i18n**: Browser language detection added
- **Animation**: Framer Motion (via Chakra) replaces CoreUI transitions

---

## BACKEND CONTROLLERS - NO SIGNIFICANT CHANGES ✅

### Inconsistency #14: Controllers Unchanged
**Files**:
- `controllers/ordersController.js`: **IDENTICAL**
- `controllers/customersController.js`: **IDENTICAL**
- `controllers/paymentsController.js`: **IDENTICAL**
- `controllers/authController.js`: **IDENTICAL**
- `controllers/proposalsController.js`: **IDENTICAL** (documented in Part 1)

**Severity**: **LOW - GOOD NEWS**

**Description**:
Backend business logic remains identical between branches. Changes are purely frontend.

**Impact**:
- ✅ **API Compatibility**: Both branches use same backend endpoints
- ✅ **Data Structures**: Same database queries and response formats
- ✅ **Business Logic**: Order creation, payment processing, auth unchanged
- ✅ **Migration**: Frontend refactor doesn't require backend deployment

---

## REDUX SLICES - SUBTLE CHANGES

### Inconsistency #15: Redux Slices - Formatting and Minor Logic
**Files**: Various slice files (19 files changed: 758 insertions, 1,128 deletions)
**Severity**: **MEDIUM**

**Description**:
While major slices were deleted, remaining slices have formatting/structure changes.

**Impact**:
- `ordersSlice.js`: Minimal changes (6 lines)
- `paymentsSlice.js`: 219 lines changed (likely keeping some Redux state for config)
- `authSlice.js`: 104 lines changed
- `customerSlice.js`: 136 lines changed
- Other slices: Formatting and minor logic adjustments

**Risk**:
- Some components may still use Redux for certain state
- Hybrid Redux + React Query architecture
- Need to understand which data flows use which pattern

---

## ICON SIZE CONSTANTS

### Inconsistency #16: Icon Size Constants
**Files**:
- njnewui: `frontend/src/constants/iconSizes.js` (NEW)

**Severity**: **LOW**

**Description**:
njnewui introduces standardized icon sizing constants.

**Current Code (njnewui)**:
```js
// constants/iconSizes.js
export const ICON_SIZE_SM = 16
export const ICON_SIZE_MD = 20
export const ICON_SIZE_LG = 24
export const ICON_SIZE_XL = 32

export const ICON_BOX_SM = '16px'
export const ICON_BOX_MD = '20px'
export const ICON_BOX_LG = '24px'
export const ICON_BOX_XL = '32px'

// Usage:
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'

<Icon as={Search} boxSize={ICON_BOX_MD} />
<CreditCard size={ICON_SIZE_MD} />
```

**Impact**:
- **Consistency**: Standardized icon sizes across application
- **Accessibility**: Ensures touch targets meet minimum size requirements (44px)
- **Maintenance**: Centralized icon sizing configuration

---

## SUMMARY OF KEY RISKS

### **CRITICAL RISKS:**
1. **Complete UI Framework Change**: Every component uses different APIs (CoreUI → Chakra)
2. **State Management Refactor**: Redux slices removed, React Query added
3. **Breaking Changes**: Components using `state.proposal`, `state.contracts`, `state.notification` will break
4. **Different Caching Strategy**: React Query caching may cause different data freshness behavior
5. **Mobile UI**: Completely different mobile layouts may have different interaction patterns

### **HIGH RISKS:**
1. **Form Validation**: Different form libraries may have different validation behavior
2. **Icon Library Change**: FontAwesome/CoreUI icons → Lucide may miss icons
3. **Styling**: CSS class patterns completely different
4. **Event Handling**: Chakra UI events may differ from CoreUI

### **MEDIUM RISKS:**
1. **Dark Mode**: New feature needs testing in both modes
2. **Accessibility**: Different ARIA patterns between frameworks
3. **Bundle Size**: Different dependency footprint
4. **Performance**: React Query adds overhead but improves caching

---

## MIGRATION CHECKLIST

### **For Components Using Deleted Redux Slices:**
- [ ] Find all `useSelector(state => state.proposal)` → Replace with `useProposals()` hook
- [ ] Find all `useSelector(state => state.contracts)` → Replace with `useContracts()` hook
- [ ] Find all `useSelector(state => state.notification)` → Replace with Chakra `useToast()`
- [ ] Find all `dispatch(sendFormDataToBackend(...))` → Replace with mutation hooks
- [ ] Find all `dispatch(getProposal(...))` → Replace with React Query hooks

### **For UI Components:**
- [ ] Replace all CoreUI components with Chakra equivalents
- [ ] Replace FontAwesome icons with Lucide React icons
- [ ] Add dark mode support with `useColorModeValue`
- [ ] Implement mobile-responsive layouts with `display={{ base, lg }}`
- [ ] Update form components to use `react-hook-form` patterns

### **Testing Requirements:**
- [ ] Full regression test of all CRUD operations (customers, users, orders, payments)
- [ ] Test all forms for validation behavior
- [ ] Test mobile responsiveness on real devices
- [ ] Test dark mode throughout application
- [ ] Test React Query cache invalidation scenarios
- [ ] Test authentication flows
- [ ] Test settings pages (especially complex ones like CatalogMapping)
- [ ] Test order status filtering
- [ ] Test enhanced search functionality
- [ ] Test payment creation and management
- [ ] Test user/role management

---

## CONCLUSION

The njnewui branch is **not a simple UI refresh**—it's a **major architectural migration** that touches every user-facing component. The good news is that backend controllers remain unchanged, meaning the data layer is stable. However, the frontend requires complete re-testing and represents a significant departure from the master branch codebase.

**Key Positive Changes:**
✅ Backend logic 100% preserved
✅ Dark mode support added
✅ Mobile-responsive layouts added
✅ Better state management with React Query
✅ Improved search and filtering
✅ Standardized icon sizes and accessibility
✅ Comprehensive internationalization

**Key Risks:**
❌ Complete UI framework change
❌ Redux slices deleted (breaking changes)
❌ Form validation libraries changed
❌ Date format compatibility issues
❌ Customer autocomplete removed (from Part 1)

**Overall Recommendation**: Treat this as a **major version upgrade (v2.0)** with comprehensive testing, staged rollout, and thorough user training.

---

**End of Part 2**

See Part 1 for detailed Proposals flow audit.
