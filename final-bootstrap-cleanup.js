const fs = require('fs');
const path = require('path');

console.log('🔍 Final Bootstrap cleanup - handling all remaining patterns...\n');

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

// More aggressive pattern matching - catches className="..." anywhere
const replacements = [
  // Complex d-flex combinations (most specific first)
  { pattern: /className="container-fluid vh-100 d-flex p-0"/g, replacement: 'className=""' },
  { pattern: /className="col-md-6 d-flex flex-column justify-content-center align-items-center p-5"/g, replacement: 'className="col-md-6"' },
  { pattern: /className="col-md-6 text-white d-flex flex-column justify-content-center align-items-center login-right-panel"/g, replacement: 'className="col-md-6 text-white login-right-panel"' },
  { pattern: /className="rounded-circle d-flex align-items-center justify-content-center me-3"/g, replacement: 'className="rounded-circle"' },
  { pattern: /className="d-flex align-items-center gap-3"/g, replacement: 'className=""' },
  { pattern: /className="d-flex align-items-center justify-content-center"/g, replacement: 'className=""' },
  { pattern: /className="d-flex gap-3 justify-content-end form-buttons"/g, replacement: 'className="form-buttons"' },
  { pattern: /className="d-flex justify-content-end gap-2"/g, replacement: 'className=""' },
  { pattern: /className="d-flex justify-content-md-end align-items-center gap-3"/g, replacement: 'className=""' },
  { pattern: /className="d-flex justify-content-between align-items-start mb-3"/g, replacement: 'className=""' },
  { pattern: /className="d-flex justify-content-between align-items-center border-0 px-0"/g, replacement: 'className=""' },
  { pattern: /className="d-flex justify-content-between align-items-center border-0"/g, replacement: 'className=""' },
  { pattern: /className="d-flex justify-content-between align-items-center"/g, replacement: 'className=""' },
  { pattern: /className="d-flex align-items-center justify-content-end"/g, replacement: 'className=""' },
  { pattern: /className="d-flex align-items-center justify-content-between"/g, replacement: 'className=""' },
  { pattern: /className="d-flex align-items-center mb-3"/g, replacement: 'className=""' },
  { pattern: /className="d-flex align-items-center mb-2"/g, replacement: 'className=""' },
  { pattern: /className="d-flex align-items-center"/g, replacement: 'className=""' },
  { pattern: /className="d-flex justify-content-center align-items-center"/g, replacement: 'className=""' },
  { pattern: /className="d-flex justify-content-center"/g, replacement: 'className=""' },
  { pattern: /className="d-flex justify-content-end"/g, replacement: 'className=""' },
  { pattern: /className="d-flex justify-content-between"/g, replacement: 'className=""' },
  { pattern: /className="d-flex flex-column"/g, replacement: 'className=""' },
  { pattern: /className="d-flex flex-wrap gap-3 text-muted"/g, replacement: 'className=""' },
  { pattern: /className="d-flex flex-wrap gap-2"/g, replacement: 'className=""' },
  { pattern: /className="d-flex flex-wrap"/g, replacement: 'className=""' },
  { pattern: /className="d-flex gap-2"/g, replacement: 'className=""' },
  { pattern: /className="d-flex gap-3"/g, replacement: 'className=""' },
  { pattern: /className="d-flex gap-1"/g, replacement: 'className=""' },
  { pattern: /className="d-flex"/g, replacement: 'className=""' },

  // Display utilities
  { pattern: /className="d-none d-md-block"/g, replacement: 'className=""' },
  { pattern: /className="d-none d-lg-block"/g, replacement: 'className=""' },
  { pattern: /className="d-md-none"/g, replacement: 'className=""' },
  { pattern: /className="d-lg-none"/g, replacement: 'className=""' },
  { pattern: /className="d-block d-md-none"/g, replacement: 'className=""' },
  { pattern: /className="d-none"/g, replacement: 'className=""' },
  { pattern: /className="d-block"/g, replacement: 'className=""' },
  { pattern: /className="d-inline-block"/g, replacement: 'className=""' },

  // Text utilities
  { pattern: /className="text-center mb-\d+"/g, replacement: 'className=""' },
  { pattern: /className="text-center text-muted"/g, replacement: 'className=""' },
  { pattern: /className="text-center"/g, replacement: 'className=""' },
  { pattern: /className="text-muted mb-\d+"/g, replacement: 'className=""' },
  { pattern: /className="text-muted small"/g, replacement: 'className=""' },
  { pattern: /className="text-muted"/g, replacement: 'className=""' },
  { pattern: /className="text-primary"/g, replacement: 'className=""' },
  { pattern: /className="text-success"/g, replacement: 'className=""' },
  { pattern: /className="text-danger"/g, replacement: 'className=""' },
  { pattern: /className="text-warning"/g, replacement: 'className=""' },
  { pattern: /className="text-truncate"/g, replacement: 'className=""' },
  { pattern: /className="text-end"/g, replacement: 'className=""' },

  // Margin/Padding
  { pattern: /className="mb-\d+"/g, replacement: 'className=""' },
  { pattern: /className="mt-\d+"/g, replacement: 'className=""' },
  { pattern: /className="ms-\d+"/g, replacement: 'className=""' },
  { pattern: /className="me-\d+"/g, replacement: 'className=""' },
  { pattern: /className="m-\d+"/g, replacement: 'className=""' },
  { pattern: /className="p-\d+"/g, replacement: 'className=""' },
  { pattern: /className="px-\d+"/g, replacement: 'className=""' },
  { pattern: /className="py-\d+"/g, replacement: 'className=""' },
  { pattern: /className="pt-\d+"/g, replacement: 'className=""' },
  { pattern: /className="pb-\d+"/g, replacement: 'className=""' },

  // Grid system
  { pattern: /className="row g-\d+"/g, replacement: 'className=""' },
  { pattern: /className="row"/g, replacement: 'className=""' },
  { pattern: /className="col-md-\d+ mb-\d+"/g, replacement: 'className=""' },
  { pattern: /className="col-lg-\d+ mb-\d+"/g, replacement: 'className=""' },
  { pattern: /className="col-\d+"/g, replacement: 'className=""' },
  { pattern: /className="container-fluid"/g, replacement: 'className=""' },

  // Borders
  { pattern: /className="border-\w+ border-\d+"/g, replacement: 'className=""' },
  { pattern: /className="border-top"/g, replacement: 'className=""' },
  { pattern: /className="border-bottom"/g, replacement: 'className=""' },
  { pattern: /className="border-start"/g, replacement: 'className=""' },
  { pattern: /className="border-end"/g, replacement: 'className=""' },
  { pattern: /className="border-0"/g, replacement: 'className=""' },
  { pattern: /className="border"/g, replacement: 'className=""' },

  // Font weight
  { pattern: /className="fw-bold"/g, replacement: 'className=""' },
  { pattern: /className="fw-semibold"/g, replacement: 'className=""' },
  { pattern: /className="fw-medium"/g, replacement: 'className=""' },
  { pattern: /className="fw-normal"/g, replacement: 'className=""' },

  // Other utilities
  { pattern: /className="rounded-circle"/g, replacement: 'className=""' },
  { pattern: /className="rounded"/g, replacement: 'className=""' },
  { pattern: /className="shadow-sm"/g, replacement: 'className=""' },
  { pattern: /className="shadow"/g, replacement: 'className=""' },
  { pattern: /className="w-100"/g, replacement: 'className=""' },
  { pattern: /className="h-100"/g, replacement: 'className=""' },
  { pattern: /className="vh-100"/g, replacement: 'className=""' },
  { pattern: /className="small"/g, replacement: 'className=""' },
  { pattern: /className="form-buttons"/g, replacement: 'className=""' },

  // Clean up empty className
  { pattern: / className=""/g, replacement: '' },
];

let totalFixed = 0;
let filesModified = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  let fileChanged = false;

  replacements.forEach(({ pattern, replacement }) => {
    if (pattern.test(newContent)) {
      newContent = newContent.replace(pattern, replacement);
      fileChanged = true;
      totalFixed++;
    }
  });

  if (fileChanged) {
    fs.writeFileSync(file, newContent);
    filesModified++;
    const relPath = path.relative('frontend/src', file);
    console.log(`✅ Fixed: ${relPath}`);
  }
});

console.log(`\n✅ Complete: Fixed ${totalFixed} Bootstrap patterns across ${filesModified} files`);
