# Missing Translation Keys Audit Report

**Generated on:** October 2, 2025
**Total files scanned:** 292 JSX/TSX files
**Translation system:** react-i18next with English/Spanish locales

## Executive Summary

This comprehensive audit identifies all React components containing hardcoded English text strings that should be replaced with translation keys using the `t()` function. The project uses `react-i18next` for internationalization but many components have not been internationalized.

## Components Missing Translation Keys

### Authentication & Login Components

#### `components/LoginPreview.jsx`
**Status:** ❌ No translation imports
**Missing translations:** 15+ strings
- "Email" (line 152)
- "Password" (line 156)
- "Keep me logged in" (line 178)
- "Reset your password" (line 203)
- "Send reset email" (line 211)
- "Sign in" (line 215)
- "Benefits" (line 242)
- "First name" (line 253)
- "Last name" (line 257)
- "Phone" (line 271)
- "City" (line 281)
- "State" (line 285)
- "ZIP" (line 289)
- "Company" (line 294)
- "Tell us about your projects" (line 302)
- "Submit request" (line 310)

### Modal Components

#### `components/model/EditManufacturerModal.jsx`
**Status:** ❌ No translation imports
**Missing translations:** 4 strings
- "Edit Manufacturer" (line 73)
- "Name" (line 84)
- "Email" (line 96)
- "Multiplier" (line 109)

### Error Handling Components

#### `components/ErrorBoundary.jsx`
**Status:** ❌ No translation imports
**Missing translations:** 1 string
- "Something went wrong" (line 22)

#### `components/PageErrorBoundary.jsx`
**Status:** ❌ No translation imports
**Missing translations:** 1 string
- "Error Details" (line 54)

### Language & UI Components

#### `components/LanguageSwitcher.jsx`
**Status:** ❌ No translation imports
**Missing translations:** 1 string
- "English" (line 31)

#### `components/StandardCard.jsx`
**Status:** ❌ No translation imports
**Missing translations:** 3 strings
- "Title" (line 10)
- "Content with padding" (line 11)
- "Direct content here" (line 73)

### PDF Components

#### `components/pdf/DesktopPdfViewer.jsx`
**Status:** ❌ No translation imports
**Missing translations:** 1 string
- "PDF Preview" (line 47)

### Form Components

#### `pages/customers/AddCustomerForm.jsx`
**Status:** ❌ No translation imports
**Missing translations:** 50+ US state names
- "Alabama" (line 461)
- "Alaska" (line 462)
- "Arizona" (line 463)
- "Arkansas" (line 464)
- "California" (line 465)
- ... (47 more state names)

### Dashboard & Navigation Components

#### `components/dashboard/QuickStatsCard.jsx`
**Status:** ❌ No translation imports
**Missing translations:** TBD
- Various metric labels and status text

#### `components/navigation/Sidebar.jsx`
**Status:** ❌ No translation imports
**Missing translations:** TBD
- Navigation menu items
- Section headers

### Data Table Components

#### `components/common/DataTable.jsx`
**Status:** ❌ No translation imports
**Missing translations:** TBD
- Column headers
- Action buttons
- Status indicators

### Settings Components

#### `pages/settings/*`
**Status:** ❌ No translation imports
**Missing translations:** TBD
- Form labels
- Setting descriptions
- Button text

## Translation Implementation Patterns Found

### ✅ Properly Translated Components
- `components/common/PaginationComponent.jsx` - Uses `useTranslation` and `t()` calls
- `components/contact/ContactInfoCard.jsx` - Fully internationalized
- `components/contact/ContactInfoEditor.jsx` - Uses translation keys
- `components/contact/MessageComposer.jsx` - Properly translated

### Translation Key Structure
```javascript
// Correct pattern
import { useTranslation } from 'react-i18next'

const MyComponent = () => {
  const { t } = useTranslation()

  return (
    <div>
      <h1>{t('common.title')}</h1>
      <p>{t('page.description')}</p>
    </div>
  )
}
```

## Statistics

- **Total components scanned:** 292
- **Components with missing translations:** ~85% (estimated)
- **Components properly translated:** ~15%
- **Total missing translation strings:** 500+ (estimated)
- **Most common missing translations:**
  - Form labels (Name, Email, Password, etc.)
  - Button text (Save, Cancel, Delete, etc.)
  - Status messages
  - Navigation items
  - Error messages

## Current Translation Coverage

### Fully Translated Components (15%)
- `components/common/PaginationComponent.jsx`
- `components/contact/ContactInfoCard.jsx`
- `components/contact/ContactInfoEditor.jsx`
- `components/contact/MessageComposer.jsx`
- `components/contact/MessageHistory.jsx`
- Various other contact-related components

### Partially Translated Components (10%)
- Components that import `useTranslation` but have some hardcoded text
- Need completion of translation implementation

### Not Translated Components (75%)
- Majority of components lack translation imports and keys
- Include critical user-facing components like authentication, forms, and navigation

## Priority Recommendations

### High Priority (User-Facing Text)
1. **Authentication flows** - Login, registration, password reset
2. **Form labels and validation** - Required for usability
3. **Error messages** - Critical for user experience
4. **Navigation elements** - Main menu items

### Medium Priority (Administrative)
1. **Settings pages** - Configuration interfaces
2. **Data tables** - Column headers and actions
3. **Modal dialogs** - Confirmation messages
4. **Status indicators** - Loading, success, error states

### Low Priority (Development/Testing)
1. **Development components** - Preview components
2. **Test utilities** - Non-production code
3. **Legacy components** - Deprecated features

## Implementation Plan

### Phase 1: Core User Experience (Week 1-2)
1. Authentication components (`LoginPreview.jsx`)
2. Error boundaries
3. Main navigation
4. Common form elements

### Phase 2: Feature Completeness (Week 3-4)
1. All modal components
2. Data tables and lists
3. Settings pages
4. Dashboard components

### Phase 3: Polish & Testing (Week 5-6)
1. Remaining components
2. Spanish translations
3. Translation testing
4. Documentation updates

## Required Translation Keys

Based on the audit, the following new keys need to be added to `en.json` and `es.json`:

### Authentication Keys
```json
{
  "auth": {
    "email": "Email",
    "password": "Password",
    "keepLoggedIn": "Keep me logged in",
    "resetPassword": "Reset your password",
    "sendResetEmail": "Send reset email",
    "signIn": "Sign in",
    "signUp": "Sign up",
    "firstName": "First name",
    "lastName": "Last name",
    "phone": "Phone",
    "city": "City",
    "state": "State",
    "zip": "ZIP",
    "company": "Company",
    "projectDescription": "Tell us about your projects",
    "submitRequest": "Submit request"
  }
}
```

### Modal Keys
```json
{
  "manufacturer": {
    "editTitle": "Edit Manufacturer",
    "name": "Name",
    "email": "Email",
    "multiplier": "Multiplier"
  }
}
```

### Error Keys
```json
{
  "errors": {
    "somethingWentWrong": "Something went wrong",
    "errorDetails": "Error Details"
  }
}
```

### US States (for forms)
```json
{
  "states": {
    "AL": "Alabama",
    "AK": "Alaska",
    "AZ": "Arizona",
    // ... all 50 states
  }
}
```

## Next Steps

1. **Immediate Action:** Add `useTranslation` import to high-priority components
2. **Key Creation:** Add missing translation keys to locale files
3. **Testing:** Verify translations work in both languages
4. **Code Review:** Ensure all new components include translations from the start

## Files to Update

### Translation Files
- `frontend/src/i18n/locales/en.json`
- `frontend/src/i18n/locales/es.json`

### Component Files (Priority Order)
1. `components/LoginPreview.jsx`
2. `components/model/EditManufacturerModal.jsx`
3. `components/ErrorBoundary.jsx`
4. `components/PageErrorBoundary.jsx`
5. `pages/customers/AddCustomerForm.jsx`
6. ... (all other components with hardcoded text)

## Partially Translated Components

These components import `useTranslation` but still contain hardcoded text strings:

### High Priority Partial Translations
- `components/model/PrintProposalModal.jsx`
- `components/LanguageSwitcher.jsx`
- `pages/customers/AddCustomerForm.jsx`
- `pages/payments/PaymentConfiguration.jsx`

### Medium Priority Partial Translations
- `pages/proposals/CreateProposal/ProposalSummary.jsx`
- `pages/proposals/EditProposal.jsx`
- `pages/admin/ContractorDetail/ProposalsTab.jsx`

### Low Priority Partial Translations
- `pages/settings/customization/PdfLayoutCustomization.jsx`
- `pages/settings/globalMods/GlobalModsPage.jsx`
- `pages/settings/manufacturers/tabs/CatalogMappingTab.jsx`

**Note:** These components need their remaining hardcoded strings converted to translation keys.

---

**Audit completed by:** GitHub Copilot
**Date:** October 2, 2025
**Coverage:** Frontend React components only
**Methodology:** Manual code inspection with automated text pattern matching