#!/usr/bin/env node
require('dotenv').config();
const path = require('path');
const sequelize = require('../config/db');

async function main() {
  const rel = process.argv[2];
  if (!rel) {
    console.error('Usage: node scripts/run-one-migration.js <relative-migration-path>');
    process.exit(1);
  }
  const file = path.isAbsolute(rel) ? rel : path.join(process.cwd(), rel);
  console.log('Running migration:', file);
  try {
    await sequelize.authenticate();
    const migration = require(file);
    if (!migration?.up) throw new Error('Migration file does not export an up() function');
    await migration.up({ context: null });
    console.log('✅ Migration ran successfully');
    process.exit(0);
  } catch (e) {
    console.error('❌ Migration failed:', e.message);
    process.exit(1);
  }
}

main();
