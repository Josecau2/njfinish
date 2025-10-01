const fs = require('fs');
const {execSync} = require('child_process');

// Get all files with fontSize: syntax
const result = execSync(
  `grep -rn "^\\s*fontSize:\\s*['\\\"]" frontend/src --include="*.jsx" --include="*.js" | grep -v "style={{" | grep -v "//"`,
  { encoding: 'utf8', cwd: __dirname }
).trim();

if (!result) {
  console.log('No fontSize: syntax errors found');
  process.exit(0);
}

const lines = result.split('\n');
const fileChanges = {};

lines.forEach(line => {
  const match = line.match(/^([^:]+):(\d+):(.*fontSize:\s*['"]([^'"]+)['"].*)/);
  if (!match) return;

  const [, filePath, lineNum, fullLine, value] = match;

  if (!fileChanges[filePath]) {
    fileChanges[filePath] = [];
  }

  fileChanges[filePath].push({
    lineNum: parseInt(lineNum),
    original: fullLine.trim(),
    value
  });
});

let totalFixed = 0;

Object.keys(fileChanges).forEach(filePath => {
  const fullPath = filePath;
  let content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  let fixCount = 0;

  // Sort by line number descending to fix from bottom up
  const changes = fileChanges[filePath].sort((a, b) => b.lineNum - a.lineNum);

  changes.forEach(({ lineNum, original, value }) => {
    const lineIndex = lineNum - 1;
    const line = lines[lineIndex];

    // Check if this line is NOT inside a style={{}} block
    // Look at previous lines to see if we're in a style block
    let insideStyleBlock = false;
    let braceDepth = 0;

    for (let i = lineIndex; i >= Math.max(0, lineIndex - 10); i--) {
      const prevLine = lines[i];
      if (prevLine.includes('style={{')) {
        insideStyleBlock = true;
        break;
      }
      // If we see a closing tag before style={{, we're not in a style block
      if (prevLine.match(/^\s*<\w+/)) {
        break;
      }
    }

    // Only fix if NOT in style block
    if (!insideStyleBlock && line.match(/^\s*fontSize:\s*['"]/)) {
      lines[lineIndex] = line.replace(/fontSize:\s*['"]([^'"]+)['"]/, 'fontSize="$1"');
      fixCount++;
      totalFixed++;
    }
  });

  if (fixCount > 0) {
    fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
    console.log(`✅ Fixed ${fixCount} issues in ${filePath.replace('frontend/src/', '')}`);
  }
});

console.log(`\n✅ All fontSize syntax fixes complete!`);
console.log(`Total Fixes Applied: ${totalFixed}`);
