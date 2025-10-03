# LEGACY VS CURRENT FLOW AUDIT - PART 1: PROPOSALS FLOW

**Audit Date**: 2025-10-03
**Branches Compared**: `master` (legacy) vs `njnewui` (current)
**Auditor**: Comprehensive automated analysis

---

## EXECUTIVE SUMMARY

This document details **EVERY** inconsistency found between the legacy application (master branch) and the current application (njnewui branch) for the **Proposals/Quotes flow**. The backend logic is **IDENTICAL** between branches, but the frontend has undergone a **complete UI framework migration** from CoreUI to Chakra UI, along with form library changes from Formik/Yup to React Hook Form.

**Critical Findings**:
- ✅ Backend controllers are byte-for-byte identical (GOOD)
- ❌ Customer autocomplete/selection completely removed (CRITICAL)
- ❌ Designer creation on-the-fly removed (HIGH)
- ❌ Date format changed from MM/dd/yyyy to yyyy-MM-dd (HIGH)
- ❌ Auto-advance on manufacturer selection removed (MEDIUM)
- ✅ Quote acceptance flow preserved (GOOD)
- ✅ Form locking logic preserved (GOOD)

---

## PROPOSALS CREATE FLOW INCONSISTENCIES

### Inconsistency #1: UI Framework Complete Replacement
**Files**:
- master: `frontend/src/pages/proposals/CreateProposal/CustomerInfo.jsx` (602 lines)
- njnewui: `frontend/src/pages/proposals/CreateProposal/CustomerInfo.jsx` (636 lines)

**Lines**: Entire files
**Severity**: **HIGH**

**Description**: The entire UI framework has been replaced from CoreUI/Bootstrap to Chakra UI, affecting all form components and validation libraries.

**Legacy Code** (master):
```jsx
// Uses CoreUI components
import { CCard, CCardBody, CForm, CFormLabel, CFormInput, CFormCheck, CButton, CRow, CCol } from '@coreui/react'
import { Formik } from 'formik'
import * as Yup from 'yup'
import CreatableSelect from 'react-select/creatable'
import DatePicker from 'react-datepicker'
import Swal from 'sweetalert2'

// Validation schema
const validationSchema = Yup.object().shape({
  customerName: Yup.string().required(t('proposals.create.customerInfo.validation.customerName')),
  description: Yup.string().required(t('proposals.create.customerInfo.validation.description')),
  designer: Yup.string().required(t('proposals.create.customerInfo.validation.designer')),
});

<Formik
  initialValues={formData}
  enableReinitialize
  validationSchema={validationSchema}
  onSubmit={handleSubmit}
>
  {({ values, errors, touched, handleChange, handleBlur, handleSubmit }) => (
    <CForm onSubmit={handleSubmit}>
      {/* form fields */}
    </CForm>
  )}
</Formik>
```

**Current Code** (njnewui):
```jsx
// Uses Chakra UI components
import { Box, Button, CardBody, Checkbox, Collapse, Divider, Flex, FormControl, FormErrorMessage, FormLabel, HStack, Heading, Icon, Input, Select, SimpleGrid, Stack, Text, Textarea, useToast, useColorModeValue } from '@chakra-ui/react'
import { useForm, Controller } from 'react-hook-form'
import { motion, useReducedMotion } from 'framer-motion'

// React Hook Form setup
const {
  control,
  register,
  handleSubmit: handleFormSubmit,
  setValue,
  watch,
  reset,
  formState: { errors },
} = useForm({
  mode: 'onBlur',
  defaultValues,
  shouldUnregister: false,
})

<Box as="form" onSubmit={handleFormSubmit(onSubmit)}>
  {/* form fields with register() */}
</Box>
```

**Impact**:
- All form validation switched from Formik/Yup to React Hook Form
- Date inputs changed from react-datepicker to native HTML5 date inputs
- Customer selection changed from CreatableSelect to plain Chakra Input
- Alert system changed from SweetAlert2 to Chakra useToast
- Responsive behavior and styling completely different
- Icons changed from React Icons to Lucide React

---

### Inconsistency #2: Customer Creation/Selection Logic **[CRITICAL]**
**Files**: CustomerInfo.jsx (both branches)
**Lines**: master:210-275 vs njnewui:183-233, 314-328
**Severity**: **CRITICAL**

**Description**: Customer creation UI and workflow fundamentally changed. Master used CreatableSelect dropdown with auto-complete, njnewui uses plain text input.

**Legacy Code** (master - lines 210-275):
```jsx
<FormLabel htmlFor="customerName">
  {t('proposals.create.customerInfo.customerName')} *
</FormLabel>
<CreatableSelect
  isClearable
  options={customerOptions}  // ← Shows existing customers
  value={
    customerOptions.find((opt) => opt.value === values.customerName) ||
    (values.customerName
      ? { label: values.customerName, value: values.customerName }
      : null)
  }
  onChange={(selectedOption) => {
    const name = selectedOption?.value || '';
    const email = selectedOption?.data?.email || '';
    const customerId = selectedOption?.data?.id || '';
    updateFormData({
      ...formData,
      customerName: name,
      customerEmail: email,
      customerId: customerId
    });
    setFieldValue('customerName', name);
    setFieldValue('customerEmail', email);
    setFieldValue('customerId', customerId);
  }}
  onCreateOption={async (inputValue) => {
    // CREATE NEW CUSTOMER ON-THE-FLY
    const name = String(inputValue || '').trim();
    if (!name) return;
    try {
      setIsCreatingCustomer(true);
      const payload = {
        name,
        email: values.customerEmail || '',
        ...(isContractor && contractorGroupId ? { group_id: contractorGroupId } : {}),
      };
      const res = await axiosInstance.post('/api/customers/add', payload);
      const created = res?.data?.customer || res?.data;
      const newId = created?.id || '';
      // Update form and local options
      const option = { label: created?.name || name, value: created?.name || name, data: created };
      setCustomerOptions((prev) => [option, ...prev.filter((o) => o.value !== option.value)]);
      updateFormData({
        ...formData,
        customerName: created?.name || name,
        customerEmail: created?.email || values.customerEmail || '',
        customerId: newId,
      });
      setFieldValue('customerName', created?.name || name);
      setFieldValue('customerEmail', created?.email || values.customerEmail || '');
      setFieldValue('customerId', newId);
      Swal.fire('Customer Created', `"${created?.name || name}" was added.`, 'success');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create customer';
      Swal.fire('Error', msg, 'error');
    } finally {
      setIsCreatingCustomer(false);
    }
  }}
  onBlur={handleBlur}
  inputId="customerName"
  placeholder={t('proposals.create.customerInfo.customerNamePlaceholder')}
  isLoading={loading || isCreatingCustomer}
/>
```

**Current Code** (njnewui - lines 314-328):
```jsx
<FormLabel htmlFor="customerName">
  {t('proposals.create.customerInfo.customerName')} *
</FormLabel>
<Input
  id="customerName"
  placeholder={t('proposals.create.customerInfo.customerNamePlaceholder')}
  {...register('customerName', {
    required: t('form.validation.required', 'This field is required'),
    onChange: (event) => {
      updateFormData({ customerName: event.target.value })
    },
  })}
/>
{/* NO customer selection dropdown */}
{/* NO auto-complete */}
{/* handleCreateCustomer function exists (lines 183-233) but NOT integrated into UI */}
```

**Impact**:
- **CRITICAL**: Customer auto-complete functionality completely removed in njnewui
- **CRITICAL**: Ability to select existing customers from dropdown LOST
- **CRITICAL**: Customer creation from proposal flow uses different `handleCreateCustomer` function (lines 183-233 in njnewui) but is NOT integrated into UI - manual button only
- Users can no longer see/select existing customers during proposal creation
- No visual indication if customer already exists
- **HIGH RISK**: Duplicate customers will be created
- **UX REGRESSION**: Users must manually type exact customer name, no autocomplete assistance

**Recommendation**: **RESTORE** customer autocomplete with Chakra UI equivalent (e.g., Chakra AutoComplete or Downshift integration)

---

### Inconsistency #3: Designer Field Management
**Files**: CustomerInfo.jsx (both branches)
**Lines**: master:299-337 vs njnewui:354-377
**Severity**: **MEDIUM**

**Description**: Designer selection changed from CreatableSelect (with ability to create new designers) to plain Select dropdown.

**Legacy Code** (master):
```jsx
<CreatableSelect
  isClearable
  isLoading={isCreatingDesigner}
  isDisabled={isCreatingDesigner}
  id="designer"
  name="designer"
  options={designerOptions}
  value={
    designerOptions.find(
      (opt) => opt.value === values.designer
    ) || null
  }
  onChange={(selectedOption) => {
    const designerId = selectedOption?.value || '';
    setFieldValue('designer', designerId);
    updateFormData({ designer: designerId });
  }}
  onCreateOption={async (inputValue) => {
    // CREATE NEW DESIGNER ON-THE-FLY
    const newDesigner = await createNewDesigner(inputValue);
    if (newDesigner) {
      setFieldValue('designer', newDesigner.id);
      updateFormData({ designer: newDesigner.id });
    }
  }}
  onBlur={handleBlur}
  placeholder={isCreatingDesigner ? "Creating designer..." : "Select or create a designer..."}
  formatCreateLabel={(inputValue) => `Create designer: "${inputValue}"`}
/>
```

**Current Code** (njnewui):
```jsx
<Select
  id="designer"
  placeholder={t('proposals.create.customerInfo.designerPlaceholder', 'Select a designer')}
  {...register('designer', {
    required: t('form.validation.required', 'This field is required'),
    onChange: (event) => {
      updateFormData({ designer: event.target.value })
    },
  })}
>
  {designerOptions.map((option) => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ))}
</Select>
{/* NO ability to create new designer from dropdown */}
{/* createNewDesigner function exists (lines 235-277) but NOT called */}
```

**Impact**:
- Ability to create new designers on-the-fly REMOVED in njnewui
- `createNewDesigner` function exists in njnewui (lines 235-277) but is never called
- Admins must pre-create all designers before proposals can be made
- **Workflow interruption**: Must leave proposal creation, create designer separately, then return
- Less flexible workflow

**Recommendation**: Re-enable designer creation with Chakra UI modal or inline form

---

### Inconsistency #4: Date Field Handling **[DATA FORMAT RISK]**
**Files**: CustomerInfo.jsx (both branches)
**Lines**: master:380-455 vs njnewui:419-503
**Severity**: **MEDIUM - HIGH RISK**

**Description**: Date inputs completely changed from react-datepicker to native HTML5 date inputs with different date format handling.

**Legacy Code** (master):
```jsx
<DatePicker
  id="measurementDate"
  selected={values.measurementDate ? new Date(values.measurementDate) : null}
  onChange={(date) => {
    setFieldValue('measurementDate', date);
    // Defer syncing to parent until submit to avoid reinitialize loops
  }}
  className="form-control"
  dateFormat="MM/dd/yyyy"  // ← US FORMAT
  placeholderText={
    values.measurementDone ? t('proposals.create.customerInfo.measurementDoneDate') : t('proposals.create.customerInfo.measurementScheduledDate')
  }
  wrapperClassName="w-100"
/>
<FaCalendarAlt
  style={{
    position: 'absolute',
    top: '50%',
    right: '12px',
    transform: 'translateY(-50%)',
    color: '#6c757d',
    pointerEvents: 'none',
  }}
/>
```

**Current Code** (njnewui):
```jsx
<Input
  id="measurementDate"
  type="date"  // ← NATIVE HTML5
  value={field.value ? field.value.substring(0, 10) : ''}  // ← ISO FORMAT yyyy-MM-dd
  onChange={(event) => {
    const value = event.target.value
    field.onChange(value)
    updateFormData({ measurementDate: value })
  }}
/>
{/* NO calendar icon */}
{/* NO custom date picker UI */}
```

**Impact**:
- **Date format changed** from MM/dd/yyyy (US format) to yyyy-MM-dd (ISO format)
- No calendar icon/visual indicator in njnewui
- Browser-native date picker behavior (varies by browser)
- **DATA COMPATIBILITY RISK**: When editing old proposals created in master branch, date format conversion may cause issues
- **UX**: Native date picker may be confusing for users expecting calendar widget

**Recommendation**:
- Add date format converter for backward compatibility
- Test editing old proposals with legacy date formats
- Consider adding calendar icon for visual consistency

---

### Inconsistency #5: Additional Fields (More Options Section)
**Files**: CustomerInfo.jsx (both branches)
**Lines**: master:470-582 vs njnewui:506-612
**Severity**: **MEDIUM**

**Description**: Additional optional fields (location, salesRep, leadSource, type) changed from CreatableSelect to plain Select dropdowns.

**Legacy Code** (master - using CreatableSelect for all fields):
```jsx
<CreatableSelect
  isClearable
  options={locationOptions}
  value={
    locationOptions.find(
      (opt) => opt.value === values.location
    ) ||
    (values.location
      ? {
          label: values.location,
          value: values.location,
        }
      : null)
  }
  onChange={(selectedOption) => {
    const value = selectedOption?.value || '';
    setFieldValue('location', value);
    updateFormData({
      ...formData,
      location: value,
    });
  }}
  onBlur={handleBlur}
  inputId="location"
/>
```

**Current Code** (njnewui - using plain Select):
```jsx
<Select
  id="location"
  placeholder={t('proposals.create.customerInfo.locationPlaceholder', 'Select a location')}
  {...register('location', {
    onChange: (event) => {
      updateFormData({ location: event.target.value })
    },
  })}
>
  {locationOptions.map((option) => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ))}
</Select>
```

**Impact**:
- Users can no longer create custom values for location, salesRep, leadSource, or type fields
- Must use predefined options only
- Less flexibility in data entry
- **Workflow**: Requires admin to pre-configure all possible values

**Recommendation**: Document that these fields must be pre-configured, OR restore CreatableSelect functionality

---

## PROPOSALS CREATE FLOW - MANUFACTURER SELECT STEP

### Inconsistency #6: Manufacturer Selection Auto-Navigation **[UX CHANGE]**
**Files**: ManufacturerSelect.jsx (both branches)
**Lines**: master:68-96 vs njnewui:88-114
**Severity**: **HIGH**

**Description**: Master branch auto-advances to next step immediately upon manufacturer selection, while njnewui requires explicit Next button click.

**Legacy Code** (master):
```jsx
const handleManufacturerSelect = useCallback((manufacturer, setFieldValue) => {
  setSelectedManufacturer(manufacturer);

  // Prefer existing versionName; otherwise default to the manufacturer name
  const versionName = (formData.versionName && formData.versionName.trim())
    ? formData.versionName
    : (manufacturer.name || '');

  // Keep Formik fields in sync so validation/UI stays consistent
  setFieldValue('manufacturer', manufacturer.id);
  setFieldValue('versionName', versionName);

  // Persist selection in our proposal form data and prepare manufacturersData entry
  const newEntry = {
    manufacturer: manufacturer.id,
    versionName: versionName || '',
  };

  updateFormData({
    ...formData,
    manufacturer: manufacturer.id,
    manufacturerId: manufacturer.id,
    versionName,
    manufacturersData: [newEntry],
  });

  // Immediately advance to Step 3 ← AUTO-ADVANCE
  nextStep();
}, [formData, updateFormData, nextStep]);
```

**Current Code** (njnewui):
```jsx
const handleManufacturerSelect = useCallback(
  (manufacturer) => {
    const manufacturerId = String(manufacturer.id)
    setValue('manufacturer', manufacturerId, { shouldValidate: true })

    const versionName =
      getValues('versionName')?.trim() || manufacturer.name || ''

    if (isUserAdmin) {
      setValue('versionName', versionName, { shouldValidate: true })
    }

    updateFormData({
      ...formData,
      manufacturer: manufacturer.id,
      manufacturerId: manufacturer.id,
      versionName,
      manufacturersData: [
        {
          manufacturer: manufacturer.id,
          versionName,
        },
      ],
    })
    // NOTE: Does NOT call nextStep() here - requires explicit submit ← NO AUTO-ADVANCE
  },
  [formData, isUserAdmin, getValues, setValue, updateFormData],
)
```

**Impact**:
- **User Experience**: Master provided faster workflow (one click), njnewui requires two clicks (select + Next button)
- njnewui adds extra step that may confuse users expecting auto-advance
- Version name field gets filled but user must still click Next
- **Workflow speed**: Slower in njnewui

**Recommendation**:
- Consider adding auto-advance option OR
- Clearly document the workflow change for user training

---

### Inconsistency #7: Manufacturer Card Display & Image Loading
**Files**: ManufacturerSelect.jsx (both branches)
**Lines**: master:98-243 vs njnewui:276-330
**Severity**: **LOW**

**Description**: Image loading and manufacturer card rendering completely refactored with different error handling.

**Legacy Code** (master - uses memo-ized component with detailed image error handling):
```jsx
const ManufacturerCard = React.memo(({ manufacturer, isSelected, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(true);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);

  // Determine image source - avoid re-renders by computing once
  const imageSrc = useMemo(() => {
    if (!manufacturer.image || imageError) {
      return '/images/nologo.png';
    }
    return `${api_url}/uploads/images/${manufacturer.image}`;
  }, [manufacturer.image, imageError, api_url]);

  // ... detailed card with motion effects, ETA information
});
```

**Current Code** (njnewui - state-based image management):
```jsx
const getImageSrc = useCallback(
  (manufacturer) => {
    const status = cardImageState[manufacturer.id]
    if (!manufacturer.image || status === 'fallback') {
      return FALLBACK_MANUFACTURER_IMAGE
    }
    const img = String(manufacturer.image || '').trim()
    // If absolute URL, data URI, or already /uploads based, use resolver to add token when needed
    if (/^(data:|https?:\/\/|\/)/i.test(img)) {
      // Prefer resolveAssetUrl which will append token for uploads
      return resolveAssetUrl(img, apiUrl)
    }
    // Bare filename (e.g., precision.png) → assume uploads/images
    return buildUploadUrl(`/uploads/images/${img}`)
  },
  [apiUrl, cardImageState],
)

// Uses MotionBox with different image rendering
<img
  src={getImageSrc(manufacturer)}
  alt={manufacturer.name}
  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
  onLoad={() => handleImageLoaded(manufacturer.id)}
  onError={(event) => {
    if (cardImageState[manufacturer.id] === 'fallback') {
      event.currentTarget.onerror = null
      return
    }
    handleImageError(manufacturer.id)
    event.currentTarget.src = FALLBACK_MANUFACTURER_IMAGE
  }}
/>
```

**Impact**:
- Different image URL resolution logic (master uses simple concatenation, njnewui uses utility functions)
- njnewui adds **authentication token support** for images
- **ETA information display removed** from njnewui cards
- Visual appearance significantly different (master shows ETA days, njnewui does not)

---

## PROPOSALS CREATE FLOW - PROPOSAL SUMMARY STEP

### Inconsistency #8: Form Library & Validation
**Files**: ProposalSummary.jsx (both branches)
**Lines**: master:36-40, 283-298 vs njnewui:106-130
**Severity**: **MEDIUM**

**Description**: Form management completely changed from Formik to React Hook Form with different validation approach.

**Legacy Code** (master):
```jsx
const validationSchema = Yup.object().shape({
  customerName: Yup.string().required(t('proposals.create.customerInfo.validation.customerName')),
  description: Yup.string().required(t('proposals.create.customerInfo.validation.description')),
  designer: Yup.string().required(t('proposals.create.customerInfo.validation.designer')),
});

<Formik
  initialValues={formData}
  enableReinitialize
  validationSchema={validationSchema}
  onSubmit={handleSubmit}
>
  {({
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
  }) => (
    <CForm onSubmit={handleSubmit} className="proposal-summary-form">
      {/* form fields */}
    </CForm>
  )}
</Formik>
```

**Current Code** (njnewui):
```jsx
const defaultValues = useMemo(
  () => ({
    designer: formData.designer || '',
    description: formData.description || '',
    status: formData.status || 'Draft',
    date: formData.date || '',
    designDate: formData.designDate || '',
    measurementDate: formData.measurementDate || '',
  }),
  [formData],
)

const {
  control,
  register,
  handleSubmit: handleFormSubmit,
  setValue,
  watch,
  reset,
  formState: { errors },
} = useForm({
  mode: 'onBlur',  // ← Validation timing different
  defaultValues,
  shouldUnregister: false,
})
```

**Impact**:
- Form state management completely different
- **Validation timing differs** (onBlur vs onSubmit in Formik)
- Error message display logic changed
- Field re-rendering behavior may differ

---

### Inconsistency #9: Accept Quote Flow
**Files**: ProposalSummary.jsx (both branches)
**Lines**: master:111-200 vs njnewui:174-294
**Severity**: **CRITICAL - BUT PRESERVED**

**Description**: Quote acceptance flow uses different confirmation dialogs and error handling mechanisms, but the business logic is preserved.

**Legacy Code** (master):
```jsx
const handleAcceptOrder = async () => {
  if (isSubmitting) return;

  try {
    // Validation first
    if (selectedVersion?.items && selectedVersion.items.length > 0 && formData.manufacturerId) {
      const validation = await validateProposalSubTypeRequirements(
        selectedVersion.items,
        formData.manufacturerId
      );

      if (!validation.isValid) {
        if (import.meta?.env?.DEV) console.warn('Sub-type validation failed:', validation.missingRequirements);
        await showSubTypeValidationError(validation.missingRequirements, Swal);
        return;
      }
    }

    const result = await Swal.fire({
      title: t('proposals.confirm.submitTitle', 'Confirm Quote Submission'),
      html: `...`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('proposals.confirm.submitConfirm', 'Accept and Submit'),
      cancelButtonText: t('proposals.confirm.goBack', 'Go Back'),
      reverseButtons: true,
      focusCancel: true,
    });

    if (result.isConfirmed) {
      setIsSubmitting(true);

      // Step 1: Create proposal as draft
      const createPayload = {
        action: '0',
        formData: { ...formData, type: '0' },
      };
      const createResponse = await dispatch(sendFormDataToBackend(createPayload));

      // Step 2: Accept it
      const acceptResponse = await axiosInstance.post(`/api/proposals/${newProposalId}/accept`, {});

      if (acceptResponse.data.success) {
        Swal.fire(t('common.success','Success'), t('proposals.success.acceptConverted','Quote accepted and converted to order!'), 'success');
        navigate('/orders');
      }
    }
  } catch (_) {
    setIsSubmitting(false);
  }
};
```

**Current Code** (njnewui):
```jsx
const handleAcceptOrder = async () => {
  if (isSubmitting) return

  try {
    // Validation first (same)
    if (selectedVersion?.items && selectedVersion.items.length > 0 && formData.manufacturerId) {
      const validation = await validateProposalSubTypeRequirements(
        selectedVersion.items,
        formData.manufacturerId,
      )

      if (!validation.isValid) {
        // ... shows toast error instead of Swal
        toast({
          title: t('proposals.errors.cannotAccept', 'Cannot accept quote'),
          description: t('proposals.errors.missingRequirements', 'Missing required selections') + ': ' + itemsText,
          status: 'warning',
          duration: 8000,
          isClosable: true,
          position: 'top',
        })
        return
      }
    }

    // Opens AlertDialog instead of Swal
    setIsAcceptDialogOpen(true)  // ← Different UI
  } catch (_) {
    setIsSubmitting(false)
  }
}

const confirmAcceptOrder = async () => {
  setIsAcceptDialogOpen(false)
  setIsSubmitting(true)

  try {
    // Same two-step process
    const createPayload = { action: '0', formData: { ...formData, type: '0' } }
    const createResponse = await dispatch(sendFormDataToBackend(createPayload))

    const acceptResponse = await axiosInstance.post(`/api/proposals/${newProposalId}/accept`, {})

    if (acceptResponse.data.success) {
      toast({ /* success message */ })
      navigate('/orders')
    }
  } catch (error) {
    // Enhanced error handling with sub-type validation check
    if (error.response?.status === 400 && error.response?.data?.missingRequirements) {
      // Shows specific validation errors in toast
    } else {
      toast({ /* generic error */ })
    }
    setIsSubmitting(false)
  }
}
```

**Impact**:
- ✅ **Business Logic Preserved**: Two-step create+accept workflow identical
- ✅ **Validation Logic Preserved**: Sub-type requirement validation maintained
- ❌ **UI Changed**: Confirmation dialog changed from SweetAlert2 to Chakra AlertDialog
- ❌ **Error Display**: Changed from Swal.fire to useToast
- ✅ **Good**: Error handling actually improved in njnewui with specific sub-type validation feedback
- Visual consistency: njnewui matches Chakra theme, master uses SweetAlert theme

---

### Inconsistency #10: Date Input Fields in Summary
**Files**: ProposalSummary.jsx (both branches)
**Lines**: master:365-430 vs njnewui:458-499
**Severity**: **MEDIUM**

**Description**: Date fields switched from react-datepicker to native HTML5 date inputs (same as in CustomerInfo step).

**Impact**: Same as Inconsistency #4 - date format compatibility risk when editing legacy proposals.

---

### Inconsistency #11: Designer/Status Selection UI
**Files**: ProposalSummary.jsx (both branches)
**Lines**: master:302-363 vs njnewui:381-456
**Severity**: **MEDIUM**

**Description**: Designer and status fields changed from CreatableSelect to plain Chakra Select/Controller.

**Impact**: Same as Inconsistency #3 and #5 - lost ability to create custom values on the fly.

---

## PROPOSALS EDIT FLOW INCONSISTENCIES

### Inconsistency #12: Form Disabled State Logic **[PRESERVED ✅]**
**Files**: EditProposal.jsx (both branches)
**Lines**: master:119-132 vs njnewui:99-111
**Severity**: **NONE - IDENTICAL**

**Description**: Both branches have identical logic for determining if form should be disabled. This is a critical business rule worth documenting.

**Code** (identical in both):
```jsx
const [formData, setFormData] = useState(defaultFormData);
// Determine if form should be disabled (locked quote OR contractor viewing accepted quote)
const isAccepted = formData?.status === 'Proposal accepted' || formData?.status === 'accepted';
const isFormDisabled = !!formData?.is_locked || (isAccepted && !isAdmin);

console.log('🔍 EditProposal Debug:', {
  'formData.is_locked': formData?.is_locked,
  'formData.status': formData?.status,
  'userRole': userInfo?.role,
  'isAdmin': isAdmin,
  'isFormDisabled': isFormDisabled,
  'proposal_id': formData?.id
});
```

**Impact**:
- ✅ **GOOD**: Both branches implement same locking logic
- ✅ **GOOD**: Contractors cannot edit accepted quotes
- ✅ **GOOD**: Admins can always edit (unless explicitly locked)
- `is_locked` field must be properly managed by backend

---

### Inconsistency #13: UI Framework in Edit Form
**Files**: EditProposal.jsx (both branches)
**Lines**: Entire files
**Severity**: **HIGH**

**Description**: Same UI framework migration as create flow (CoreUI → Chakra).

**Impact**: Same as Inconsistency #1 - complete UI replacement with all associated changes.

---

### Inconsistency #14: Validation Schema Removed
**Files**: EditProposal.jsx (both branches)
**Lines**: master:52-56 vs njnewui:29 (comment noting removal)
**Severity**: **MEDIUM**

**Description**: Yup validation schema removed in njnewui.

**Legacy Code** (master):
```jsx
const validationSchema = Yup.object().shape({
  //   customerName: Yup.string().required('Customer name is required'),
  description: Yup.string().required('Description is required'),
  designer: Yup.string().required('Designer is required'),
});
```

**Current Code** (njnewui):
```jsx
// Removed Formik and Yup - using React Hook Form pattern
// No explicit validation schema defined - using inline validation rules
```

**Impact**:
- Validation now handled inline via React Hook Form `rules` prop
- Master had commented-out customerName validation
- Less centralized validation logic in njnewui

---

## BACKEND CONTROLLER INCONSISTENCIES

### Inconsistency #15: Backend Controllers Are IDENTICAL ✅✅✅
**Files**: proposalsController.js (both branches)
**Lines**: All lines (2219 lines total)
**Severity**: **NONE - EXCELLENT NEWS**

**Description**: The backend controllers in master and njnewui are **byte-for-byte identical**. This is excellent as it means all business logic remains consistent.

**Evidence**:
Both files have:
- Same `saveProposal` function (lines 142-358)
- Same `getProposal` function (lines 360-474)
- Same `deleteProposals` function (lines 476-500+)
- Same `validateStatusTransition` helper (lines 65-140)
- Same `normalizeManufacturersDataForStorage` helper (lines 20-62)
- Same contractor scoping logic
- Same proposal number generation
- Same accept/reject workflow

**Impact**:
- ✅ **EXCELLENT**: No backend logic discrepancies
- ✅ All API responses will be identical
- ✅ Data structures remain consistent
- ✅ Migration should be smooth for data layer
- ✅ No database schema changes required
- ✅ No API endpoint changes

---

## CRITICAL FINDINGS SUMMARY

### HIGH-PRIORITY ISSUES ❌

1. **Customer Selection UX Completely Changed** (Inconsistency #2)
   - Master: Dropdown with autocomplete + create
   - NJNewUI: Plain text input only
   - **RISK**: Users will create duplicate customers, cannot find existing customers

2. **UI Framework Replacement** (Inconsistencies #1, #8, #13)
   - Affects ALL components
   - Different validation libraries (Formik/Yup → React Hook Form)
   - Different alert/notification systems (SweetAlert2 → Chakra useToast)
   - **RISK**: User confusion, different behavior in edge cases

3. **Date Field Format Changes** (Inconsistencies #4, #10)
   - Master: MM/dd/yyyy (US format via react-datepicker)
   - NJNewUI: yyyy-MM-dd (ISO format via HTML5)
   - **RISK**: Data format incompatibilities when editing old proposals

4. **Auto-Advance Removed** (Inconsistency #6)
   - Master: Manufacturer selection auto-advances to next step
   - NJNewUI: Requires explicit Next button click
   - **RISK**: User confusion, perceived as slower workflow

5. **Designer/Field Creation Removed** (Inconsistencies #3, #5, #11)
   - Master: Can create designers, locations, lead sources on-the-fly
   - NJNewUI: Must use predefined values only
   - **RISK**: Workflow interruption, requires admin pre-work

### POSITIVE FINDINGS ✅

1. **Backend Logic Identical** (Inconsistency #15)
   - All business rules preserved
   - Data consistency maintained
   - No API changes needed

2. **Form Disabled Logic Preserved** (Inconsistency #12)
   - Locking behavior works same way
   - Permissions respected

3. **Accept Quote Flow Preserved** (Inconsistency #9)
   - Two-step create+accept workflow identical
   - Validation logic maintained
   - Only UI changed (Swal → Chakra AlertDialog)

---

## RECOMMENDATIONS

### IMMEDIATE ACTIONS REQUIRED

1. **Restore Customer Autocomplete** ⚠️ CRITICAL
   - Implement Chakra-based autocomplete for customer selection
   - Re-integrate `handleCreateCustomer` function into UI
   - Add ability to select existing customers from dropdown

2. **Restore Designer Creation** ⚠️ HIGH
   - Re-enable `createNewDesigner` function in CustomerInfo
   - Consider Chakra Combo Box or AutoComplete component

3. **Add Date Format Migration** ⚠️ HIGH
   - Implement date format converter for legacy data
   - Ensure backward compatibility when editing old proposals

4. **Consider Auto-Advance Option** ⚠️ MEDIUM
   - Add configuration to restore auto-advance behavior on manufacturer select
   - OR document the change for user training

5. **Add CreatableSelect Equivalent** ⚠️ MEDIUM
   - Implement Chakra-based creatable select for location, salesRep, leadSource, type fields
   - OR document that these must be pre-configured

### TESTING PRIORITIES

1. ☑️ Test creating proposal with existing customer (verify customer selection works)
2. ☑️ Test creating proposal with new customer (verify customer creation)
3. ☑️ Test date fields with old proposals (verify format compatibility)
4. ☑️ Test locked proposal editing (verify permissions)
5. ☑️ Test accept quote flow end-to-end
6. ☑️ Test manufacturer selection workflow
7. ☑️ Test all form validations
8. ☑️ Test responsive design on mobile devices

---

## CONCLUSION

The proposals flow in njnewui represents a **major UI refactoring** with **preserved backend logic**. The good news is that all business rules, data structures, and API contracts remain unchanged. However, several UX features have been removed (customer autocomplete, designer creation, auto-advance) that may impact user productivity. These should be restored or documented as intentional changes.

**Migration Risk Level**: **HIGH** (frontend) / **LOW** (backend)
**Testing Required**: **COMPREHENSIVE** (all user workflows)
**Backward Compatibility**: **MEDIUM RISK** (date formats, form validation)

---

**End of Part 1**

Continue to Part 2 for Orders, Customers, Users, Payments, Auth, and Settings flows.
