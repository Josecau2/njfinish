#!/usr/bin/env node
/**
 * Thin wrapper for running database migrations in container environments.
 * Delegates to scripts/docker-migrate.js so the logic lives in one place.
 */

require('dotenv').config();
const path = require('path');
const { spawn } = require('child_process');

const migrationScript = path.join(__dirname, 'scripts', 'docker-migrate.js');
const args = process.argv.slice(2);
const invocation = ['node', [migrationScript, ...(args.length ? args : ['up'])]];

console.log('Starting safe global migration via', migrationScript);

const child = spawn(invocation[0], invocation[1], {
  stdio: 'inherit',
  env: process.env,
});

child.on('error', (err) => {
  console.error('Failed to start migration process:', err.message);
  process.exit(1);
});

child.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Migration script exited with code ${code}`);
    process.exit(code);
  }

  console.log('Migrations completed successfully.');
});

