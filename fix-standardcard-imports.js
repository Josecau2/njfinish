const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all files with incorrect StandardCard import
const files = execSync(
  `find frontend/src -name "*.jsx" -o -name "*.js" | xargs grep -l "StandardCard.*from '@chakra-ui/react'"`,
  { encoding: 'utf-8' }
).trim().split('\n').filter(Boolean);

console.log(`Found ${files.length} files to fix`);

files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf-8');

  // Remove StandardCard from chakra import
  let newContent = content.replace(
    /(from\s+['"]@chakra-ui\/react['"]\s*)/g,
    (match, p1, offset) => {
      const importStart = content.lastIndexOf('import', offset);
      const importEnd = offset + match.length;
      const importStatement = content.substring(importStart, importEnd);

      if (!importStatement.includes('StandardCard')) {
        return match;
      }

      // Remove StandardCard from the import list
      const updated = importStatement.replace(/,?\s*StandardCard\s*,?/g, (m) => {
        // Handle different cases: ", StandardCard,", ", StandardCard", "StandardCard,"
        if (m.trim() === ', StandardCard,') return ', ';
        if (m.trim().startsWith(', StandardCard')) return '';
        if (m.trim().endsWith('StandardCard,')) return '';
        return '';
      });

      return updated.substring(importStart).replace(importStatement, updated) + match.substring(match.length);
    }
  );

  // Add StandardCard import if not already present
  if (!newContent.includes(`import StandardCard from`)) {
    // Find the last import statement
    const lastImportMatch = [...newContent.matchAll(/^import\s+.*?from\s+['"].*?['"]\s*$/gm)];
    if (lastImportMatch.length > 0) {
      const lastImport = lastImportMatch[lastImportMatch.length - 1];
      const insertPos = lastImport.index + lastImport[0].length;

      // Calculate relative path to components
      const fileDir = path.dirname(file);
      const componentsDir = path.join(process.cwd(), 'frontend', 'src', 'components');
      const relativePath = path.relative(fileDir, componentsDir).replace(/\\/g, '/');
      const importPath = relativePath.startsWith('.') ? relativePath : './' + relativePath;

      newContent = newContent.slice(0, insertPos) +
                   `\nimport StandardCard from '${importPath}/StandardCard'` +
                   newContent.slice(insertPos);
    }
  }

  fs.writeFileSync(file, newContent);
  console.log(`Fixed: ${file}`);
});

console.log('Done!');
