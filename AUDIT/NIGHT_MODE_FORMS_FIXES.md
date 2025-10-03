# Night Mode Forms - Specific Fixes Required

## File-by-File Fix Guide

---

## 1. LoginPage.jsx

**File:** `/c/njtake2/njcabinets-main/frontend/src/pages/auth/LoginPage.jsx`

### Import Required:
```jsx
import { useColorModeValue } from '@chakra-ui/react'
```

### Line 167 - Background Fix:
```jsx
// BEFORE:
<Flex
  flex="1"
  alignItems="center"
  justifyContent="center"
  bg="white"
  className="login-right-panel"
>

// AFTER:
<Flex
  flex="1"
  alignItems="center"
  justifyContent="center"
  bg={useColorModeValue('white', 'gray.800')}
  className="login-right-panel"
>
```

### Line 178 - Text Color Fix:
```jsx
// BEFORE:
<Text textAlign="center" color="gray.700">
  {loginBrand.subtitle}
</Text>

// AFTER:
<Text textAlign="center" color={useColorModeValue('gray.700', 'gray.300')}>
  {loginBrand.subtitle}
</Text>
```

### Line 255 - Link Color Fix:
```jsx
// BEFORE:
<Link as={RouterLink} to="/forgot-password" color="blue.600" ...>

// AFTER:
<Link
  as={RouterLink}
  to="/forgot-password"
  color={useColorModeValue('blue.600', 'blue.400')}
  ...
>
```

### Line 275 - Link Color Fix:
```jsx
// BEFORE:
<Link as={RouterLink} to="/request-access" color="blue.600" ...>

// AFTER:
<Link
  as={RouterLink}
  to="/request-access"
  color={useColorModeValue('blue.600', 'blue.400')}
  ...
>
```

---

## 2. RequestAccessPage.jsx

**File:** `/c/njtake2/njcabinets-main/frontend/src/pages/auth/RequestAccessPage.jsx`

### Import Required:
```jsx
import { useColorModeValue } from '@chakra-ui/react'
```

### Line 179 - Background Fix:
```jsx
// BEFORE:
<Flex
  flex="1"
  alignItems="center"
  justifyContent="center"
  bg="white"
  overflowY="auto"
  className="login-right-panel"
>

// AFTER:
<Flex
  flex="1"
  alignItems="center"
  justifyContent="center"
  bg={useColorModeValue('white', 'gray.800')}
  overflowY="auto"
  className="login-right-panel"
>
```

### Multiple Text Color Fixes:
Add at component top:
```jsx
const textColor = useColorModeValue('gray.700', 'gray.300')
```

Then replace all instances of `color="gray.700"` with `color={textColor}`

---

## 3. ForgotPasswordPage.jsx

**File:** `/c/njtake2/njcabinets-main/frontend/src/pages/auth/ForgotPasswordPage.jsx`

### Line 112 - Background Fix:
```jsx
// BEFORE:
bg="white"

// AFTER:
bg={useColorModeValue('white', 'gray.800')}
```

---

## 4. ResetPasswordPage.jsx

**File:** `/c/njtake2/njcabinets-main/frontend/src/pages/auth/ResetPasswordPage.jsx`

### Line 98 - Background Fix:
```jsx
// BEFORE:
bg="white"

// AFTER:
bg={useColorModeValue('white', 'gray.800')}
```

---

## 5. SignupPage.jsx

**File:** `/c/njtake2/njcabinets-main/frontend/src/pages/auth/SignupPage.jsx`

### Line 78 - Background Fix:
```jsx
// BEFORE:
bg="white"

// AFTER:
bg={useColorModeValue('white', 'gray.800')}
```

---

## 6. CreateUser.jsx

**File:** `/c/njtake2/njcabinets-main/frontend/src/pages/settings/users/CreateUser.jsx`

### Import Required:
```jsx
import { useColorModeValue } from '@chakra-ui/react'
```

### CustomFormInput Component Fix:
```jsx
// BEFORE:
const CustomFormInput = ({ label, name, ... }) => (
  <FormControl isInvalid={isInvalid} mb={4}>
    <FormLabel htmlFor={name} fontWeight="medium" color="gray.700">
      {label}
      {required && (
        <Text as="span" color="red.500" ml={1}>
          *
        </Text>
      )}
    </FormLabel>

// AFTER:
const CustomFormInput = ({ label, name, ... }) => {
  const labelColor = useColorModeValue('gray.700', 'gray.300')

  return (
    <FormControl isInvalid={isInvalid} mb={4}>
      <FormLabel htmlFor={name} fontWeight="medium" color={labelColor}>
        {label}
        {required && (
          <Text as="span" color="red.500" ml={1}>
            *
          </Text>
        )}
      </FormLabel>
```

### CustomFormSelect Component Fix:
Same pattern - add `const labelColor = useColorModeValue('gray.700', 'gray.300')` at component top

---

## 7. CatalogTable.js

**File:** `/c/njtake2/njcabinets-main/frontend/src/components/CatalogTable.js`

### Add at component top (after other hooks):
```jsx
const searchIconColor = useColorModeValue('gray.400', 'gray.500')
```

### Find the search InputLeftElement and update:
```jsx
// BEFORE:
<InputLeftElement pointerEvents="none">
  <Icon as={Search} boxSize={ICON_BOX_MD} color="gray.400" />
</InputLeftElement>

// AFTER:
<InputLeftElement pointerEvents="none">
  <Icon as={Search} boxSize={ICON_BOX_MD} color={searchIconColor} />
</InputLeftElement>
```

---

## 8. TypesTab.jsx

**File:** `/c/njtake2/njcabinets-main/frontend/src/pages/settings/manufacturers/tabs/TypesTab.jsx`

### Add at component top:
```jsx
const searchIconColor = useColorModeValue('gray.400', 'gray.500')
```

### Update search icon:
```jsx
// BEFORE:
<Icon as={Search} boxSize={ICON_BOX_MD} color="gray.400" />

// AFTER:
<Icon as={Search} boxSize={ICON_BOX_MD} color={searchIconColor} />
```

---

## 9. Customers.jsx

**File:** `/c/njtake2/njcabinets-main/frontend/src/pages/customers/Customers.jsx`

### Same pattern as CatalogTable.js:
Add color mode hook for search icon and update Icon component.

---

## 10. main.css

**File:** `/c/njtake2/njcabinets-main/frontend/src/main.css`

### Option A: Add Dark Mode Support (Quick Fix)

Add after existing `.login-form-container` styles:

```css
/* Dark mode support for login forms */
@media (prefers-color-scheme: dark) {
  .login-form-container {
    background-color: #1a202c;
    color: #e2e8f0;
  }

  .login-form-container .form-label {
    color: #cbd5e0;
  }

  .login-form-container .form-control {
    background-color: #2d3748;
    border-color: #4a5568;
    color: #e2e8f0;
  }

  .login-form-container .form-control:focus {
    border-color: #63b3ed;
    box-shadow: 0 0 0 0.2rem rgba(66, 153, 225, 0.5);
    background-color: #2d3748;
  }

  .login-form-container .form-control::placeholder {
    color: #a0aec0;
  }

  .login-form-container .form-check-label {
    color: #cbd5e0;
  }

  .login-left-panel {
    background-color: #1a202c;
    color: #e2e8f0;
  }

  .login-right-panel {
    background-color: #2d3748;
  }
}
```

### Option B: Remove CSS (Recommended Long-term)

If all auth pages are using Chakra UI components (which they should be after fixes), these CSS classes may be obsolete. Consider:

1. Search for usage of `.login-form-container`, `.form-control` classes
2. If not used, remove entire section
3. Rely on Chakra UI theme instead

---

## 11. Modal Components with White Backgrounds

### Files to Update:
- `/c/njtake2/njcabinets-main/frontend/src/components/LoginPreview.jsx`
- `/c/njtake2/njcabinets-main/frontend/src/components/model/ModificationBrowserModal.jsx`
- `/c/njtake2/njcabinets-main/frontend/src/components/model/PrintProposalModal.jsx`
- `/c/njtake2/njcabinets-main/frontend/src/components/NeutralModal.jsx`
- `/c/njtake2/njcabinets-main/frontend/src/components/TermsModal.jsx`

### Pattern for all:
```jsx
// Import at top
import { useColorModeValue } from '@chakra-ui/react'

// In component
const bgColor = useColorModeValue('white', 'gray.800')

// Replace bg="white" with bg={bgColor}
```

---

## Testing Script

After making changes, test with this sequence:

```bash
# 1. Start dev server
cd frontend
npm run dev

# 2. In browser:
# - Navigate to http://localhost:5173/login
# - Open DevTools
# - Click the moon icon (or sun icon) in header to toggle dark mode

# 3. Verify:
# - Login page background is dark (not white)
# - Text is readable (not black on dark)
# - Input fields are visible
# - Placeholder text is readable
# - Links are visible

# 4. Navigate through app in dark mode:
# - /customers (check search bar)
# - /settings/users/create (check form labels)
# - /settings/manufacturers (check types tab search)

# 5. Toggle back to light mode:
# - Verify everything still works
# - Verify no regression in light mode
```

---

## Verification Checklist

After all fixes:

- [ ] LoginPage renders in dark mode (no white background)
- [ ] RequestAccessPage renders in dark mode
- [ ] ForgotPasswordPage renders in dark mode
- [ ] ResetPasswordPage renders in dark mode
- [ ] SignupPage renders in dark mode
- [ ] All text is readable in dark mode (sufficient contrast)
- [ ] All links are visible in dark mode
- [ ] Search bars work in dark mode (icon visible, input readable)
- [ ] CreateUser form labels visible in dark mode
- [ ] Form validation errors visible in both modes
- [ ] Focus states visible in both modes
- [ ] No console errors or warnings
- [ ] Light mode still works correctly (no regression)

---

## Quick Commands

### Find all instances of hardcoded white backgrounds:
```bash
grep -r "bg=\"white\"" frontend/src --include="*.jsx" --include="*.js" -n
grep -r "bg='white'" frontend/src --include="*.jsx" --include="*.js" -n
```

### Find all instances of hardcoded gray.700:
```bash
grep -r "color=\"gray.700\"" frontend/src --include="*.jsx" --include="*.js" -n
```

### Find all instances of blue.600 links:
```bash
grep -r "color=\"blue.600\"" frontend/src --include="*.jsx" --include="*.js" -n
```

---

**Priority Order:**
1. Fix all auth pages first (LoginPage, RequestAccessPage, etc.)
2. Fix main.css
3. Fix search components (CatalogTable, TypesTab, Customers)
4. Fix CreateUser form labels
5. Fix modal backgrounds

**Estimated time per file:** 5-15 minutes
**Total estimated time:** 2-4 hours for all critical fixes

---

**See also:**
- NIGHT_MODE_FORMS_AUDIT.md (full detailed analysis)
- NIGHT_MODE_FORMS_SUMMARY.md (executive summary)
