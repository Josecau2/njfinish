const fs = require('fs');
const path = require('path');

// Find files with fontSize= in style objects
const filesToFix = [
  'frontend/src/pages/auth/RequestAccessPage.jsx',
  'frontend/src/pages/settings/manufacturers/EditManufacturer.jsx',
  'frontend/src/components/DataTable/ResponsiveTable.jsx',
  'frontend/src/pages/customers/Customers_broken.jsx',
  'frontend/src/pages/customers/Customers_fixed.jsx',
  'frontend/src/pages/proposals/CreateProposal/ProposalSummary.jsx'
];

let totalFixes = 0;

filesToFix.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`⚠️  Skipping ${file} - file not found`);
    return;
  }

  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Fix fontSize= to fontSize: in style objects
  content = content.replace(/style=\{\{\s*([^}]*?)fontSize="([^"]+)"([^}]*?)\}\}/g, (match, before, value, after) => {
    return `style={{ ${before}fontSize: "${value}"${after}}}`;
  });

  // Fix color= to color: in style objects
  content = content.replace(/style=\{\{\s*([^}]*?)color="([^"]+)"([^}]*?)\}\}/g, (match, before, value, after) => {
    return `style={{ ${before}color: "${value}"${after}}}`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
    totalFixes++;
  }
});

console.log(`\n✅ Fixed ${totalFixes} files with style object syntax errors`);
