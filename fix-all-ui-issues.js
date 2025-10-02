const fs = require('fs');
const path = require('path');

// Files to fix
const files = [
  'C:\\njtake2\\njcabinets-main\\frontend\\src\\components\\CatalogTableEdit.js',
  'C:\\njtake2\\njcabinets-main\\frontend\\src\\components\\CatalogTable.js',
  'C:\\njtake2\\njcabinets-main\\frontend\\src\\pages\\settings\\manufacturers\\tabs\\CatalogMappingTab.jsx',
  'C:\\njtake2\\njcabinets-main\\frontend\\src\\pages\\public\\PublicProposalPage.jsx',
  'C:\\njtake2\\njcabinets-main\\frontend\\src\\pages\\payments\\PaymentCancel.jsx',
];

// Bootstrap class replacements
const bootstrapFixes = [
  { from: /className="([^"]*)text-muted([^"]*)"/g, to: (match, p1, p2) => `className="${p1}${p2}" style={{...style, color: 'var(--chakra-colors-gray-600)'}}` },
  { from: /className="([^"]*)fw-bold([^"]*)"/g, to: (match, p1, p2) => `className="${p1}${p2}" style={{...style, fontWeight: 'bold'}}` },
  { from: /className="([^"]*)fw-medium([^"]*)"/g, to: (match, p1, p2) => `className="${p1}${p2}" style={{...style, fontWeight: 'medium'}}` },
  { from: /className="([^"]*)text-success([^"]*)"/g, to: (match, p1, p2) => `className="${p1}${p2}" style={{...style, color: 'var(--chakra-colors-green-500)'}}` },
  { from: /className="([^"]*)text-danger([^"]*)"/g, to: (match, p1, p2) => `className="${p1}${p2}" style={{...style, color: 'var(--chakra-colors-red-500)'}}` },
  { from: /className="([^"]*)me-2([^"]*)"/g, to: (match, p1, p2) => `className="${p1}${p2}" style={{...style, marginRight: 'var(--chakra-space-2)'}}` },
  { from: /className="([^"]*)ms-2([^"]*)"/g, to: (match, p1, p2) => `className="${p1}${p2}" style={{...style, marginLeft: 'var(--chakra-space-2)'}}` },
];

// Fix disabled={readOnly} to isDisabled={readOnly}
const disabledFixes = [
  { from: /disabled=\{readOnly\}/g, to: 'isDisabled={readOnly}' },
];

console.log('UI Fix Script - Starting...\n');

files.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }

  console.log(`Processing: ${path.basename(file)}`);
  let content = fs.readFileSync(file, 'utf8');
  let changes = 0;

  // Apply disabled fixes
  disabledFixes.forEach(fix => {
    const matches = content.match(fix.from);
    if (matches) {
      content = content.replace(fix.from, fix.to);
      changes += matches.length;
      console.log(`  ✓ Fixed ${matches.length} disabled={readOnly} instances`);
    }
  });

  // Save if changes were made
  if (changes > 0) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`  ✅ Saved ${changes} changes\n`);
  } else {
    console.log(`  ℹ️  No changes needed\n`);
  }
});

console.log('✅ All fixes applied!');
