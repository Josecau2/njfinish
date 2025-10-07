# Designer Field Audit - Legacy vs Current Implementation

**Date:** January 7, 2025
**Purpose:** Compare designer field functionality between legacy (master branch) and current (njnewui branch) applications

---

## Executive Summary

The designer field implementation has **significant differences** between legacy and current applications. The legacy app uses a **simpler dropdown approach with CreatableSelect**, while the current app has **more complex custom input logic** that may not align with the original requirements.

**Key Finding:** The current implementation may have **overcomplicated** the designer field with custom input states that weren't in the legacy app.

---

## Backend Analysis

### API Endpoint: `/api/designers`

**Route Definition:**
- File: `routes/apiRoutes.js` line 446
- Route: `router.get('/designers', userGroupController.getDesingers);`
- Note: Typo in function name "Desingers" (should be "Designers")

**Controller Implementation:**
```javascript
// controllers/userGroupController.js line 272
exports.getDesingers = async (req, res) => {
  try {
      const users = await User.findAll();
      return res.status(200).json({ message: 'Fetch User', users });
  } catch (error) {
     res.status(500).json({ message: 'Server error' });
  }
}
```

**Backend Behavior:**
- ✅ Returns **ALL users** from database (no filtering by role)
- ✅ Returns as `{ message: 'Fetch User', users: [...] }`
- ✅ No permission checks on endpoint
- ❌ No role-based filtering (despite frontend expecting only "Manufacturers" role)

---

## Database Model

### Proposals Table - Designer Column

**Model Definition:** `models/Proposals.js`
```javascript
designer: {
    type: DataTypes.INTEGER,  // Foreign key to User.id
    allowNull: true,
}
```

**Association:** `models/index.js` line 114
```javascript
Proposals.belongsTo(User, { foreignKey: 'designer', as: 'designerData' });
```

**Key Points:**
- ✅ Designer field stores **User ID** (INTEGER)
- ✅ Association allows fetching designer data with `include: [{ model: User, as: 'designerData' }]`
- ✅ Field is nullable (optional)

---

## Legacy Implementation (Master Branch)

### EditProposal.jsx - Legacy Approach

**Designer Field Logic:**
```javascript
// Fetch designers on mount
useEffect(() => {
  const fetchDesigners = async () => {
    try {
      const response = await axiosInstance.get('/api/designers');
      const designerData = response.data.users.map((designer) => ({
        value: designer.id,        // User ID
        label: designer.name,      // User name
      }));
      setDesignerOptions(designerData);
    } catch (error) {
      console.error('Error fetching designers:', error);
    }
  };
  fetchDesigners();
}, []);
```

**Rendering:**
```jsx
<CreatableSelect
  isClearable
  id="designer"
  name="designer"
  options={designerOptions}
  value={designerOptions.find((opt) => opt.value === values.designer) || null}
  onChange={(selectedOption) => {
    updateFormData({ designer: selectedOption?.value || '' });
  }}
  onBlur={handleBlur}
/>
```

**Validation:**
```javascript
designer: Yup.string().required('Designer is required')
```

**Legacy Behavior:**
1. ✅ Fetches all users on component mount
2. ✅ Maps users to `{ value: id, label: name }` options
3. ✅ Uses **react-select CreatableSelect** (allows creating new options)
4. ✅ Stores **user ID** when existing designer selected
5. ✅ Allows **custom text** when new designer created
6. ✅ Simple validation: required field
7. ✅ Clear button available (isClearable)

---

## Current Implementation (njnewui Branch)

### EditProposal.jsx - Current Approach

**State Management:**
```javascript
const [designerOptions, setDesignerOptions] = useState([])
const [isCreatingDesigner, setIsCreatingDesigner] = useState(false)
const [customDesignerInput, setCustomDesignerInput] = useState('')
```

**Fetching Logic (Same as Legacy):**
```javascript
useEffect(() => {
  const fetchDesigners = async () => {
    try {
      const response = await axiosInstance.get('/api/designers')
      const designerData = response.data.users.map((designer) => ({
        value: designer.id,
        label: designer.name,
      }))
      setDesignerOptions(designerData)
    } catch (error) {
      console.error('Error fetching designers:', error)
    }
  }
  fetchDesigners()
}, [])
```

**Rendering (Two Different UI States):**

**State 1: Normal Dropdown (Chakra Select)**
```jsx
<Select
  id="designer"
  name="designer"
  value={formData.designer || ''}
  onChange={(e) => updateFormData({ designer: e.target.value })}
  placeholder={t('common.selectDesigner', 'Select designer')}
  isDisabled={isFormDisabled}
>
  {designerOptions.map((option) => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ))}
</Select>
```

**State 2: Custom Input Mode**
```jsx
{isCreatingDesigner ? (
  <HStack>
    <Input
      autoFocus
      value={customDesignerInput}
      onChange={(e) => setCustomDesignerInput(e.target.value)}
      placeholder={t('common.enterDesignerName', 'Enter designer name')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && customDesignerInput.trim()) {
          updateFormData({ designer: customDesignerInput.trim() })
          setIsCreatingDesigner(false)
          setCustomDesignerInput('')
        } else if (e.key === 'Escape') {
          setIsCreatingDesigner(false)
          setCustomDesignerInput('')
        }
      }}
      isDisabled={isFormDisabled}
    />
    <Button size="sm" onClick={/* save custom designer */}>
      {t('common.add', 'Add')}
    </Button>
    <Button size="sm" variant="ghost" onClick={/* cancel */}>
      {t('common.cancel', 'Cancel')}
    </Button>
  </HStack>
) : (
  {/* Normal dropdown + "Create new" button */}
)}
```

**Validation:**
```javascript
if (!formData.designer || formData.designer.trim() === '') {
  errors.push(t('proposals.validation.designerRequired', 'Designer is required'))
}
```

**Current Behavior:**
1. ✅ Fetches all users on component mount (same as legacy)
2. ✅ Maps users to options (same as legacy)
3. ❌ Uses **Chakra UI Select** (native dropdown) instead of react-select
4. ❌ Has **custom input mode** with state toggle (`isCreatingDesigner`)
5. ❌ More complex UI with multiple buttons (Add, Cancel)
6. ❌ Manual keyboard handling (Enter, Escape keys)
7. ✅ Simple validation (same as legacy)
8. ❌ **No CreatableSelect** - lost built-in create functionality

---

## CreateProposal Flow Analysis

### CustomerInfo.jsx (Current Implementation)

**Permission Check:**
```javascript
const canAssignDesigner = hasPermission(loggedInUser, 'admin:users')
```

**Designer Options Mapping:**
```javascript
const designerOptions = useMemo(
  () => users.filter((user) => user.role === 'Manufacturers').map(mapUserToOption),
  [users],
)
```

**Key Differences:**
- ✅ Checks permission before showing designer field
- ⚠️ **FILTERS users by role === 'Manufacturers'** (backend doesn't filter!)
- ✅ Uses Redux store `users` (fetched via `fetchAllUsers` action)
- ❌ More complex than legacy (permission checks, role filtering)

### ProposalSummary.jsx (Review/Submit Step)

**Designer Field (Read-only):**
```javascript
<FormControl isInvalid={!!errors.designer}>
  <FormLabel htmlFor="designer">{t('proposals.fields.designer', 'Designer')} *</FormLabel>
  <Controller
    name="designer"
    control={control}
    rules={{ required: t('proposals.create.customerInfo.validation.designer') }}
    render={({ field }) => (
      <Select
        {...field}
        id="designer"
        placeholder={t('proposals.create.customerInfo.designerPlaceholder', 'Select a designer')}
        onChange={(e) => {
          field.onChange(e)
          updateFormData({
            designer: e.target.value,
          })
        }}
      >
        {designerOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    )}
  />
  <FormErrorMessage>{errors.designer?.message}</FormErrorMessage>
</FormControl>
```

**Behavior:**
- ✅ Uses React Hook Form `Controller`
- ✅ Validation: required field
- ✅ Standard dropdown (no custom input mode here)
- ✅ Syncs with `updateFormData` on change

---

## Proposals List Display

### Proposals.jsx (Current)

**Designer Column:**
```javascript
const canAssignDesigner = hasPermission(loggedInUser, 'admin:users')

// In table header:
{canAssignDesigner && <Th scope="col">{t('proposals.headers.designer')}</Th>}

// In table row:
{canAssignDesigner && <Td>{item.designerData?.name || t('common.na')}</Td>}
```

**Backend Data Includes:**
- Backend fetches proposals with `include: [{ model: User, as: 'designerData' }]`
- Frontend displays `item.designerData?.name`

---

## Key Differences Summary

| Aspect | Legacy (Master) | Current (njnewui) | Issue? |
|--------|----------------|-------------------|--------|
| **Component** | react-select `CreatableSelect` | Chakra UI `Select` | ⚠️ Loss of creatable functionality |
| **Custom Input** | Built-in to CreatableSelect | Manual state toggle | ⚠️ Added complexity |
| **UI States** | Single component | Two states (dropdown vs input) | ⚠️ Overcomplicated |
| **Keyboard Handling** | Built-in to react-select | Manual Enter/Escape handling | ⚠️ Error-prone |
| **Clear Functionality** | `isClearable` prop | Not available | ❌ Lost feature |
| **CreateProposal** | Not shown in legacy extract | Permission-gated + role filtered | ⚠️ More restrictive |
| **Role Filtering** | None (uses all users) | Filters by 'Manufacturers' | ⚠️ Inconsistent with backend |
| **Backend Endpoint** | Returns all users | Returns all users | ⚠️ Frontend/backend mismatch |

---

## Logical Flow Comparison

### Legacy Flow (Simpler)
```
1. Component mounts
2. Fetch all users from /api/designers
3. Map to { value: id, label: name }
4. Display CreatableSelect with options
5. User selects existing OR types new name
6. Save user ID (if existing) or custom text (if new)
7. Validation on submit
```

### Current Flow (More Complex)
```
1. Component mounts
2. Fetch all users from /api/designers
3. Map to { value: id, label: name }
4. Display Chakra Select with options
   - If user clicks "Create new":
     5a. Toggle to custom input mode
     5b. User types name
     5c. User clicks Add or presses Enter
     5d. Save custom text
     5e. Toggle back to dropdown
   - If user selects from dropdown:
     5a. Save user ID
6. Validation on submit
```

**Analysis:** Current implementation adds ~3 extra states and manual handling for functionality that CreatableSelect provides out-of-box.

---

## Data Storage Analysis

### What Gets Saved to Database

**Legacy:**
- If existing designer selected: `designer = userId` (INTEGER)
- If new designer typed: `designer = customText` (??? - unclear if this works with INTEGER field)

**Current:**
- If existing designer selected: `designer = userId` (INTEGER) ✅
- If custom designer created: `designer = customText` (??? - **will fail** - field is INTEGER)

**CRITICAL ISSUE:** The `designer` column in database is `DataTypes.INTEGER`, but both legacy and current allow saving **custom text strings**. This will cause:
- ❌ Database errors (cannot insert string into integer field)
- ❌ Data integrity issues
- ❌ Inconsistent behavior

**Possible Explanations:**
1. Legacy may have automatically created User records for custom names (not seen in code)
2. There may be migration logic or hooks not visible in these files
3. This is a **bug in both implementations**

---

## Permission Handling

### Legacy
- ❌ No permission checks visible in EditProposal
- Designer field shown to all users

### Current
- ✅ `canAssignDesigner = hasPermission(loggedInUser, 'admin:users')`
- Only shows designer field if user has admin:users permission
- Applied in:
  - CreateProposal/CustomerInfo.jsx
  - Proposals.jsx (list view)
- ❌ **NOT applied in EditProposal.jsx** (shows to all users like legacy)

**Inconsistency:** EditProposal doesn't check permissions, but CreateProposal does.

---

## Recommendations

### Critical Issues to Address

1. **Database Type Mismatch**
   - `designer` field is INTEGER but code tries to save strings
   - Need to either:
     - Create User records for custom names automatically
     - Change field to STRING and break User association
     - Require existing users only (remove custom text feature)

2. **Implementation Complexity**
   - Current custom input mode is unnecessarily complex
   - Recommend: **Revert to react-select CreatableSelect** like legacy
   - Benefits: Simpler code, better UX, built-in accessibility

3. **Permission Consistency**
   - Apply same permission check (`admin:users`) to both Create and Edit
   - OR remove permission check entirely (match legacy behavior)

4. **Backend Filtering**
   - Either:
     - Update backend `/api/designers` to filter by role
     - OR update frontend to not filter (use all users)
   - Currently: Frontend filters, backend doesn't

5. **Function Name Typo**
   - Rename `getDesingers` → `getDesigners` in controller and route

### Minor Issues

- Add CreatableSelect back to dependencies if removed
- Document expected behavior for custom designer names
- Add backend validation for designer field
- Consider adding backend endpoint to create users when custom name entered

---

## Testing Recommendations

### Test Scenarios

1. **Existing Designer Selection**
   - Select existing user from dropdown
   - Verify user ID saved to database
   - Verify designer name displays in proposals list

2. **Custom Designer Creation** (if supported)
   - Enter custom name
   - Verify behavior (should fail currently due to INTEGER field)
   - Test with both Create and Edit flows

3. **Permission Enforcement**
   - Test as admin (should see designer field)
   - Test as non-admin (behavior unclear - need to clarify requirements)
   - Test in both Create and Edit

4. **Edge Cases**
   - Clear designer field (if supported)
   - Switch between existing and custom
   - Submit without designer (should show validation error)
   - Very long designer names (UI overflow?)

---

## Conclusion

The designer field implementation has **diverged significantly** from legacy, with:
- ✅ Same backend API and data fetching
- ❌ Different UI component (Chakra Select vs CreatableSelect)
- ❌ Added complexity with custom input states
- ❌ Lost functionality (clear button, built-in create)
- ❌ Critical bug: STRING/INTEGER type mismatch
- ⚠️ Permission handling inconsistency
- ⚠️ Frontend/backend filtering mismatch

**Recommendation:** Revert to simpler CreatableSelect approach from legacy, but first **resolve the database type mismatch** issue which exists in both versions.
