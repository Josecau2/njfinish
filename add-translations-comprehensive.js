#!/usr/bin/env node
/**
 * Comprehensive Translation Generator
 * Scans files and adds comprehensive translation keys
 * Usage: node add-translations-comprehensive.js
 */

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, 'frontend/src');
const LOCALE_FILE_EN = path.join(__dirname, 'frontend/src/i18n/locales/en.json');
const REPORT_FILE = path.join(__dirname, 'translation-audit-report.json');

// Load existing translations
let translations = JSON.parse(fs.readFileSync(LOCALE_FILE_EN, 'utf8'));
let report = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8'));

// Comprehensive mapping of hardcoded strings to translation paths
const translationMappings = {};

// Helper to ensure path exists in object
function ensurePath(obj, pathStr) {
  const parts = pathStr.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part]) {
      current[part] = {};
    }
    current = current[part];
  }

  return current;
}

// Helper to set value at path
function setAtPath(obj, pathStr, value) {
  const parts = pathStr.split('.');
  const parent = ensurePath(obj, pathStr);
  parent[parts[parts.length - 1]] = value;
}

// Helper to check if path exists
function hasPath(obj, pathStr) {
  const parts = pathStr.split('.');
  let current = obj;

  for (const part of parts) {
    if (!current || !current[part]) return false;
    current = current[part];
  }

  return true;
}

// Generate safe key from string
function toSafeKey(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 50);
}

// Add comprehensive translations based on audit
console.log('📝 Adding comprehensive translations...\n');

// Common component translations
if (!translations.components) translations.components = {};

// PDF Viewer
if (!translations.components.pdfViewer) {
  translations.components.pdfViewer = {
    reset: "Reset",
    page: "Page",
    loadingDocument: "Loading PDF document...",
    loadingPage: "Loading page...",
    loadFailed: "Failed to load page",
    noPreview: "Preview is not available for this file type.",
    close: "Close"
  };
}

// Notifications
if (!translations.components.notifications) {
  translations.components.notifications = {
    title: "Notifications",
    markAllRead: "Mark all read",
    noNew: "No new notifications"
  };
}

// Error boundaries
if (!translations.components.errors) {
  translations.components.errors = {
    applicationError: "The application encountered an error. Please refresh to try again.",
    pageError: "Something went wrong while loading this page.",
    tryAgain: "Try again",
    refresh: "Refresh page"
  };
}

// Language Switcher
if (!translations.components.languageSwitcher) {
  translations.components.languageSwitcher = {
    selectLanguage: "Select language",
    english: "English",
    spanish: "Spanish"
  };
}

// Loader
if (!translations.components.loader) {
  translations.components.loader = {
    loading: "Loading…",
    pleaseWait: "Please wait..."
  };
}

// Style Merger
if (!translations.components.styleMerger) {
  translations.components.styleMerger = {
    merge: "Merge",
    from: "From",
    into: "Into",
    selectStyles: "Select styles to merge",
    sourceStyle: "Source style",
    targetStyle: "Target style"
  };
}

// File Viewer Modal - extend existing
if (!translations.modals) translations.modals = {};
if (!translations.modals.fileViewer) {
  translations.modals.fileViewer = {
    title: "File Viewer",
    close: "Close",
    noPreview: "Preview is not available for this file type.",
    loading: "Loading file..."
  };
}

// Auth - Sign Up
if (!translations.auth.signUp) {
  translations.auth.signUp = {
    title: "Sign Up",
    subtitle: "Create your account to get started.",
    alreadyHaveAccount: "Already have an account?",
    signInLink: "Sign in here",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    companyName: "Company Name",
    phone: "Phone Number",
    submit: "Create Account",
    submitting: "Creating account...",
    success: "Account created successfully!",
    termsAgree: "I agree to the terms and conditions"
  };
}

// Calendar
if (!translations.calendar) {
  translations.calendar = {
    title: "Calendar",
    noEvents: "No events found",
    addEvent: "Add Event",
    today: "Today",
    month: "Month",
    week: "Week",
    day: "Day",
    agenda: "Agenda"
  };
}

// Settings - Manufacturers - Catalog Mapping (comprehensive)
if (!translations.settings) translations.settings = {};
if (!translations.settings.manufacturers) translations.settings.manufacturers = {};
if (!translations.settings.manufacturers.catalogMapping) {
  translations.settings.manufacturers.catalogMapping = {
    title: "Catalog Mapping",
    assign: "Assign",
    selectAll: "Select All ({{count}} items)",
    price: "Price",
    type: "Type",
    style: "Style",
    applyingAssemblyCost: "Applying assembly cost...",
    assemblyFee: "Assembly Fee",
    assemblyFeeSaved: "Assembly cost saved successfully",
    selectItems: "Select items to assign",
    bulkUpdate: "Bulk Update",
    updateSelected: "Update Selected",
    clearSelection: "Clear Selection",
    itemsSelected: "{{count}} items selected",
    actions: {
      assignType: "Assign Type",
      assignStyle: "Assign Style",
      updatePrice: "Update Price",
      setAssemblyFee: "Set Assembly Fee"
    },
    placeholders: {
      searchItems: "Search catalog items...",
      selectType: "Select type...",
      selectStyle: "Select style...",
      enterPrice: "Enter price..."
    }
  };
}

// Settings - Manufacturers - Types Tab
if (!translations.settings.manufacturers.typesTab) {
  translations.settings.manufacturers.typesTab = {
    updateMultiple: "Update {{count}} Types",
    renameType: "Rename Type",
    changeCategory: "Change Type Category",
    bulkEditInstructions: "Edit the following fields for the selected {{count}} types. Leave fields empty to keep existing values.",
    note: "Note:",
    noteDescription: "Changes will apply to all selected types",
    currentType: "Current Type",
    newType: "New Type",
    category: "Category",
    applyChanges: "Apply Changes",
    cancel: "Cancel"
  };
}

// Settings - Multipliers
if (!translations.settings.multipliers) {
  translations.settings.multipliers = {
    title: "Manufacturer Multipliers",
    edit: {
      title: "Edit Multiplier",
      saveChanges: "Save Changes",
      cancel: "Cancel"
    },
    fields: {
      manufacturerName: "Manufacturer Name",
      manufacturerEmail: "Manufacturer Email",
      multiplier: "Multiplier",
      namePlaceholder: "Enter manufacturer name",
      emailPlaceholder: "Enter manufacturer email",
      multiplierPlaceholder: "Enter multiplier"
    }
  };
}

// Settings - User Groups
if (!translations.settings.userGroups) {
  translations.settings.userGroups = {
    title: "User Groups",
    list: {
      id: "ID",
      name: "Name",
      description: "Description",
      members: "Members",
      actions: "Actions"
    },
    itemId: "ID: {{id}}"
  };
}

// Admin - Contractors
if (!translations.admin) translations.admin = {};
if (!translations.admin.contractors) {
  translations.admin.contractors = {
    title: "Contractors",
    list: {
      id: "ID",
      name: "Contractor Name",
      email: "Email",
      status: "Status",
      actions: "Actions"
    },
    itemId: "ID: {{id}}",
    details: {
      title: "Contractor Details",
      overview: "Overview",
      proposals: "Proposals",
      customers: "Customers",
      settings: "Settings"
    },
    customersTab: {
      title: "Customers",
      customerId: "ID: {{id}}"
    }
  };
}

// Payment Configuration
if (!translations.payment) translations.payment = {};
if (!translations.payment.configuration) {
  translations.payment.configuration = {
    title: "Payment Configuration",
    currencies: "USD, EUR, CAD",
    gateway: "Payment Gateway",
    testMode: "Test Mode",
    liveMode: "Live Mode"
  };
}

// Proposals
if (!translations.proposals) translations.proposals = {};
if (!translations.proposals.createProposal) {
  translations.proposals.createProposal = {
    title: "Create Proposal",
    back: "Back",
    next: "Next",
    summary: {
      title: "Proposal Summary",
      basicInformation: "Basic Information"
    }
  };
}

// Edit Manufacturer Modal
if (!translations.modals.editManufacturer) {
  translations.modals.editManufacturer = {
    title: "Edit Manufacturer",
    cancelAria: "Cancel editing manufacturer",
    saveAria: "Save manufacturer changes",
    fields: {
      name: "Manufacturer Name",
      email: "Email",
      enabled: "Enabled",
      active: "Active"
    }
  };
}

// Resources
if (!translations.resources) {
  translations.resources = {
    title: "Resources",
    search: "Search resources...",
    noResults: "No resources found",
    categories: "Categories",
    allCategories: "All Categories"
  };
}

// Dashboard
if (!translations.dashboard) {
  translations.dashboard = {
    title: "Dashboard",
    welcome: "Welcome to {{appName}}",
    overview: "Overview",
    recentActivity: "Recent Activity",
    quickActions: "Quick Actions"
  };
}

// Contact
if (!translations.contact) {
  translations.contact = {
    title: "Contact Us",
    form: {
      name: "Name",
      email: "Email",
      subject: "Subject",
      message: "Message",
      send: "Send Message",
      sending: "Sending..."
    }
  };
}

// 3D Kitchen
if (!translations.kitchen3d) {
  translations.kitchen3d = {
    title: "3D Kitchen Designer",
    comingSoon: {
      title: "Coming Soon",
      description: "The 3D Kitchen Designer feature is currently under development.",
      notify: "Notify me when available"
    }
  };
}

// Login Preview (customization)
if (!translations.settings.customization) {
  translations.settings.customization = {
    title: "Customization",
    loginPreview: {
      title: "Login Page Preview",
      sampleData: {
        firstName: "Jane",
        lastName: "Doe",
        city: "City",
        businessName: "Your business name"
      },
      forgotPassword: "Forgot password?"
    }
  };
}

// Orders
if (!translations.orders) {
  translations.orders = {
    title: "Orders",
    myOrders: "My Orders",
    allOrders: "All Orders",
    list: {
      orderId: "Order ID",
      customer: "Customer",
      date: "Date",
      status: "Status",
      total: "Total",
      actions: "Actions"
    },
    details: {
      title: "Order Details",
      information: "Order Information",
      items: "Items",
      summary: "Summary"
    }
  };
}

// Customers
if (!translations.customers) {
  translations.customers = {
    title: "Customers",
    addCustomer: "Add Customer",
    editCustomer: "Edit Customer",
    list: {
      id: "ID",
      name: "Name",
      email: "Email",
      phone: "Phone",
      actions: "Actions"
    },
    form: {
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email",
      phone: "Phone",
      address: "Address",
      city: "City",
      state: "State",
      zip: "ZIP Code",
      notes: "Notes"
    }
  };
}

// Save updated translations
console.log('💾 Saving translations to en.json...\n');

// Create backup
const backupPath = LOCALE_FILE_EN + '.backup-' + Date.now();
fs.copyFileSync(LOCALE_FILE_EN, backupPath);

// Write updated translations
fs.writeFileSync(LOCALE_FILE_EN, JSON.stringify(translations, null, 2), 'utf8');

console.log('✅ Translation keys added successfully!\n');
console.log(`📄 Backup created: ${path.basename(backupPath)}`);
console.log(`📄 Updated: ${path.basename(LOCALE_FILE_EN)}`);

// Generate summary
const newSections = [
  'components.pdfViewer',
  'components.notifications',
  'components.errors',
  'components.languageSwitcher',
  'components.loader',
  'components.styleMerger',
  'modals.fileViewer',
  'auth.signUp',
  'calendar',
  'settings.manufacturers.catalogMapping',
  'settings.manufacturers.typesTab',
  'settings.multipliers',
  'settings.userGroups',
  'admin.contractors',
  'payment.configuration',
  'proposals.createProposal',
  'modals.editManufacturer',
  'resources',
  'dashboard',
  'contact',
  'kitchen3d',
  'orders',
  'customers'
];

console.log('\n📊 Summary of additions:');
console.log('═══════════════════════════════════════════════════════════');
newSections.forEach(section => {
  console.log(`✓ ${section}`);
});
console.log('═══════════════════════════════════════════════════════════\n');

console.log('📝 Next Steps:');
console.log('1. Review the updated en.json file');
console.log('2. Update component files to use the new translation keys');
console.log('3. Update es.json with Spanish translations');
console.log('4. Test the application to ensure all translations work\n');

process.exit(0);
