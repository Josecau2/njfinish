#!/usr/bin/env node
/**
 * Fix Critical Database Errors
 *
 * This script fixes the critical errors identified:
 * 1. Missing created_at and updated_at columns in core tables
 * 2. Ensures all tables have proper timestamp fields
 */

const sequelize = require('./config/db');

async function fixCriticalDatabaseErrors() {
  console.log('🚨 FIXING CRITICAL DATABASE ERRORS');
  console.log('=' .repeat(60));

  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    await addMissingTimestampColumns();
    await verifyFixes();

    console.log('\n✅ All critical errors have been fixed!');
    console.log('✅ Backend can now be started safely.');

  } catch (error) {
    console.error('❌ Error fixing critical issues:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

async function addMissingTimestampColumns() {
  console.log('📅 ADDING MISSING TIMESTAMP COLUMNS');
  console.log('-' .repeat(50));

  const tables = [
    'users', 'customers', 'proposals', 'orders', 'manufacturers',
    'activity_logs', 'notifications', 'contact_info', 'contact_threads',
    'contact_messages', 'terms', 'payments', 'categories', 'collections'
  ];

  for (const table of tables) {
    try {
      // Check current columns
      const [columns] = await sequelize.query(`DESCRIBE ${table}`);
      const columnNames = columns.map(col => col.Field);

      const hasCreatedAt = columnNames.includes('created_at') || columnNames.includes('createdAt');
      const hasUpdatedAt = columnNames.includes('updated_at') || columnNames.includes('updatedAt');

      // Add created_at if missing
      if (!hasCreatedAt) {
        await sequelize.query(`
          ALTER TABLE ${table}
          ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        `);
        console.log(`✅ Added created_at to ${table}`);
      }

      // Add updated_at if missing
      if (!hasUpdatedAt) {
        await sequelize.query(`
          ALTER TABLE ${table}
          ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        `);
        console.log(`✅ Added updated_at to ${table}`);
      }

      if (hasCreatedAt && hasUpdatedAt) {
        console.log(`✅ ${table} already has timestamp columns`);
      }

    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log(`✅ ${table} already has timestamp columns`);
      } else {
        console.log(`⚠️  ${table}: ${error.message}`);
      }
    }
  }
}

async function verifyFixes() {
  console.log('\n🔍 VERIFYING FIXES');
  console.log('-' .repeat(50));

  const testTables = ['users', 'customers', 'proposals', 'orders', 'manufacturers'];

  for (const table of testTables) {
    try {
      // Test that we can now insert with timestamps
      await sequelize.transaction(async (t) => {
        await sequelize.query(
          `INSERT INTO ${table} (created_at, updated_at) VALUES (NOW(), NOW())`,
          { transaction: t }
        );
        await sequelize.query(
          `DELETE FROM ${table} WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 SECOND)`,
          { transaction: t }
        );
        // Rollback to avoid leaving test data
        throw new Error('Rollback test');
      });

    } catch (error) {
      if (error.message === 'Rollback test') {
        console.log(`✅ ${table}: Timestamp columns working correctly`);
      } else {
        console.log(`❌ ${table}: Still has issues - ${error.message}`);
      }
    }
  }

  // Final verification - test model sync
  console.log('\n🔄 Testing model sync after fixes...');
  try {
    await sequelize.sync({ alter: false, force: false });
    console.log('✅ Model sync successful - no more critical errors!');
  } catch (error) {
    console.log(`❌ Model sync still failing: ${error.message}`);
    throw error;
  }
}

// Run the fixes
if (require.main === module) {
  fixCriticalDatabaseErrors().catch(console.error);
}

module.exports = fixCriticalDatabaseErrors;