# Night Mode Forms & Inputs Audit Report

**Date:** October 2, 2025
**Scope:** All form components, inputs, search bars, and form-related UI elements
**Focus:** Night mode (dark mode) compatibility and styling issues

---

## Executive Summary

The application has **partial night mode support** through Chakra UI's `useColorMode` and `useColorModeValue` hooks. However, there are **critical issues** preventing proper dark mode functionality across form components:

### Critical Issues Found:
1. **Auth pages hardcoded with white backgrounds** (blocks night mode entirely on login/signup)
2. **Input components lack dark mode styling** in some areas
3. **Search bars missing dark mode variants**
4. **Placeholder text colors not optimized for night mode**
5. **Form labels and helper text lack dark mode colors**
6. **Mixed usage of hardcoded vs semantic colors**

### Overall Status: ⚠️ **NEEDS ATTENTION**

---

## 1. Authentication Pages Issues

### 🔴 **CRITICAL: Hardcoded White Backgrounds**

**Files Affected:**
- `/c/njtake2/njcabinets-main/frontend/src/pages/auth/LoginPage.jsx` (Line 167)
- `/c/njtake2/njcabinets-main/frontend/src/pages/auth/RequestAccessPage.jsx` (Line 179)
- `/c/njtake2/njcabinets-main/frontend/src/pages/auth/ForgotPasswordPage.jsx` (Line 112)
- `/c/njtake2/njcabinets-main/frontend/src/pages/auth/ResetPasswordPage.jsx` (Line 98)
- `/c/njtake2/njcabinets-main/frontend/src/pages/auth/SignupPage.jsx` (Line 78)

**Issue:**
```jsx
<Flex
  flex="1"
  alignItems="center"
  justifyContent="center"
  bg="white"  // ❌ HARDCODED - Blocks night mode
  className="login-right-panel"
>
```

**Impact:**
- Users cannot use night mode on login/auth pages
- Forces bright white background regardless of user preference
- Creates jarring contrast when switching from dark mode app to auth pages

**Fix Required:**
```jsx
// Replace with semantic color
bg={useColorModeValue('white', 'gray.800')}
// OR use semantic token
bg="surface"
```

---

### 🟡 **Text Color Issues on Auth Pages**

**LoginPage.jsx (Line 178):**
```jsx
<Text textAlign="center" color="gray.700">
  {loginBrand.subtitle}
</Text>
```

**Issue:** `color="gray.700"` is too dark for dark mode backgrounds

**Fix Required:**
```jsx
color={useColorModeValue('gray.700', 'gray.300')}
```

**Similar Issues in:**
- RequestAccessPage.jsx - Multiple text elements with hardcoded gray colors
- All auth pages - Links using `color="blue.600"` without dark mode variants

---

## 2. Input Component Issues

### 🟢 **GOOD: Theme Has Dark Mode Support**

The theme configuration in `/c/njtake2/njcabinets-main/frontend/src/theme/index.js` includes dark mode support for inputs:

```javascript
const inputLikeComponent = {
  variants: {
    outline: {
      field: {
        _dark: {
          bg: 'gray.700',
          borderColor: 'gray.600',
          color: 'gray.100',
          _hover: { borderColor: 'gray.500' },
          _focusVisible: {
            borderColor: 'var(--chakra-colors-primary)',
            boxShadow: '0 0 0 1px var(--chakra-colors-focusRing)',
          },
          _placeholder: { color: 'gray.400' },
        },
      },
    },
    filled: {
      field: {
        _dark: {
          bg: 'gray.700',
          _hover: { bg: 'gray.600' },
          _focusVisible: { bg: 'gray.800' },
        },
      },
    },
  },
}
```

### 🟡 **Issue: Inconsistent Application**

While the theme provides dark mode support, many components don't use the theme's color mode awareness because:

1. **Hardcoded colors override theme** (e.g., `color="gray.700"`)
2. **Missing `useColorModeValue` hooks** in custom form components
3. **CSS classes in main.css override Chakra styles**

---

## 3. Form Components Analysis

### ✅ **Components WITH Proper Night Mode Support:**

1. **DataTable.jsx** - Uses `useColorModeValue` correctly:
```jsx
const borderColor = useColorModeValue("gray.300", "gray.600")
const hoverBg = useColorModeValue("gray.50", 'gray.750')
const headerBg = useColorModeValue("gray.50", "gray.800")
const headerTextColor = useColorModeValue("gray.700", "gray.300")
const cellTextColor = useColorModeValue("gray.800", "gray.200")
```

2. **PageHeader.jsx** - Proper color mode handling:
```jsx
const borderColor = useColorModeValue('gray.200', 'gray.600')
const subtitleColor = useColorModeValue('gray.600', 'gray.400')
const iconBg = useColorModeValue('brand.50', 'brand.900')
const iconColor = useColorModeValue('brand.500', 'brand.300')
const titleColor = useColorModeValue('gray.900', 'white')
```

3. **AppHeader.js** - Has color mode toggle and proper styling

### ⚠️ **Components NEEDING Night Mode Support:**

#### **CustomerForm.jsx**
- No `useColorModeValue` usage
- Relies entirely on theme defaults
- Custom form labels may have visibility issues in dark mode

#### **CreateUser.jsx**
- Custom form components defined but no dark mode variants:
```jsx
const CustomFormInput = ({ ... }) => (
  <FormControl isInvalid={isInvalid} mb={4}>
    <FormLabel htmlFor={name} fontWeight="medium" color="gray.700">
      {/* ❌ Hardcoded gray.700 */}
    </FormLabel>
```

**Fix Required:**
```jsx
color={useColorModeValue('gray.700', 'gray.300')}
```

#### **ModificationModal.jsx**
- No dark mode color variants
- Relies on theme defaults which may not cover all cases

---

## 4. Search Bar Components

### 🔴 **Search Inputs Lack Night Mode Styling**

**Files with Search Issues:**

1. **CatalogTable.js** (Line ~126):
```jsx
<Input
  value={partQuery}
  onChange={(e) => setPartQuery(e.target.value)}
  placeholder={t('catalogTable.searchPlaceholder')}
  // ❌ No dark mode styling
/>
```

2. **TypesTab.jsx** (Line ~30):
```jsx
<InputGroup>
  <InputLeftElement pointerEvents="none">
    <Icon as={Search} boxSize={ICON_BOX_MD} color="gray.400" />
    {/* ❌ Icon color fixed at gray.400 */}
  </InputLeftElement>
  <Input
    placeholder={t('manufacturers.types.searchPlaceholder')}
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    // ❌ No dark mode styling
  />
</InputGroup>
```

3. **Customers.jsx** - Similar search input issues

**Fix Required:**
```jsx
<InputLeftElement pointerEvents="none">
  <Icon
    as={Search}
    boxSize={ICON_BOX_MD}
    color={useColorModeValue('gray.400', 'gray.500')}
  />
</InputLeftElement>
```

---

## 5. Placeholder Text Issues

### 🟡 **Placeholder Colors Not Optimized**

The theme provides `_placeholder: { color: 'gray.400' }` for dark mode, but this may not be optimal in all contexts.

**Recommendation:**
- Light mode: `gray.500` (better contrast)
- Dark mode: `gray.400` (current is acceptable)

**Update theme:**
```javascript
_placeholder: {
  color: {
    base: 'gray.500',
    _dark: 'gray.400'
  }
}
```

---

## 6. Form Labels and Helper Text

### 🟡 **FormLabel Colors Need Dark Mode Variants**

Many custom form components use hardcoded label colors:

**Examples:**
```jsx
// CreateUser.jsx
<FormLabel htmlFor={name} fontWeight="medium" color="gray.700">

// Multiple files
<FormLabel>{t('label')}</FormLabel>  // ❌ No color specified, relies on theme
```

**Issue:** When `color` is explicitly set to `gray.700`, it won't adapt to dark mode.

**Fix:**
```jsx
<FormLabel
  htmlFor={name}
  fontWeight="medium"
  color={useColorModeValue('gray.700', 'gray.300')}
>
```

---

## 7. Form Validation Messages

### ✅ **FormErrorMessage - Theme Handled**

Chakra's `FormErrorMessage` component has built-in dark mode support through the theme.

### ⚠️ **Custom Error/Success States Need Review**

Components using custom error states should verify colors work in both modes.

---

## 8. Select, Checkbox, Radio Components

### ✅ **Theme Configuration Exists**

The theme includes dark mode support for these components:

```javascript
const Checkbox = {
  baseStyle: {
    control: {
      _focusVisible: {
        boxShadow: '0 0 0 2px var(--chakra-colors-focusRing)',
        outline: 'none',
      },
    },
  },
}
```

### 🟡 **Issue: Not All Instances Use Theme**

Some components have inline styles that override theme:

**Example from RequestAccessPage.jsx:**
```jsx
<Checkbox
  id="keepLoggedIn"
  isChecked={keepLoggedIn}
  onChange={(e) => setKeepLoggedIn(e.target.checked)}
  // ❌ No explicit dark mode styling
>
```

**Note:** This relies on theme defaults, which should work, but custom styled checkboxes may have issues.

---

## 9. DatePicker / TimePicker Components

### ℹ️ **Not Found**

No DatePicker or TimePicker components were found in the codebase during this audit. If these are added in the future, ensure they follow the color mode pattern.

---

## 10. Input Groups and Addons

### 🟡 **InputGroup Issues**

**TypesTab.jsx Example:**
```jsx
<InputGroup>
  <InputLeftElement pointerEvents="none">
    <Icon as={Search} boxSize={ICON_BOX_MD} color="gray.400" />
  </InputLeftElement>
  <Input ... />
</InputGroup>
```

**Issue:** Icon color is hardcoded and doesn't change in dark mode.

**Found in:**
- TypesTab.jsx
- CreateUser.jsx
- Multiple search implementations

**Fix Pattern:**
```jsx
<Icon
  as={Search}
  boxSize={ICON_BOX_MD}
  color={useColorModeValue('gray.400', 'gray.500')}
/>
```

---

## 11. CSS Override Issues

### 🔴 **main.css Has Hardcoded Form Styles**

File: `/c/njtake2/njcabinets-main/frontend/src/main.css`

**Problematic Sections:**
```css
.login-form-container .form-control {
  border: 1px solid #ced4da;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.login-form-container .form-control:focus {
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.login-form-container .form-check-label {
  font-size: 0.9rem;
  color: #495057;  /* ❌ No dark mode variant */
}
```

**Impact:** These styles override Chakra UI's theme-based styling and prevent dark mode from working properly.

**Fix Required:**
1. Remove or scope these CSS classes to only legacy components
2. Migrate all forms to use Chakra UI components
3. If keeping CSS, add dark mode variants:

```css
@media (prefers-color-scheme: dark) {
  .login-form-container .form-control {
    background-color: #2d3748;
    border-color: #4a5568;
    color: #e2e8f0;
  }

  .login-form-container .form-check-label {
    color: #cbd5e0;
  }
}
```

---

## 12. Components with Hardcoded White Backgrounds

### 🔴 **Critical Files:**

Found via search: `bg="white"` or `bg='white'`

1. **CatalogTable.js** - Table headers, modal backgrounds
2. **CatalogTableEdit.js** - Similar issues
3. **PaginationComponent.jsx** - Pagination controls
4. **LoginPreview.jsx** - Preview panel
5. **ModificationBrowserModal.jsx** - Modal backgrounds
6. **PrintProposalModal.jsx** - Print preview
7. **NeutralModal.jsx** - Modal container
8. **TermsModal.jsx** - Modal background

**Recommendation:** Replace all instances with:
```jsx
bg={useColorModeValue('white', 'gray.800')}
```

---

## Summary of Issues by Priority

### 🔴 **HIGH PRIORITY (Blocks Night Mode)**

1. **Auth pages hardcoded white backgrounds** (5 files)
2. **main.css form styles override Chakra theme**
3. **Components with hardcoded white backgrounds** (8+ files)

### 🟡 **MEDIUM PRIORITY (Degraded Experience)**

4. **Text colors hardcoded without dark variants** (throughout auth pages)
5. **Search input icon colors hardcoded** (3+ implementations)
6. **FormLabel colors need dark variants** (CreateUser, custom forms)
7. **InputGroup addons lacking dark mode colors**

### 🟢 **LOW PRIORITY (Minor Issues)**

8. **Placeholder text color could be more optimal**
9. **Some helper text lacks explicit colors**
10. **Link colors in auth pages need dark variants**

---

## Recommendations

### Immediate Actions:

1. **Fix Auth Pages:**
   - Replace `bg="white"` with `bg={useColorModeValue('white', 'gray.800')}`
   - Update all text colors to use `useColorModeValue`
   - Update link colors for dark mode visibility

2. **Audit main.css:**
   - Remove or scope `.form-control` and related classes
   - Add dark mode CSS if classes must remain
   - Migrate to Chakra UI components where possible

3. **Fix Search Bars:**
   - Update InputLeftElement icon colors
   - Ensure search inputs use theme variants

### Long-term Improvements:

1. **Establish Pattern:**
   - Create reusable form components with built-in dark mode support
   - Document color usage patterns
   - Enforce theme usage via linting

2. **Component Library:**
   - Build dark-mode-aware wrappers for common patterns
   - Create CustomFormInput, CustomSearch components with dark mode built-in

3. **Testing:**
   - Test all forms in both light and dark mode
   - Verify contrast ratios meet WCAG standards
   - Check focus states visibility

---

## Files Requiring Changes

### Critical (Must Fix):
- `/c/njtake2/njcabinets-main/frontend/src/pages/auth/LoginPage.jsx`
- `/c/njtake2/njcabinets-main/frontend/src/pages/auth/RequestAccessPage.jsx`
- `/c/njtake2/njcabinets-main/frontend/src/pages/auth/ForgotPasswordPage.jsx`
- `/c/njtake2/njcabinets-main/frontend/src/pages/auth/ResetPasswordPage.jsx`
- `/c/njtake2/njcabinets-main/frontend/src/pages/auth/SignupPage.jsx`
- `/c/njtake2/njcabinets-main/frontend/src/main.css`

### Important (Should Fix):
- `/c/njtake2/njcabinets-main/frontend/src/pages/settings/users/CreateUser.jsx`
- `/c/njtake2/njcabinets-main/frontend/src/components/CatalogTable.js`
- `/c/njtake2/njcabinets-main/frontend/src/pages/settings/manufacturers/tabs/TypesTab.jsx`
- `/c/njtake2/njcabinets-main/frontend/src/pages/customers/Customers.jsx`
- `/c/njtake2/njcabinets-main/frontend/src/components/LoginPreview.jsx`

### Review (Lower Priority):
- All modal components with white backgrounds
- All search implementations
- Custom form components

---

## Code Examples

### Pattern to Follow:

```jsx
import { useColorModeValue } from '@chakra-ui/react'

const MyFormComponent = () => {
  // Define color variants at component top
  const bgColor = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.800', 'gray.100')
  const labelColor = useColorModeValue('gray.700', 'gray.300')
  const borderColor = useColorModeValue('gray.300', 'gray.600')
  const iconColor = useColorModeValue('gray.400', 'gray.500')

  return (
    <Box bg={bgColor} borderColor={borderColor}>
      <FormControl>
        <FormLabel color={labelColor}>Label</FormLabel>
        <InputGroup>
          <InputLeftElement>
            <Icon color={iconColor} />
          </InputLeftElement>
          <Input
            color={textColor}
            placeholder="Placeholder"
            _placeholder={{
              color: useColorModeValue('gray.500', 'gray.400')
            }}
          />
        </InputGroup>
      </FormControl>
    </Box>
  )
}
```

---

## Testing Checklist

Before considering night mode complete, verify:

- [ ] All auth pages render correctly in dark mode
- [ ] Input fields are visible and readable in dark mode
- [ ] Placeholder text has sufficient contrast in dark mode
- [ ] Search bars work properly in dark mode
- [ ] Form labels are readable in dark mode
- [ ] Focus states are visible in dark mode
- [ ] Error messages are visible in dark mode
- [ ] Success states are visible in dark mode
- [ ] Select dropdowns render correctly in dark mode
- [ ] Checkboxes and radios are visible in dark mode
- [ ] Modal forms work in dark mode
- [ ] All text has minimum 4.5:1 contrast ratio (WCAG AA)

---

**Audit Completed:** October 2, 2025
**Next Steps:** Address critical issues in auth pages first, then systematically fix other form components.
