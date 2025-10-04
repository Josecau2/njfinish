# Missing Translations - Manual Addition Guide

This document lists all missing translations found in the application, organized by file and component.

## Summary Statistics
- **Total files scanned**: 167
- **Files with translation setup**: 102
- **Files without translation setup**: 65
- **Files with partial translation**: 17
- **Total potential hardcoded strings**: 107

---

## FILES WITHOUT TRANSLATION SETUP (Need useTranslation hook added)

### 1. **pages/auth/SignupPage.jsx** (9 hardcoded strings)
**Section**: `auth.signUp`

Missing translations:
- "Sign Up"
- "NJ Cabinets"
- "Create your account to get started."
- "Already have an account?"
- "Dealer Portal"

**Suggested translation keys**:
```json
"auth": {
  "signUp": {
    "title": "Sign Up",
    "appName": "NJ Cabinets",
    "subtitle": "Create your account to get started.",
    "alreadyHaveAccount": "Already have an account?",
    "dealerPortal": "Dealer Portal",
    "signInLink": "Sign in here",
    "submit": "Create Account"
  }
}
```

---

### 2. **components/StyleMerger.jsx** (6 hardcoded strings)
**Section**: `components.styleMerger`

Missing translations:
- "Merge"
- "From"
- "Into"
- "Select styles to merge"
- "Source style"
- "Target style"

**Suggested translation keys**:
```json
"components": {
  "styleMerger": {
    "merge": "Merge",
    "from": "From",
    "into": "Into",
    "selectStyles": "Select styles to merge",
    "sourceStyle": "Source style",
    "targetStyle": "Target style"
  }
}
```

---

### 3. **components/pdf/DesktopPdfViewer.jsx** (5 hardcoded strings)
**Section**: `components.pdfViewer`

Missing translations:
- "Reset"
- "Page"
- "Loading PDF document..."
- "Loading page..."
- "Failed to load page"

**Suggested translation keys**:
```json
"components": {
  "pdfViewer": {
    "reset": "Reset",
    "page": "Page",
    "loadingDocument": "Loading PDF document...",
    "loadingPage": "Loading page...",
    "loadFailed": "Failed to load page"
  }
}
```

---

### 4. **components/NotificationBell.js** (3 hardcoded strings)
**Section**: `components.notifications`

Missing translations:
- "Mark all read"
- "Notifications"
- "No new notifications"

**Suggested translation keys**:
```json
"components": {
  "notifications": {
    "title": "Notifications",
    "markAllRead": "Mark all read",
    "noNew": "No new notifications"
  }
}
```

---

### 5. **components/DocsComponents.js** (2 hardcoded strings)
**Section**: `components.docs`

Missing translations:
- "Explore Documentation"
- Long documentation text

**Suggested translation keys**:
```json
"components": {
  "docs": {
    "explore": "Explore Documentation",
    "description": "Our Admin Panel is not simply a bundle of third-party pieces. It is the only open-source React dashboard built on a professional, enterprise-grade UI component library. This example shows the basic usage; for extended demos, detailed API docs, and customization guidance, visit the documentation."
  }
}
```

---

### 6. **components/DocsIcons.js** (2 hardcoded strings)
**Section**: `components.docsIcons`

Missing translations:
- "Explore Documentation"
- Icon package description

**Suggested translation keys**:
```json
"components": {
  "docsIcons": {
    "explore": "Explore Documentation",
    "description": "CoreUI Icons package ships with more than 1500 icons in multiple formats - SVG, PNG, and webfonts. They are carefully designed for common actions and items so you can reuse them across your web or mobile products. Visit the documentation to explore the full set."
  }
}
```

---

### 7. **pages/calender/index.jsx** (1 hardcoded string)
**Section**: `calendar`

Missing translations:
- "No events found"

**Suggested translation keys**:
```json
"calendar": {
  "title": "Calendar",
  "noEvents": "No events found",
  "addEvent": "Add Event"
}
```

---

### 8. **components/ErrorBoundary.jsx** (1 hardcoded string)
**Section**: `components.errors`

Missing translations:
- "The application encountered an error. Please refresh to try again."

**Suggested translation keys**:
```json
"components": {
  "errors": {
    "applicationError": "The application encountered an error. Please refresh to try again.",
    "refresh": "Refresh",
    "tryAgain": "Try again"
  }
}
```

---

### 9. **components/LanguageSwitcher.jsx** (1 hardcoded string)
**Section**: `components.languageSwitcher`

Missing translations:
- "Select language"

**Suggested translation keys**:
```json
"components": {
  "languageSwitcher": {
    "selectLanguage": "Select language",
    "english": "English",
    "spanish": "Spanish"
  }
}
```

---

### 10. **components/Loader.js** (1 hardcoded string)
**Section**: `components.loader`

Missing translations:
- "Loading…"

**Suggested translation keys**:
```json
"components": {
  "loader": {
    "loading": "Loading…",
    "pleaseWait": "Please wait..."
  }
}
```

---

### 11. **components/PageErrorBoundary.jsx** (1 hardcoded string)
**Section**: `components.errors`

Missing translations:
- "Something went wrong while loading this page."

**Suggested translation keys** (add to existing errors):
```json
"components": {
  "errors": {
    "pageError": "Something went wrong while loading this page."
  }
}
```

---

## FILES WITH PARTIAL TRANSLATION (Has useTranslation but missing some translations)

### 1. **pages/settings/manufacturers/tabs/CatalogMappingTab.jsx** (36 hardcoded strings)
**Section**: `settings.manufacturers.catalogMapping`

Missing translations:
- "Assign"
- "Select All ({currentItems.length} items)"
- "Price"
- "Type"
- "Applying assembly cost..."
- "Assembly Fee"
- "Catalog Items"
- "Search catalog items..."
- "Bulk Update"
- "Update Selected"
- "Clear Selection"
- And 25 more...

**Suggested translation keys**:
```json
"settings": {
  "manufacturers": {
    "catalogMapping": {
      "title": "Catalog Mapping",
      "assign": "Assign",
      "selectAll": "Select All ({{count}} items)",
      "price": "Price",
      "type": "Type",
      "style": "Style",
      "applyingAssemblyCost": "Applying assembly cost...",
      "assemblyFee": "Assembly Fee",
      "catalogItems": "Catalog Items",
      "searchPlaceholder": "Search catalog items...",
      "bulkUpdate": "Bulk Update",
      "updateSelected": "Update Selected",
      "clearSelection": "Clear Selection",
      "itemsSelected": "{{count}} items selected",
      "noItemsSelected": "No items selected",
      "selectItemsFirst": "Please select items first"
    }
  }
}
```

---

### 2. **pages/settings/manufacturers/tabs/TypesTab.jsx** (13 hardcoded strings)
**Section**: `settings.manufacturers.types`

Missing translations:
- "Update {selectedItems.length} Types"
- "Rename Type"
- "Change Type Category"
- "Edit the following fields for the selected {selectedItems.length} types..."
- "Note:"
- And more...

**Suggested translation keys**:
```json
"settings": {
  "manufacturers": {
    "types": {
      "updateMultiple": "Update {{count}} Types",
      "renameType": "Rename Type",
      "changeCategory": "Change Type Category",
      "bulkEditInstructions": "Edit the following fields for the selected {{count}} types. Leave fields empty to keep existing values.",
      "note": "Note:",
      "noteText": "Changes will apply to all selected types",
      "currentType": "Current Type",
      "newType": "New Type",
      "category": "Category"
    }
  }
}
```

---

### 3. **components/LoginPreview.jsx** (7 hardcoded strings)
**Section**: `settings.customization.loginPreview`

Missing translations:
- "Forgot password?"
- "Jane"
- "Doe"
- "City"
- "Your business name"

**Suggested translation keys**:
```json
"settings": {
  "customization": {
    "loginPreview": {
      "forgotPassword": "Forgot password?",
      "sampleFirstName": "Jane",
      "sampleLastName": "Doe",
      "sampleCity": "City",
      "sampleBusinessName": "Your business name"
    }
  }
}
```

---

### 4. **pages/settings/multipliers/EditManuMultiplier.jsx** (4 hardcoded strings)
**Section**: `settings.multipliers`

Missing translations:
- "Save Changes"
- "Enter manufacturer name"
- "Enter manufacturer email"
- "Enter multiplier"

**Suggested translation keys**:
```json
"settings": {
  "multipliers": {
    "edit": {
      "saveChanges": "Save Changes",
      "namePlaceholder": "Enter manufacturer name",
      "emailPlaceholder": "Enter manufacturer email",
      "multiplierPlaceholder": "Enter multiplier"
    }
  }
}
```

---

### 5. **components/EditManufacturerModal.jsx** (2 hardcoded strings)
**Section**: `modals.editManufacturer`

Missing translations:
- "Cancel editing manufacturer"
- "Save manufacturer changes"

**Suggested translation keys**:
```json
"modals": {
  "editManufacturer": {
    "cancelAria": "Cancel editing manufacturer",
    "saveAria": "Save manufacturer changes"
  }
}
```

---

### 6. **components/FileViewerModal.jsx** (2 hardcoded strings)
**Section**: `modals.fileViewer`

Missing translations:
- "Close"
- "Preview is not available for this file type."

**Suggested translation keys**:
```json
"modals": {
  "fileViewer": {
    "close": "Close",
    "noPreview": "Preview is not available for this file type."
  }
}
```

---

### 7. **pages/admin/ContractorDetail/CustomersTab.jsx** (1 hardcoded string)
**Section**: `admin.contractors.customers`

Missing translations:
- "ID: {customer.id}"

**Suggested translation keys**:
```json
"admin": {
  "contractors": {
    "customers": {
      "customerId": "ID: {{id}}"
    }
  }
}
```

---

### 8. **pages/admin/Contractors.jsx** (1 hardcoded string)
**Section**: `admin.contractors`

Missing translations:
- "ID: {contractor.id}"

**Suggested translation keys**:
```json
"admin": {
  "contractors": {
    "contractorId": "ID: {{id}}"
  }
}
```

---

### 9. **pages/payments/PaymentConfiguration.jsx** (1 hardcoded string)
**Section**: `payment.configuration`

Missing translations:
- "USD, EUR, CAD"

**Suggested translation keys**:
```json
"payment": {
  "configuration": {
    "currencies": "USD, EUR, CAD"
  }
}
```

---

### 10. **pages/proposals/CreateProposal/ProposalSummary.jsx** (1 hardcoded string)
**Section**: `proposals.createProposal`

Missing translations:
- "Back"

**Note**: This might already exist in `common.back`, can reuse that key.

---

### 11. **pages/proposals/EditProposal.jsx** (1 hardcoded string)
**Section**: `proposals.edit`

Missing translations:
- "Basic Information"

**Suggested translation keys**:
```json
"proposals": {
  "edit": {
    "basicInformation": "Basic Information"
  }
}
```

---

### 12. **pages/settings/manufacturers/ManufacturersList.jsx** (1 hardcoded string)
**Section**: `settings.manufacturers.list`

Missing translations:
- "ID: {manufacturer.id}"

**Suggested translation keys**:
```json
"settings": {
  "manufacturers": {
    "list": {
      "manufacturerId": "ID: {{id}}"
    }
  }
}
```

---

### 13. **pages/settings/manufacturers/tabs/EditManufacturerTab.jsx** (1 hardcoded string)
**Section**: `settings.manufacturers.edit`

Missing translations:
- "Dear Manufacturer, Please find the attached order PDF..."

**Suggested translation keys**:
```json
"settings": {
  "manufacturers": {
    "edit": {
      "defaultEmailTemplate": "Dear Manufacturer, Please find the attached order PDF..."
    }
  }
}
```

---

### 14. **pages/settings/usersGroup/UserGroupList.jsx** (1 hardcoded string)
**Section**: `settings.userGroups`

Missing translations:
- "ID: {group.id}"

**Suggested translation keys**:
```json
"settings": {
  "userGroups": {
    "groupId": "ID: {{id}}"
  }
}
```

---

### 15. **components/ItemSelectionContent.jsx** (1 hardcoded string)
**Section**: `components.itemSelection`

Missing translations:
- "No custom items added yet"

**Suggested translation keys**:
```json
"components": {
  "itemSelection": {
    "noCustomItems": "No custom items added yet",
    "addCustomItem": "Add Custom Item"
  }
}
```

---

### 16. **components/ItemSelectionContentEdit.jsx** (1 hardcoded string)
**Section**: `components.itemSelection`

Same as above - "No custom items added yet"

---

### 17. **components/model/EditManufacturerModal.jsx** (1 hardcoded string)
**Section**: `modals.editManufacturer`

Missing translations:
- "Enabled"

**Suggested translation keys**:
```json
"modals": {
  "editManufacturer": {
    "enabled": "Enabled",
    "disabled": "Disabled"
  }
}
```

---

## TRANSLATION STRUCTURE RECOMMENDATIONS

### Organization by Section:

1. **common** - Shared across the app (buttons, actions, etc.)
2. **components** - Reusable components
3. **pages** - Page-specific translations
4. **modals** - Modal dialogs
5. **auth** - Authentication related
6. **settings** - Settings pages
7. **admin** - Admin features
8. **proposals** - Proposal management
9. **orders** - Order management
10. **customers** - Customer management
11. **payments** - Payment features

---

## NEXT STEPS

1. **Review this list** and decide on final translation key structure
2. **Add keys to `en.json`** manually following the suggested structure
3. **Update component files** to use `useTranslation` hook and `t()` function
4. **Add Spanish translations** to `es.json`
5. **Test all pages** to ensure translations work correctly

---

## IMPORTANT NOTES

- Use `{{variable}}` syntax for interpolation (not `{variable}`)
- Avoid duplicating keys that already exist in `common`
- Keep keys descriptive but concise
- Maintain consistent naming convention (camelCase for keys)
- Group related translations under the same parent object
