const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find ALL JSX files recursively
console.log('🔍 Finding all JSX files with potential Bootstrap conflicts...\n');

function findJsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory() && !file.includes('node_modules')) {
      findJsxFiles(filePath, fileList);
    } else if (file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

let files = findJsxFiles('frontend/src');
console.log(`Found ${files.length} JSX files to process\n`);

// Comprehensive list of ALL Bootstrap patterns to remove
const replacements = [
  // Display utilities
  { pattern: / className="d-flex justify-content-between align-items-center border-0 px-0"/g, replacement: '' },
  { pattern: / className="d-flex justify-content-between align-items-center border-0"/g, replacement: '' },
  { pattern: / className="d-flex justify-content-between align-items-center"/g, replacement: '' },
  { pattern: / className="d-flex align-items-center justify-content-end"/g, replacement: '' },
  { pattern: / className="d-flex align-items-center justify-content-between"/g, replacement: '' },
  { pattern: / className="d-flex align-items-center mb-3"/g, replacement: '' },
  { pattern: / className="d-flex align-items-center mb-2"/g, replacement: '' },
  { pattern: / className="d-flex align-items-center"/g, replacement: '' },
  { pattern: / className="d-flex justify-content-center align-items-center"/g, replacement: '' },
  { pattern: / className="d-flex justify-content-center"/g, replacement: '' },
  { pattern: / className="d-flex justify-content-end"/g, replacement: '' },
  { pattern: / className="d-flex justify-content-between"/g, replacement: '' },
  { pattern: / className="d-flex flex-wrap gap-3 text-muted"/g, replacement: '' },
  { pattern: / className="d-flex flex-wrap gap-2"/g, replacement: '' },
  { pattern: / className="d-flex flex-wrap"/g, replacement: '' },
  { pattern: / className="d-flex gap-2"/g, replacement: '' },
  { pattern: / className="d-flex gap-3"/g, replacement: '' },
  { pattern: / className="d-flex"/g, replacement: '' },
  { pattern: / className="d-none d-md-block"/g, replacement: '' },
  { pattern: / className="d-none d-lg-block"/g, replacement: '' },
  { pattern: / className="d-md-none"/g, replacement: '' },
  { pattern: / className="d-lg-none"/g, replacement: '' },
  { pattern: / className="d-none"/g, replacement: '' },
  { pattern: / className="d-block"/g, replacement: '' },
  { pattern: / className="d-inline-block"/g, replacement: '' },

  // Text utilities
  { pattern: / className="text-center"/g, replacement: '' },
  { pattern: / className="text-end"/g, replacement: '' },
  { pattern: / className="text-start"/g, replacement: '' },
  { pattern: / className="text-muted"/g, replacement: '' },
  { pattern: / className="text-primary"/g, replacement: '' },
  { pattern: / className="text-success"/g, replacement: '' },
  { pattern: / className="text-warning"/g, replacement: '' },
  { pattern: / className="text-info"/g, replacement: '' },
  { pattern: / className="text-danger"/g, replacement: '' },
  { pattern: / className="text-white"/g, replacement: '' },
  { pattern: / className="text-dark"/g, replacement: '' },
  { pattern: / className="text-body"/g, replacement: '' },
  { pattern: / className="text-muted mb-0"/g, replacement: '' },
  { pattern: / className="text-muted mb-2"/g, replacement: '' },
  { pattern: / className="text-muted mb-3"/g, replacement: '' },
  { pattern: / className="text-success mb-0"/g, replacement: '' },
  { pattern: / className="text-success mb-2"/g, replacement: '' },

  // Font weight
  { pattern: / className="fw-bold"/g, replacement: '' },
  { pattern: / className="fw-semibold"/g, replacement: '' },
  { pattern: / className="fw-normal"/g, replacement: '' },
  { pattern: / className="fw-light"/g, replacement: '' },
  { pattern: / className="fw-bold text-success"/g, replacement: '' },

  // Spacing utilities
  { pattern: / className="mb-0"/g, replacement: '' },
  { pattern: / className="mb-1"/g, replacement: '' },
  { pattern: / className="mb-2"/g, replacement: '' },
  { pattern: / className="mb-3"/g, replacement: '' },
  { pattern: / className="mb-4"/g, replacement: '' },
  { pattern: / className="mb-5"/g, replacement: '' },
  { pattern: / className="mt-0"/g, replacement: '' },
  { pattern: / className="mt-1"/g, replacement: '' },
  { pattern: / className="mt-2"/g, replacement: '' },
  { pattern: / className="mt-3"/g, replacement: '' },
  { pattern: / className="mt-4"/g, replacement: '' },
  { pattern: / className="mt-5"/g, replacement: '' },
  { pattern: / className="me-0"/g, replacement: '' },
  { pattern: / className="me-1"/g, replacement: '' },
  { pattern: / className="me-2"/g, replacement: '' },
  { pattern: / className="me-3"/g, replacement: '' },
  { pattern: / className="me-4"/g, replacement: '' },
  { pattern: / className="ms-0"/g, replacement: '' },
  { pattern: / className="ms-1"/g, replacement: '' },
  { pattern: / className="ms-2"/g, replacement: '' },
  { pattern: / className="ms-3"/g, replacement: '' },
  { pattern: / className="ms-4"/g, replacement: '' },
  { pattern: / className="p-0"/g, replacement: '' },
  { pattern: / className="p-1"/g, replacement: '' },
  { pattern: / className="p-2"/g, replacement: '' },
  { pattern: / className="p-3"/g, replacement: '' },
  { pattern: / className="p-4"/g, replacement: '' },
  { pattern: / className="px-0"/g, replacement: '' },
  { pattern: / className="px-1"/g, replacement: '' },
  { pattern: / className="px-2"/g, replacement: '' },
  { pattern: / className="px-3"/g, replacement: '' },
  { pattern: / className="px-4"/g, replacement: '' },
  { pattern: / className="py-0"/g, replacement: '' },
  { pattern: / className="py-1"/g, replacement: '' },
  { pattern: / className="py-2"/g, replacement: '' },
  { pattern: / className="py-3"/g, replacement: '' },
  { pattern: / className="py-4"/g, replacement: '' },
  { pattern: / className="pt-3 border-top border-light"/g, replacement: '' },
  { pattern: / className="pt-3 border-top"/g, replacement: '' },

  // Combined spacing
  { pattern: / className="me-2 mb-2"/g, replacement: '' },
  { pattern: / className="me-1 text-muted"/g, replacement: '' },
  { pattern: / className="me-2 text-muted"/g, replacement: '' },
  { pattern: / className="me-3 text-muted"/g, replacement: '' },

  // Border utilities
  { pattern: / className="border-0"/g, replacement: '' },
  { pattern: / className="border-top"/g, replacement: '' },
  { pattern: / className="border-end"/g, replacement: '' },
  { pattern: / className="border-bottom"/g, replacement: '' },
  { pattern: / className="border-start"/g, replacement: '' },
  { pattern: / className="border"/g, replacement: '' },
  { pattern: / className="border-light"/g, replacement: '' },

  // Flex utilities
  { pattern: / className="flex-grow-1"/g, replacement: '' },
  { pattern: / className="flex-shrink-0"/g, replacement: '' },
  { pattern: / className="flex-wrap"/g, replacement: '' },
  { pattern: / className="align-items-center"/g, replacement: '' },
  { pattern: / className="justify-content-center"/g, replacement: '' },
  { pattern: / className="justify-content-between"/g, replacement: '' },
  { pattern: / className="justify-content-end"/g, replacement: '' },

  // Gap utilities
  { pattern: / className="gap-1"/g, replacement: '' },
  { pattern: / className="gap-2"/g, replacement: '' },
  { pattern: / className="gap-3"/g, replacement: '' },
  { pattern: / className="gap-4"/g, replacement: '' },

  // Grid system
  { pattern: / className="row"/g, replacement: '' },
  { pattern: / className="col"/g, replacement: '' },
  { pattern: / className="col-12"/g, replacement: '' },
  { pattern: / className="col-6"/g, replacement: '' },
  { pattern: / className="col-4"/g, replacement: '' },
  { pattern: / className="col-3"/g, replacement: '' },
  { pattern: / className="col-md-6"/g, replacement: '' },
  { pattern: / className="col-md-8"/g, replacement: '' },
  { pattern: / className="col-md-4"/g, replacement: '' },
  { pattern: / className="col-lg-6"/g, replacement: '' },
  { pattern: / className="col-lg-8"/g, replacement: '' },
  { pattern: / className="col-lg-4"/g, replacement: '' },
  { pattern: / className="g-2"/g, replacement: '' },
  { pattern: / className="g-3"/g, replacement: '' },
  { pattern: / className="g-4"/g, replacement: '' },
  { pattern: / className="container"/g, replacement: '' },
  { pattern: / className="container-fluid"/g, replacement: '' },

  // Width utilities
  { pattern: / className="w-100"/g, replacement: '' },
  { pattern: / className="w-50"/g, replacement: '' },
  { pattern: / className="h-100"/g, replacement: '' },

  // Position utilities
  { pattern: / className="position-relative"/g, replacement: '' },
  { pattern: / className="position-absolute"/g, replacement: '' },

  // Overflow utilities
  { pattern: / className="overflow-hidden"/g, replacement: '' },
  { pattern: / className="overflow-auto"/g, replacement: '' },

  // Single quotes versions (for auth pages and other places)
  { pattern: / className='text-center'/g, replacement: '' },
  { pattern: / className='text-muted'/g, replacement: '' },
  { pattern: / className='text-primary'/g, replacement: '' },
  { pattern: / className='text-success'/g, replacement: '' },
  { pattern: / className='text-warning'/g, replacement: '' },
  { pattern: / className='text-danger'/g, replacement: '' },

  // Complex combined patterns
  { pattern: / className="border-0 shadow-sm"/g, replacement: '' },
  { pattern: / className="border-top pt-3 mt-3"/g, replacement: '' },
  { pattern: / className="d-flex justify-content-between mb-2"/g, replacement: '' },
  { pattern: / className="d-flex justify-content-between border-top pt-2"/g, replacement: '' },
  { pattern: / className="text-center border-end"/g, replacement: '' },
  { pattern: / className="lead mb-4"/g, replacement: '' },
  { pattern: / className="text-center mb-4"/g, replacement: '' },
  { pattern: / className="text-center mt-4"/g, replacement: '' },
  { pattern: / className="mb-2 fw-bold"/g, replacement: '' },
  { pattern: / className="text-muted mb-4"/g, replacement: '' },
  { pattern: / className="text-muted mb-2 small"/g, replacement: '' },
  { pattern: / className="text-muted small"/g, replacement: '' },
  { pattern: / className="text-muted small mb-0"/g, replacement: '' },
  { pattern: / className="d-flex justify-content-between align-items-center mb-4"/g, replacement: '' },
  { pattern: / className="small text-decoration-none"/g, replacement: '' },
  { pattern: / className="fw-semibold text-decoration-none"/g, replacement: '' },
  { pattern: / className="mb-1 fw-medium text-muted small"/g, replacement: '' },
  { pattern: / className="list-unstyled text-muted small mb-0"/g, replacement: '' },
  { pattern: / className="list-unstyled"/g, replacement: '' },

  // Link text decoration (not Bootstrap but common)
  { pattern: / className="text-decoration-none"/g, replacement: '' },

  // List utilities
  { pattern: / className="list-inline"/g, replacement: '' },
  { pattern: / className="list-inline-item"/g, replacement: '' },

  // Card utilities
  { pattern: / className="card-body"/g, replacement: '' },
  { pattern: / className="card-header"/g, replacement: '' },
  { pattern: / className="card"/g, replacement: '' },

  // Form utilities
  { pattern: / className="form-control"/g, replacement: '' },
  { pattern: / className="form-label"/g, replacement: '' },
  { pattern: / className="form-check"/g, replacement: '' },

  // Table utilities
  { pattern: / className="table-responsive"/g, replacement: '' },
  { pattern: / className="table"/g, replacement: '' },

  // Rounded utilities
  { pattern: / className="rounded"/g, replacement: '' },
  { pattern: / className="rounded-circle"/g, replacement: '' },

  // Shadow utilities
  { pattern: / className="shadow"/g, replacement: '' },
  { pattern: / className="shadow-sm"/g, replacement: '' },
  { pattern: / className="shadow-lg"/g, replacement: '' },

  // More complex combined patterns with gap
  { pattern: / className="d-flex gap-1 mt-1"/g, replacement: '' },
  { pattern: / className="d-flex gap-1 flex-wrap"/g, replacement: '' },
  { pattern: / className="d-flex gap-1"/g, replacement: '' },
  { pattern: / className="d-flex gap-2"/g, replacement: '' },
  { pattern: / className="d-flex gap-3"/g, replacement: '' },
  { pattern: / className="d-flex align-items-center gap-2"/g, replacement: '' },
  { pattern: / className="d-flex justify-content-center gap-2"/g, replacement: '' },
  { pattern: / className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded"/g, replacement: '' },

  // Small text
  { pattern: / className="small text-muted"/g, replacement: '' },
  { pattern: / className="small text-decoration-none"/g, replacement: '' },
  { pattern: / className="text-muted d-block mb-2"/g, replacement: '' },
  { pattern: / className="text-danger small align-self-center"/g, replacement: '' },
  { pattern: / className="text-danger small mt-1"/g, replacement: '' },
  { pattern: / className="small"/g, replacement: '' },

  // Font weight + text combinations
  { pattern: / className="fw-medium text-dark text-truncate"/g, replacement: '' },
  { pattern: / className="fw-medium text-dark"/g, replacement: '' },
  { pattern: / className="fw-medium"/g, replacement: '' },
  { pattern: / className="fw-bold text-dark"/g, replacement: '' },

  // Card combinations
  { pattern: / className="card-title mb-1 fw-bold"/g, replacement: '' },
  { pattern: / className="card-title"/g, replacement: '' },
  { pattern: / className="card-header d-flex justify-content-between align-items-center"/g, replacement: '' },
  { pattern: / className="card-header"/g, replacement: '' },

  // Complex layouts
  { pattern: / className="rounded-pill d-flex align-items-center px-3"/g, replacement: '' },
  { pattern: / className="border rounded p-2 d-flex align-items-start position-relative"/g, replacement: '' },
  { pattern: / className="flex-grow-1 d-flex align-items-center justify-content-center"/g, replacement: '' },
  { pattern: / className="form-check-label d-flex justify-content-between align-items-center w-100"/g, replacement: '' },
  { pattern: / className="text-center text-muted p-3 border rounded mt-2"/g, replacement: '' },
  { pattern: / className="text-center text-muted p-4 border rounded"/g, replacement: '' },
  { pattern: / className="w-100 px-2 py-2 d-flex align-items-center justify-content-center"/g, replacement: '' },
  { pattern: / className="flex-grow-1 min-width-0"/g, replacement: '' },
  { pattern: / className="min-width-0"/g, replacement: '' },
  { pattern: / className="mb-0 d-flex align-items-center gap-2"/g, replacement: '' },

  // Spinner
  { pattern: / className="spinner-border spinner-border-sm me-2"/g, replacement: '' },
  { pattern: / className="spinner-border spinner-border-sm"/g, replacement: '' },
  { pattern: / className="spinner-border"/g, replacement: '' },

  // Rounded utilities with combinations
  { pattern: / className="rounded-pill"/g, replacement: '' },
  { pattern: / className="border rounded"/g, replacement: '' },
  { pattern: / className="rounded"/g, replacement: '' },

  // Form check
  { pattern: / className="form-check-label"/g, replacement: '' },
  { pattern: / className="form-check-input"/g, replacement: '' },

  // Opacity
  { pattern: / className="mb-3 opacity-25"/g, replacement: '' },
  { pattern: / className="opacity-25"/g, replacement: '' },
  { pattern: / className="opacity-50"/g, replacement: '' },
  { pattern: / className="opacity-75"/g, replacement: '' },

  // Text truncate
  { pattern: / className="text-truncate"/g, replacement: '' },

  // Align self
  { pattern: / className="align-self-center"/g, replacement: '' },
  { pattern: / className="align-self-start"/g, replacement: '' },
  { pattern: / className="align-self-end"/g, replacement: '' },

  // Col grid patterns
  { pattern: / className="col-md-3"/g, replacement: '' },
  { pattern: / className="col-md-4"/g, replacement: '' },
  { pattern: / className="col-md-6"/g, replacement: '' },
  { pattern: / className="col-md-8"/g, replacement: '' },
  { pattern: / className="col-md-9"/g, replacement: '' },
];

let totalFixed = 0;
let filesModified = 0;

files.forEach(filePath => {
  try {
    if (!fs.existsSync(filePath)) {
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
      console.log(`✓ Fixed ${fileChanges} patterns in ${path.relative('frontend/src', filePath)}`);
      totalFixed += fileChanges;
      filesModified++;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n✅ Complete: Fixed ${totalFixed} Bootstrap patterns across ${filesModified} files`);
