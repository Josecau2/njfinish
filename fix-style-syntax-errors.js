const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, 'frontend', 'src');

function getAllJsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllJsxFiles(filePath, fileList);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

let totalFixed = 0;
let filesModified = 0;

const jsxFiles = getAllJsxFiles(frontendDir);

jsxFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let fixCount = 0;

  // Fix fontSize="value" to fontSize: 'value' inside style objects
  const originalContent = content;

  // Pattern: fontSize="value" -> fontSize: 'value'
  content = content.replace(/fontSize="([^"]+)"/g, (match, value) => {
    fixCount++;
    modified = true;
    return `fontSize: '${value}'`;
  });

  // Pattern: color="value" (inside style objects only, be careful)
  // Only fix if it appears to be inside a style={{ }} block
  const lines = content.split('\n');
  const fixedLines = [];
  let insideStyleBlock = false;
  let braceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Detect style={{ patterns
    if (line.includes('style={{')) {
      insideStyleBlock = true;
      braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
    } else if (insideStyleBlock) {
      braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      if (braceCount <= 0) {
        insideStyleBlock = false;
      }
    }

    // Fix color="value" inside style blocks
    if (insideStyleBlock && line.includes('color=')) {
      const colorMatch = line.match(/color="([^"]+)"/);
      if (colorMatch) {
        line = line.replace(/color="([^"]+)"/, `color: '$1'`);
        fixCount++;
        modified = true;
      }
    }

    fixedLines.push(line);
  }

  if (modified) {
    content = fixedLines.join('\n');
    fs.writeFileSync(filePath, content, 'utf8');
    totalFixed += fixCount;
    filesModified++;
    console.log(`✅ Fixed ${fixCount} issues in ${path.relative(process.cwd(), filePath)}`);
  }
});

console.log(`\n✅ Style syntax fixes complete!`);
console.log(`Total Fixes Applied: ${totalFixed}`);
console.log(`Files Modified: ${filesModified}`);
