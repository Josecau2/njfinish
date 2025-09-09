#!/usr/bin/env node
/**
 * List all available migrations in the system
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs');

console.log('=== NJ Cabinets Migration Inventory ===\n');

// Check scripts/migrations directory
const scriptsMigrationsPath = path.join(__dirname, 'migrations');
console.log('📁 Scripts Migrations Directory:', scriptsMigrationsPath);
if (fs.existsSync(scriptsMigrationsPath)) {
  const scriptFiles = fs.readdirSync(scriptsMigrationsPath)
    .filter(f => f.endsWith('.js'))
    .sort();

  console.log(`Found ${scriptFiles.length} migration files:`);
  scriptFiles.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file}`);
  });
} else {
  console.log('  ❌ Directory does not exist');
}

console.log('\n');

// Check root migrations directory
const rootMigrationsPath = path.join(__dirname, '..', 'migrations');
console.log('📁 Root Migrations Directory:', rootMigrationsPath);
if (fs.existsSync(rootMigrationsPath)) {
  const rootFiles = fs.readdirSync(rootMigrationsPath)
    .filter(f => f.endsWith('.js'))
    .sort();

  console.log(`Found ${rootFiles.length} migration files:`);
  rootFiles.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file}`);
  });
} else {
  console.log('  ❌ Directory does not exist');
}

console.log('\n=== Summary ===');
console.log('All migrations will be processed when running `node scripts/migrate.js up`');
console.log('Duplicates are automatically filtered out based on filename');
