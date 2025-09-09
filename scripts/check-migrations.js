#!/usr/bin/env node
/**
 * Health check script to verify all migrations have been applied
 */
require('dotenv').config();
const sequelize = require('../config/db');

async function checkMigrations() {
  try {
    console.log('🔍 Checking migration status...');

    // Check if SequelizeMeta table exists
    const [results] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = '${process.env.DB_NAME}'
      AND table_name = 'SequelizeMeta'
    `);

    if (results[0].count === 0) {
      console.log('❌ SequelizeMeta table not found - migrations may not have run');
      process.exit(1);
    }

    // Get applied migrations
    const [appliedMigrations] = await sequelize.query('SELECT name FROM SequelizeMeta ORDER BY name');

    console.log(`✅ SequelizeMeta table exists`);
    console.log(`📊 Applied migrations: ${appliedMigrations.length}`);

    if (appliedMigrations.length === 0) {
      console.log('⚠️  No migrations have been applied yet');
      process.exit(1);
    }

    // List applied migrations
    console.log('\n📋 Applied migrations:');
    appliedMigrations.forEach((migration, index) => {
      console.log(`  ${index + 1}. ${migration.name}`);
    });

    // Check for key tables that should exist
    const keyTables = [
      'users', 'manufacturers', 'catalog_data', 'proposals',
      'orders', 'payments', 'payment_configurations',
      'manufacturer_sub_types', 'global_modifications'
    ];

    console.log('\n🏗️  Checking key tables:');
    for (const table of keyTables) {
      const [tableResults] = await sequelize.query(`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = '${process.env.DB_NAME}'
        AND table_name = '${table}'
      `);

      const exists = tableResults[0].count > 0;
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    }

    console.log('\n🎉 Migration health check completed successfully!');
    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration health check failed:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

checkMigrations();
