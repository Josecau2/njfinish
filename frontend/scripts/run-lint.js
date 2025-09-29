#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('Running ESLint...');

try {
  // Run eslint with explicit configuration
  const result = execSync('npx eslint src --ext .js,.jsx,.ts,.tsx', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    timeout: 30000 // 30 second timeout
  });

  console.log('ESLint completed successfully');
} catch (error) {
  console.error('ESLint failed:', error.message);
  process.exit(1);
}