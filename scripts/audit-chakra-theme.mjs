import fs from 'node:fs';

const possibleThemeFiles = [
  'src/theme/index.ts',
  'src/theme/index.js',
  'frontend/src/theme/index.ts',
  'frontend/src/theme/index.js',
  'src/theme.ts',
  'src/theme.js'
];

let themeFile = null;
for (const file of possibleThemeFiles) {
  if (fs.existsSync(file)) {
    themeFile = file;
    break;
  }
}

if (!themeFile) {
  console.error('❌ No centralized theme file found!');
  console.log('Create src/theme/index.ts to centralize all Chakra overrides');
} else {
  console.log(`✅ Theme file exists: ${themeFile}`);
  const content = fs.readFileSync(themeFile, 'utf8');

  // Check for proper structure
  const hasComponents = content.includes('components:');
  const hasColors = content.includes('colors:');
  const hasFonts = content.includes('fonts:');

  console.log(`Components overrides: ${hasComponents ? '✅' : '❌'}`);
  console.log(`Color overrides: ${hasColors ? '✅' : '❌'}`);
  console.log(`Font overrides: ${hasFonts ? '✅' : '❌'}`);
}
