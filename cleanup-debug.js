const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/pages/proposals/CreateProposalForm.jsx',
  'frontend/src/pages/proposals/Proposals.jsx',
  'frontend/src/components/ProposalAcceptanceModal.jsx',
  'frontend/src/store/slices/proposalSlice.js'
];

function cleanDebugFromFile(filePath) {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalLength = content.length;

  // Remove all console statements containing [DEBUG]
  content = content.replace(/\s*console\.(log|warn|error)\('.*?\[DEBUG\].*?[\s\S]*?\);/gm, '');

  // Also remove multi-line debug console statements
  content = content.replace(/\s*console\.(log|warn|error)\('.*?\[DEBUG\][\s\S]*?\}\);/gm, '');

  // Clean up any extra whitespace
  content = content.replace(/\n\n\n+/g, '\n\n');

  if (content.length !== originalLength) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Cleaned debug statements from: ${filePath}`);
    console.log(`   Reduced size by ${originalLength - content.length} characters`);
  } else {
    console.log(`ℹ️  No debug statements found in: ${filePath}`);
  }
}

files.forEach(cleanDebugFromFile);

console.log('\n🎉 Final debug cleanup completed!');
