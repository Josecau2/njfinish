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
  let fixCount = 0;

  // Fix fontSize: 'value' back to fontSize="value" when used as Chakra props (not in style objects)
  // Pattern: <Text fontSize: 'xs'> -> <Text fontSize="xs">

  const originalContent = content;

  // This regex finds fontSize: 'value' that's NOT inside style={{...}}
  // We'll do a simple fix: replace fontSize: 'value' with fontSize="value" when it appears as a prop
  content = content.replace(/<(\w+)([^>]*?)fontSize:\s*'([^']+)'([^>]*?)>/g, (match, tag, before, value, after) => {
    // Check if this is inside a style={{ }} block by looking for 'style={{' in before
    if (before.includes('style={{') || after.includes('}}')) {
      return match; // Keep it as is if it's in a style block
    }
    fixCount++;
    return `<${tag}${before}fontSize="${value}"${after}>`;
  });

  // Fix color: 'value' back to color="value" when used as props
  content = content.replace(/<(\w+)([^>]*?)color:\s*"([^"]+)"([^>]*?)>/g, (match, tag, before, value, after) => {
    if (before.includes('style={{') || after.includes('}}')) {
      return match;
    }
    fixCount++;
    return `<${tag}${before}color="${value}"${after}>`;
  });

  if (fixCount > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalFixed += fixCount;
    filesModified++;
    console.log(`✅ Fixed ${fixCount} prop syntax issues in ${path.relative(process.cwd(), filePath)}`);
  }
});

console.log(`\n✅ Chakra prop syntax fixes complete!`);
console.log(`Total Fixes Applied: ${totalFixed}`);
console.log(`Files Modified: ${filesModified}`);
