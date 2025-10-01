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
  const originalContent = content;
  let fixCount = 0;

  const lines = content.split('\n');
  const fixedLines = [];

  let insideJsxTag = false;
  let insideStyleBlock = false;
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const originalLine = line;

    // Track if we're inside a JSX tag
    if (line.includes('<') && !line.trim().startsWith('//')) {
      insideJsxTag = true;
    }
    if (line.includes('>') && !line.trim().startsWith('//')) {
      insideJsxTag = false;
    }

    // Track if we're inside a style={{ }} block
    if (line.includes('style={{')) {
      insideStyleBlock = true;
      braceDepth = 2; // style={{ starts with 2 braces
    }

    if (insideStyleBlock) {
      braceDepth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      if (braceDepth <= 0) {
        insideStyleBlock = false;
      }
    }

    // Fix fontSize: 'value' -> fontSize="value" ONLY if NOT in style block
    if (!insideStyleBlock && line.includes('fontSize:')) {
      const match = line.match(/^(\s*)fontSize:\s*['"]([^'"]+)['"](.*)$/);
      if (match) {
        line = `${match[1]}fontSize="${match[2]}"${match[3]}`;
        fixCount++;
      }
    }

    // Fix color: "value" -> color="value" ONLY if NOT in style block
    if (!insideStyleBlock && line.includes('color:')) {
      const match = line.match(/^(\s*)color:\s*"([^"]+)"(.*)$/);
      if (match) {
        line = `${match[1]}color="${match[2]}"${match[3]}`;
        fixCount++;
      }
    }

    fixedLines.push(line);
  }

  if (fixCount > 0) {
    content = fixedLines.join('\n');
    fs.writeFileSync(filePath, content, 'utf8');
    totalFixed += fixCount;
    filesModified++;
    console.log(`✅ Fixed ${fixCount} prop syntax issues in ${path.relative(process.cwd(), filePath)}`);
  }
});

console.log(`\n✅ All prop syntax fixes complete!`);
console.log(`Total Fixes Applied: ${totalFixed}`);
console.log(`Files Modified: ${filesModified}`);
