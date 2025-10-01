const fs = require('fs');
const path = require('path');

console.log('🔍 TYPOGRAPHY & CONTRAST AUDIT\n');
console.log('═'.repeat(80));

const issues = {
  hardcodedFontSizes: [],
  hardcodedColors: [],
  inconsistentHeadings: [],
  poorContrast: [],
};

function findJsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory() && !file.includes('node_modules')) {
      findJsxFiles(filePath, fileList);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const files = findJsxFiles('frontend/src');

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const relPath = path.relative('frontend/src', file);

    // Check for hardcoded font sizes (px/rem instead of Chakra tokens)
    if (line.match(/fontSize=["']([0-9.]+)(px|rem)["']/)) {
      issues.hardcodedFontSizes.push({
        file: relPath,
        line: lineNum,
        code: line.trim().substring(0, 80),
      });
    }

    // Check for hardcoded hex colors
    if (line.match(/color=["']#[0-9a-fA-F]{3,6}["']/)) {
      issues.hardcodedColors.push({
        file: relPath,
        line: lineNum,
        code: line.trim().substring(0, 80),
      });
    }

    // Check for inline styles with colors
    if (line.match(/style=\{[^}]*color:\s*['"]#[0-9a-fA-F]{3,6}['"]/)) {
      issues.hardcodedColors.push({
        file: relPath,
        line: lineNum,
        code: line.trim().substring(0, 80),
      });
    }

    // Check for font-size in style objects
    if (line.match(/fontSize:\s*['"]([0-9.]+)(px|rem)['"]/)) {
      issues.hardcodedFontSizes.push({
        file: relPath,
        line: lineNum,
        code: line.trim().substring(0, 80),
      });
    }
  });
});

console.log('\n📊 AUDIT RESULTS:\n');

console.log(`\n🔤 HARDCODED FONT SIZES (${issues.hardcodedFontSizes.length} issues):`);
console.log('Should use Chakra tokens: xs, sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl\n');
issues.hardcodedFontSizes.slice(0, 15).forEach(issue => {
  console.log(`  ${issue.file}:${issue.line}`);
  console.log(`    ${issue.code}`);
});
if (issues.hardcodedFontSizes.length > 15) {
  console.log(`  ... and ${issues.hardcodedFontSizes.length - 15} more`);
}

console.log(`\n🎨 HARDCODED COLORS (${issues.hardcodedColors.length} issues):`);
console.log('Should use Chakra color tokens: gray.500, blue.500, red.500, etc.\n');
issues.hardcodedColors.forEach(issue => {
  console.log(`  ${issue.file}:${issue.line}`);
  console.log(`    ${issue.code}`);
});

console.log('\n\n📋 SUMMARY:');
console.log('═'.repeat(80));
console.log(`Total Font Size Issues: ${issues.hardcodedFontSizes.length}`);
console.log(`Total Color Issues: ${issues.hardcodedColors.length}`);
console.log(`Total Issues: ${issues.hardcodedFontSizes.length + issues.hardcodedColors.length}`);

// Save detailed report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    hardcodedFontSizes: issues.hardcodedFontSizes.length,
    hardcodedColors: issues.hardcodedColors.length,
    total: issues.hardcodedFontSizes.length + issues.hardcodedColors.length,
  },
  issues,
};

fs.writeFileSync('typography-contrast-audit.json', JSON.stringify(report, null, 2));
console.log('\n✅ Detailed report saved to: typography-contrast-audit.json');
