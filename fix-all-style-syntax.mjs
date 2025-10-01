import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

// Find all JS/JSX files
const files = globSync('frontend/src/**/*.{js,jsx}', {
  ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
});

let totalFixed = 0;
let filesChanged = 0;

files.forEach(file => {
  let content = readFileSync(file, 'utf8');
  const original = content;

  // Fix fontSize= in style/sx objects ONLY (not in JSX component props)
  // Look for patterns like: style={{ ...fontSize="value"... }} or sx={{ ...fontSize="value"... }}
  // But NOT: <Component fontSize="value"

  // Pattern 1: Fix within style={{ }} blocks
  content = content.replace(
    /(\bstyle=\{\{[^}]*?)fontSize="([^"]+)"/g,
    '$1fontSize: "$2"'
  );

  // Pattern 2: Fix within sx={{ }} blocks
  content = content.replace(
    /(\bsx=\{\{[^}]*?)fontSize="([^"]+)"/g,
    '$1fontSize: "$2"'
  );

  // Pattern 3: Fix color= in style objects
  content = content.replace(
    /(\bstyle=\{\{[^}]*?)color="([^"]+)"/g,
    '$1color: "$2"'
  );

  // Pattern 4: Fix color= in sx objects
  content = content.replace(
    /(\bsx=\{\{[^}]*?)color="([^"]+)"/g,
    '$1color: "$2"'
  );

  // Pattern 5: Fix in plain object literals (arrow function returns, useMemo, etc)
  // Look for fontSize= when NOT preceded by a component name or whitespace before opening tag
  content = content.replace(
    /([^<>\w])(fontSize)="([^"]+)"/g,
    (match, prefix, prop, value) => {
      // If prefix is not part of a JSX tag, replace
      if (prefix !== ' ' || match.indexOf('<') === -1) {
        return `${prefix}${prop}: "${value}"`;
      }
      return match;
    }
  );

  if (content !== original) {
    writeFileSync(file, content, 'utf8');
    const changes = (original.match(/fontSize="/g) || []).length;
    totalFixed += changes;
    filesChanged++;
    console.log(`✓ Fixed ${changes} issues in ${file}`);
  }
});

console.log(`\n✓ Total: Fixed ${totalFixed} issues in ${filesChanged} files`);
