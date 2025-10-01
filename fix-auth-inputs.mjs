import { readFileSync, writeFileSync } from 'fs';

const files = [
  'frontend/src/pages/auth/LoginPage.jsx',
  'frontend/src/pages/auth/ForgotPasswordPage.jsx',
  'frontend/src/pages/auth/ResetPasswordPage.jsx',
  'frontend/src/pages/auth/RequestAccessPage.jsx',
];

const inputBorderProps = `borderColor="gray.300"
                    focusBorderColor="blue.500"
                    _hover={{ borderColor: 'gray.400' }}`;

const textareaBorderProps = `borderColor="gray.300"
                    focusBorderColor="blue.500"
                    _hover={{ borderColor: 'gray.400' }}`;

files.forEach(file => {
  let content = readFileSync(file, 'utf8');

  // Fix Input components - add border props if only focusBorderColor exists
  content = content.replace(
    /(<Input\s+[\s\S]*?)focusBorderColor="blue\.500"(\s*\/?>)/g,
    (match, before, after) => {
      if (before.includes('borderColor=')) {
        return match; // Already has borderColor
      }
      return `${before}${inputBorderProps}${after}`;
    }
  );

  // Fix Textarea components
  content = content.replace(
    /(<Textarea\s+[\s\S]*?)focusBorderColor="blue\.500"(\s*\/?>)/g,
    (match, before, after) => {
      if (before.includes('borderColor=')) {
        return match;
      }
      return `${before}${textareaBorderProps}${after}`;
    }
  );

  writeFileSync(file, content, 'utf8');
  console.log(`✓ Fixed ${file}`);
});

console.log('\nAll auth page inputs fixed with visible borders!');
