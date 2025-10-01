const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/pages/admin/ContractorDetail/ProposalsTab.jsx',
  'frontend/src/pages/admin/ContractorDetail/SettingsTab.jsx',
  'frontend/src/pages/admin/ContractorDetail/CustomersTab.jsx',
  'frontend/src/pages/orders/OrdersList.jsx',
  'frontend/src/pages/payments/PaymentsList.jsx',
  'frontend/src/pages/payments/PaymentCancel.jsx',
  'frontend/src/pages/payments/PaymentTest.jsx',
  'frontend/src/pages/customers/AddCustomerForm.jsx',
  'frontend/src/pages/customers/CustomerForm.jsx',
  'frontend/src/pages/profile/index.jsx',
  'frontend/src/pages/proposals/CreateProposal/ProposalSummary.jsx',
  'frontend/src/pages/proposals/ProposalEditor.jsx',
  'frontend/src/pages/public/PublicProposalPage.jsx',
  'frontend/src/pages/quotes/Create/CreateQuote.jsx',
  'frontend/src/pages/quotes/Create/QuoteEditor.jsx',
  'frontend/src/pages/quotes/CreateQuote/QuoteEditorWrapper.jsx',
  'frontend/src/pages/settings/globalMods/GlobalModsPage.jsx',
  'frontend/src/pages/settings/locations/CreateLocation.jsx',
  'frontend/src/pages/settings/manufacturers/ManufacturersForm.jsx',
  'frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx',
  'frontend/src/pages/settings/manufacturers/tabs/FilesHistoryTab.jsx',
  'frontend/src/pages/settings/manufacturers/tabs/TypesTab.jsx',
  'frontend/src/pages/settings/multipliers/EditManuMultiplier.jsx',
  'frontend/src/pages/settings/users/UserList.jsx',
  'frontend/src/pages/settings/usersGroup/CreateUserGroup.jsx',
  // Auth pages (keep customization but remove Bootstrap)
  'frontend/src/pages/auth/ForgotPasswordPage.jsx',
  'frontend/src/pages/auth/LoginPage.jsx',
  'frontend/src/pages/auth/RequestAccessPage.jsx',
  'frontend/src/pages/auth/ResetPasswordPage.jsx',
  'frontend/src/pages/auth/SignupPage.jsx',
];

// Bootstrap class patterns to remove or replace
const replacements = [
  // Display flex - remove completely as Chakra handles layout
  { pattern: / className="d-flex justify-content-between align-items-center"/g, replacement: '' },
  { pattern: / className="d-flex align-items-center justify-content-end"/g, replacement: '' },
  { pattern: / className="d-flex align-items-center"/g, replacement: '' },
  { pattern: / className="d-flex justify-content-center align-items-center"/g, replacement: '' },
  { pattern: / className="d-flex"/g, replacement: '' },

  // Display none/block - remove as Chakra uses display prop
  { pattern: / className="d-none d-md-block"/g, replacement: '' },
  { pattern: / className="d-md-none"/g, replacement: '' },
  { pattern: / className="d-none"/g, replacement: '' },
  { pattern: / className="d-block"/g, replacement: '' },

  // Text utilities - remove as Chakra uses Text component props
  { pattern: / className="text-center"/g, replacement: '' },
  { pattern: / className="text-muted"/g, replacement: '' },
  { pattern: / className="text-primary"/g, replacement: '' },
  { pattern: / className="text-success"/g, replacement: '' },
  { pattern: / className="text-warning"/g, replacement: '' },
  { pattern: / className="text-info"/g, replacement: '' },
  { pattern: / className="text-danger"/g, replacement: '' },
  { pattern: / className="fw-bold text-success"/g, replacement: '' },

  // Spacing utilities - remove as Chakra uses spacing props
  { pattern: / className="mb-0"/g, replacement: '' },
  { pattern: / className="mb-1"/g, replacement: '' },
  { pattern: / className="mb-2"/g, replacement: '' },
  { pattern: / className="mb-3"/g, replacement: '' },
  { pattern: / className="mb-4"/g, replacement: '' },
  { pattern: / className="mt-2"/g, replacement: '' },
  { pattern: / className="mt-3"/g, replacement: '' },
  { pattern: / className="me-1"/g, replacement: '' },
  { pattern: / className="me-2"/g, replacement: '' },
  { pattern: / className="me-3"/g, replacement: '' },
  { pattern: / className="ms-2"/g, replacement: '' },
  { pattern: / className="pt-3 border-top border-light"/g, replacement: '' },

  // Borders
  { pattern: / className="border-end"/g, replacement: '' },
  { pattern: / className="border-top"/g, replacement: '' },

  // Combined patterns - more complex
  { pattern: / className="me-2 mb-2"/g, replacement: '' },
  { pattern: / className="me-1 text-muted"/g, replacement: '' },
  { pattern: / className="me-2 text-muted"/g, replacement: '' },

  // Bootstrap grid classes - remove but keep in mind these need manual Chakra replacement
  { pattern: / className="row"/g, replacement: '' },
  { pattern: / className="col"/g, replacement: '' },
  { pattern: / className="col-12"/g, replacement: '' },
  { pattern: / className="col-md-6"/g, replacement: '' },
  { pattern: / className="col-md-8"/g, replacement: '' },
  { pattern: / className="col-md-4"/g, replacement: '' },
  { pattern: / className="col-lg-6"/g, replacement: '' },
  { pattern: / className="col-lg-8"/g, replacement: '' },
  { pattern: / className="col-lg-4"/g, replacement: '' },
  { pattern: / className="g-3"/g, replacement: '' },
  { pattern: / className="g-4"/g, replacement: '' },
  { pattern: / className="container"/g, replacement: '' },
  { pattern: / className="container-fluid"/g, replacement: '' },

  // ListItem patterns
  { pattern: / className="d-flex justify-content-between align-items-center border-0 px-0"/g, replacement: '' },

  // Complex combined patterns on HTML elements
  { pattern: / className="d-flex flex-wrap gap-3 text-muted"/g, replacement: '' },
  { pattern: / className="d-flex align-items-center mb-3"/g, replacement: '' },
  { pattern: / className="flex-grow-1"/g, replacement: '' },
  { pattern: / className="text-end"/g, replacement: '' },
  { pattern: / className="text-success mb-0"/g, replacement: '' },
  { pattern: / className="text-muted mb-2"/g, replacement: '' },
  { pattern: / className="fw-semibold"/g, replacement: '' },
  { pattern: / className="fw-bold"/g, replacement: '' },

  // Timeline/dynamic classes - more complex, need careful handling
  { pattern: /className=\{`timeline-icon bg-\$\{item\.color\} text-white rounded-circle d-flex align-items-center justify-content-center me-3`\}/g, replacement: '' },
];

let totalFixed = 0;
let filesModified = 0;

files.forEach(filePath => {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fileChanges = 0;

    replacements.forEach(({ pattern, replacement }) => {
      const matches = content.match(pattern);
      if (matches) {
        fileChanges += matches.length;
        content = content.replace(pattern, replacement);
      }
    });

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed ${fileChanges} patterns in ${path.basename(filePath)}`);
      totalFixed += fileChanges;
      filesModified++;
    } else {
      console.log(`- No changes needed in ${path.basename(filePath)}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n✅ Complete: Fixed ${totalFixed} Bootstrap class patterns across ${filesModified} files`);
