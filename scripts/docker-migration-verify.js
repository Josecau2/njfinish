#!/usr/bin/env node
/**
 * Docker environment migration verification script
 * Run this in the container to ensure all migrations are properly set up
 */
require('dotenv').config();

console.log('🐳 Docker Migration Verification Script');
console.log('=====================================\n');

// Check if we're in a container
const isDocker = process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV;
console.log(`Environment: ${isDocker ? 'Docker Container' : 'Local Development'}`);
console.log(`Node Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Database Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`Database Name: ${process.env.DB_NAME || 'not set'}\n`);

// Verify migration files exist
const fs = require('fs');
const path = require('path');

const scriptsMigrationsPath = path.join(__dirname, 'migrations');
const rootMigrationsPath = path.join(__dirname, '..', 'migrations');

console.log('📂 Migration Directory Check:');
console.log(`Scripts migrations: ${fs.existsSync(scriptsMigrationsPath) ? '✅ EXISTS' : '❌ MISSING'}`);
console.log(`Root migrations: ${fs.existsSync(rootMigrationsPath) ? '✅ EXISTS' : '❌ MISSING'}`);

if (fs.existsSync(scriptsMigrationsPath)) {
  const scriptFiles = fs.readdirSync(scriptsMigrationsPath).filter(f => f.endsWith('.js'));
  console.log(`Scripts migration count: ${scriptFiles.length}`);
}

if (fs.existsSync(rootMigrationsPath)) {
  const rootFiles = fs.readdirSync(rootMigrationsPath).filter(f => f.endsWith('.js'));
  console.log(`Root migration count: ${rootFiles.length}`);
}

// Check critical environment variables
console.log('\n🔧 Environment Variables Check:');
const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  console.log(`${envVar}: ${value ? '✅ SET' : '❌ MISSING'}`);
});

// Check if backup directory exists (for production)
if (isDocker && process.env.NODE_ENV === 'production') {
  const backupDir = process.env.BACKUP_DIR || '/app/backups';
  console.log(`\n💾 Backup Directory: ${fs.existsSync(backupDir) ? '✅ EXISTS' : '❌ MISSING'} (${backupDir})`);
}

console.log('\n✅ Migration setup verification completed!');
console.log('\nNext steps:');
console.log('1. Run: node scripts/migrate.js status');
console.log('2. Run: node scripts/migrate.js up');
console.log('3. Run: node scripts/check-migrations.js');
