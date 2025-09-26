#!/usr/bin/env node
const sequelize = require('../config/db');

async function verifyResourcesSchema() {
  try {
    const tables = [
      'resource_categories',
      'resource_links',
      'resource_files',
      'resource_announcements',
    ];

    for (const table of tables) {
      try {
        const [rows] = await sequelize.query(`DESCRIBE ${table}`);
        console.log(`✅ ${table} schema:`);
        rows.forEach(r => {
          console.log(`  - ${r.Field}: ${r.Type} ${r.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${r.Default ? 'DEFAULT ' + r.Default : ''}`);
        });
        console.log();
      } catch (innerErr) {
        console.error(`❌ Missing required table: ${table}`);
        throw innerErr;
      }
    }

    await sequelize.close();
    console.log('🎯 Resource tables verified.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Resource schema verification failed:', error && error.message ? error.message : error);
    await sequelize.close();
    process.exit(1);
  }
}

verifyResourcesSchema();
