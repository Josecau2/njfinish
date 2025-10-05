# Chakra UI Migration Patterns - App Learning

## Critical Rules

### 1. Color Mode Values - MUST BE AT COMPONENT TOP
**NEVER use `useColorModeValue` inline in JSX - this violates React Hooks rules**

```javascript
// ❌ WRONG - inline usage
const Component = () => (
  <Box bg={useColorModeValue('white', 'gray.800')}>
)

// ✅ CORRECT - at component top
const Component = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  return <Box bg={bgColor}>
}
```

### 2. Authentication Customization className - MUST BE PRESERVED
Auth pages use specific className values for the customization system:
- `login-page-wrapper` - Main flex container
- `login-left-panel` - Left branding panel
- `login-right-panel` - Right form panel

**These className attributes enable custom CSS for authentication pages and MUST NOT be removed.**

Files affected:
- `frontend/src/pages/auth/LoginPage.jsx`
- `frontend/src/pages/auth/ForgotPasswordPage.jsx`
- `frontend/src/pages/auth/ResetPasswordPage.jsx`
- `frontend/src/pages/auth/RequestAccessPage.jsx`
- `frontend/src/pages/auth/SignupPage.jsx`

### 3. Component Migration Patterns

#### Bootstrap to Chakra Mappings:
```javascript
// className removal
className="shadow-sm" → boxShadow="sm"
className="border-0" → borderWidth="0"
className="bg-body" → bg={bgBody} // with color mode value
className="d-flex justify-content-end gap-2" → <Flex justify="flex-end" gap={2}>
className="invalid-feedback d-block" → <FormErrorMessage>

// HTML to Chakra components
div → Box/Flex/VStack/HStack (context-dependent)
h1-h6 → Heading size="lg/md/sm"
p → Text
small → Text fontSize="sm"
strong → Text fontWeight="bold"
span → Text as="span" or Box
pre → Box whiteSpace="pre"
code → Code component

// Form elements
<div> wrapper → <FormControl>
error div → <FormErrorMessage>
```

#### Common Color Mode Values:
```javascript
const bgBody = useColorModeValue('white', 'gray.800')
const bgLight = useColorModeValue('gray.50', 'gray.800')
const textPrimary = useColorModeValue('gray.900', 'gray.100')
const textSecondary = useColorModeValue('gray.600', 'gray.400')
const borderColor = useColorModeValue('gray.200', 'gray.700')
const iconColor = useColorModeValue('blue.500', 'blue.300')
const errorColor = useColorModeValue('red.500', 'red.300')
```

### 4. Files Already Migrated
✅ `frontend/src/pages/admin/ContractorDetail/OverviewTab.jsx`
✅ `frontend/src/pages/admin/ContractorDetail/ProposalsTab.jsx`
✅ `frontend/src/pages/admin/ContractorDetail/SettingsTab.jsx`
✅ `frontend/src/pages/calender/index.jsx`
✅ `frontend/src/pages/customers/AddCustomerForm.jsx`
✅ `frontend/src/pages/customers/CustomerForm.jsx`
✅ `frontend/src/pages/customers/EditCustomerPage.jsx`
✅ `frontend/src/pages/settings/users/UserList.jsx`
✅ `frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx`
✅ `frontend/src/pages/settings/manufacturers/tabs/SettingsTab.jsx`
✅ `frontend/src/pages/settings/manufacturers/EditManufacturer.jsx` (tab highlighting fix)
✅ `frontend/src/components/DocsIcons.js`
✅ `frontend/src/components/DocsComponents.js`

### 5. Build Verification Required
After EVERY file change:
1. Run build: `cd frontend && npx vite build --mode production --config vite.config.mjs`
2. Check for errors
3. Verify no missing color mode values (common error: `textSecondary is not defined`)
4. Commit with detailed message

### 6. Common Errors and Fixes

**Error: "X is not defined"**
- Cause: Used color mode value variable without defining it
- Fix: Add `const X = useColorModeValue(light, dark)` at component top

**Error: React Hooks violation**
- Cause: `useColorModeValue` called inline in JSX
- Fix: Move ALL useColorModeValue to component top level

**Error: Incorrect layout**
- Cause: Using Bootstrap props on Chakra Box (e.g., `<Box md={6}>`)
- Fix: Use SimpleGrid with responsive columns

### 7. Common Runtime Errors and Fixes

**Error: Invalid prop `aria-hidden` supplied to `React.Fragment`**
- **Cause**: Using Fragment `<>...</>` as icon prop in IconButton
- **Problem**: IconButton's `icon` prop applies props like `aria-hidden` to the element, but Fragments can't receive props
- **Fix**: Wrap text/content in `<Text>` or `<Box>` instead of Fragment
```javascript
// ❌ WRONG
<IconButton icon={<>←</>} />
<IconButton icon={<>{page}</>} />

// ✅ CORRECT
<IconButton icon={<Text>←</Text>} />
<IconButton icon={<Text>{page}</Text>} />
```

**Error: Raw `<small>` tags remain**
- **Cause**: Missed during HTML → Chakra conversion
- **Fix**: Convert ALL `<small>` to `<Text fontSize="sm">`
```javascript
// ❌ WRONG
<small>Helper text</small>

// ✅ CORRECT
<Text fontSize="sm" color="gray.500">Helper text</Text>
```

**Error: Mismatched closing tags (e.g., `</small>` without opening)**
- **Cause**: Incomplete conversion, using `Box as="small"` but closing with `</small>`
- **Fix**: Use consistent Chakra components - `<Text fontSize="sm">...</Text>`
```javascript
// ❌ WRONG
<Box as="small">text</small>

// ✅ CORRECT
<Text fontSize="sm">text</Text>
```

### 8. Complete HTML to Chakra Conversion Checklist

Before declaring migration complete, verify:
- [ ] NO raw `<div>` tags (use `<Box>`, `<Flex>`, `<VStack>`, `<HStack>`)
- [ ] NO raw `<span>` tags (use `<Text as="span">` or `<Box as="span">`)
- [ ] NO raw `<p>` tags (use `<Text>`)
- [ ] NO raw `<h1>-<h6>` tags (use `<Heading as="h#" size="...">`)
- [ ] NO raw `<small>` tags (use `<Text fontSize="sm">`)
- [ ] NO raw `<button>` tags (use `<Button>` or `<IconButton>`)
- [ ] NO raw `<input>` tags (use `<Input>`, `<Checkbox>`, `<Radio>`, etc.)
- [ ] NO raw `<form>` tags (use `<Box as="form">`)
- [ ] NO raw `<a>` tags (use `<Link>`)
- [ ] NO raw `<ul>/<ol>/<li>` tags (use `<UnorderedList>/<OrderedList>/<ListItem>`)
- [ ] NO raw `<img>` tags (use `<Image>`)
- [ ] NO inline `style={{}}` attributes (use Chakra props)
- [ ] NO Fragment `<>` as icon props in IconButton (use `<Text>` wrapper)
- [ ] All `useColorModeValue` calls at component top level

**Exceptions (acceptable):**
- Auth pages: className preserved for customization
- PDF builders: Raw HTML in template strings for PDF generation
- SVG files: `<path>`, `<circle>`, etc. are SVG elements, not HTML

### 9. User Preferences
- User wants "do it manually" - commit after each file
- User emphasizes "do not cut corners" - be thorough
- User wants to maintain customization system - preserve auth className
- Build verification is mandatory before commit
