#!/usr/bin/env node
// Simple wait-for-DB: retries sequelize authenticate until success or timeout
require('dotenv').config();
const sequelize = require('../config/db');

const timeoutMs = Number(process.env.DB_WAIT_TIMEOUT_MS || 60000);
const intervalMs = Number(process.env.DB_WAIT_INTERVAL_MS || 2000);
const start = Date.now();

(async function waitLoop() {
  while (Date.now() - start < timeoutMs) {
    try {
      await sequelize.authenticate();
      console.log('Database is ready.');
      process.exit(0);
    } catch (e) {
      console.log('Waiting for database...', e.message);
      await new Promise(r => setTimeout(r, intervalMs));
    }
  }
  console.error('Timed out waiting for database');
  process.exit(1);
})();
