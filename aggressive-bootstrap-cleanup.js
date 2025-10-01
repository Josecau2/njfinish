const fs = require('fs');
const path = require('path');

console.log('🔍 Aggressive Bootstrap cleanup - removing ALL Bootstrap patterns...\n');

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

// Helper function to remove Bootstrap classes from a className string
function removeBootstrapClasses(classNameStr) {
  const bootstrapPatterns = [
    /\bd-flex\b/g,
    /\bd-none\b/g,
    /\bd-block\b/g,
    /\bd-inline-block\b/g,
    /\bd-md-none\b/g,
    /\bd-md-block\b/g,
    /\bd-lg-none\b/g,
    /\bd-lg-block\b/g,
    /\bflex-column\b/g,
    /\bflex-row\b/g,
    /\bflex-wrap\b/g,
    /\bjustify-content-\w+\b/g,
    /\balign-items-\w+\b/g,
    /\balign-self-\w+\b/g,
    /\btext-center\b/g,
    /\btext-start\b/g,
    /\btext-end\b/g,
    /\btext-muted\b/g,
    /\btext-primary\b/g,
    /\btext-success\b/g,
    /\btext-danger\b/g,
    /\btext-warning\b/g,
    /\btext-info\b/g,
    /\btext-dark\b/g,
    /\btext-white\b/g,
    /\btext-white-50\b/g,
    /\btext-truncate\b/g,
    /\btext-decoration-\w+\b/g,
    /\bmb-\d+\b/g,
    /\bmt-\d+\b/g,
    /\bms-\d+\b/g,
    /\bme-\d+\b/g,
    /\bm-\d+\b/g,
    /\bp-\d+\b/g,
    /\bpx-\d+\b/g,
    /\bpy-\d+\b/g,
    /\bpt-\d+\b/g,
    /\bpb-\d+\b/g,
    /\bps-\d+\b/g,
    /\bpe-\d+\b/g,
    /\brow\b/g,
    /\bcol\b/g,
    /\bcol-\d+\b/g,
    /\bcol-sm-\d+\b/g,
    /\bcol-md-\d+\b/g,
    /\bcol-lg-\d+\b/g,
    /\bcol-xl-\d+\b/g,
    /\bcontainer\b/g,
    /\bcontainer-fluid\b/g,
    /\bg-\d+\b/g,
    /\bgx-\d+\b/g,
    /\bgy-\d+\b/g,
    /\bgap-\d+\b/g,
    /\bborder\b/g,
    /\bborder-\d+\b/g,
    /\bborder-0\b/g,
    /\bborder-top\b/g,
    /\bborder-bottom\b/g,
    /\bborder-start\b/g,
    /\bborder-end\b/g,
    /\bborder-\w+\b/g,
    /\bfw-bold\b/g,
    /\bfw-bolder\b/g,
    /\bfw-semibold\b/g,
    /\bfw-medium\b/g,
    /\bfw-normal\b/g,
    /\bfw-light\b/g,
    /\brounded\b/g,
    /\brounded-circle\b/g,
    /\brounded-\d+\b/g,
    /\bshadow\b/g,
    /\bshadow-sm\b/g,
    /\bshadow-lg\b/g,
    /\bw-\d+\b/g,
    /\bw-100\b/g,
    /\bh-\d+\b/g,
    /\bh-100\b/g,
    /\bvh-100\b/g,
    /\bsmall\b/g,
    /\bposition-relative\b/g,
    /\bposition-absolute\b/g,
    /\balert\b/g,
    /\balert-\w+\b/g,
  ];

  let result = classNameStr;
  bootstrapPatterns.forEach(pattern => {
    result = result.replace(pattern, '');
  });

  // Clean up multiple spaces and trim
  result = result.replace(/\s+/g, ' ').trim();
  return result;
}

let files = findJsxFiles('frontend/src');
console.log(`Found ${files.length} JSX files to process\n`);

let totalFixed = 0;
let filesModified = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  let fileChanged = false;

  // Match all className="..." and className='...' and className={`...`}
  newContent = newContent.replace(/className=["'`]([^"'`]+)["'`]/g, (match, classNames) => {
    const cleaned = removeBootstrapClasses(classNames);

    if (cleaned !== classNames) {
      fileChanged = true;
      totalFixed++;

      // If no classes remain, remove the className prop entirely
      if (cleaned === '') {
        return '';
      }

      // Return with the same quote style as original
      const quote = match.includes('"') ? '"' : match.includes("'") ? "'" : '`';
      return `className=${quote}${cleaned}${quote}`;
    }

    return match;
  });

  // Also handle className={"..."} and className={'...'}
  newContent = newContent.replace(/className=\{["']([^"']+)["']\}/g, (match, classNames) => {
    const cleaned = removeBootstrapClasses(classNames);

    if (cleaned !== classNames) {
      fileChanged = true;
      totalFixed++;

      // If no classes remain, remove the className prop entirely
      if (cleaned === '') {
        return '';
      }

      const quote = match.includes('"') ? '"' : "'";
      return `className={${quote}${cleaned}${quote}}`;
    }

    return match;
  });

  // Clean up any leftover empty className attributes
  newContent = newContent.replace(/ className=""/g, '');
  newContent = newContent.replace(/ className=''/g, '');
  newContent = newContent.replace(/ className=\{""\}/g, '');
  newContent = newContent.replace(/ className=\{''\}/g, '');

  if (fileChanged) {
    fs.writeFileSync(file, newContent);
    filesModified++;
    const relPath = path.relative('frontend/src', file);
    console.log(`✅ Fixed: ${relPath}`);
  }
});

console.log(`\n✅ Complete: Fixed ${totalFixed} Bootstrap className strings across ${filesModified} files`);
