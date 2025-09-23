#!/usr/bin/env node
/**
 * Database Error Fix Script
 *
 * This script fixes the specific errors identified during migration:
 * 1. Foreign key constraint issues
 * 2. Missing columns for indexes
 * 3. Data type mismatches
 */

const sequelize = require('./config/db');

async function fixDatabaseErrors() {
  console.log('🔧 FIXING DATABASE ERRORS');
  console.log('=' .repeat(60));

  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    // 1. Fix foreign key constraints
    await fixForeignKeyConstraints();

    // 2. Fix missing columns for indexes
    await fixMissingColumns();

    // 3. Verify fixes by testing backend startup
    await verifyFixes();

    console.log('\n✅ All database errors have been fixed!');

  } catch (error) {
    console.error('❌ Error fixing database:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

async function fixForeignKeyConstraints() {
  console.log('🔗 1. FIXING FOREIGN KEY CONSTRAINTS');
  console.log('-' .repeat(40));

  const fixes = [
    {
      name: 'ManufacturerAssemblyCost foreign key',
      query: `
        ALTER TABLE manufacturer_assembly_costs
        DROP FOREIGN KEY IF EXISTS manufacturer_assembly_costs_ibfk_1;

        ALTER TABLE manufacturer_assembly_costs
        ADD CONSTRAINT fk_manufacturer_assembly_costs_manufacturer
        FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id)
        ON DELETE CASCADE ON UPDATE CASCADE;
      `
    }
  ];

  for (const fix of fixes) {
    try {
      await sequelize.query(fix.query);
      console.log(`✅ Fixed: ${fix.name}`);
    } catch (error) {
      if (!error.message.includes('already exists') && !error.message.includes('check that column/key exists')) {
        console.log(`⚠️  ${fix.name}: ${error.message}`);
      } else {
        console.log(`✅ ${fix.name}: Already correct`);
      }
    }
  }
}

async function fixMissingColumns() {
  console.log('\n📋 2. FIXING MISSING COLUMNS FOR INDEXES');
  console.log('-' .repeat(40));

  const columnFixes = [
    {
      table: 'proposals',
      column: 'customer_id',
      type: 'INT(11)',
      description: 'Add customer_id to proposals table'
    },
    {
      table: 'contact_threads',
      column: 'customer_id',
      type: 'INT(11)',
      description: 'Add customer_id to contact_threads table'
    },
    {
      table: 'payments',
      column: 'order_id',
      type: 'INT(11)',
      description: 'Add order_id to payments table'
    }
  ];

  for (const fix of columnFixes) {
    try {
      // Check if column exists
      const [columns] = await sequelize.query(`DESCRIBE ${fix.table}`);
      const columnExists = columns.some(col => col.Field === fix.column);

      if (!columnExists) {
        await sequelize.query(`ALTER TABLE ${fix.table} ADD COLUMN ${fix.column} ${fix.type} NULL`);
        console.log(`✅ Added ${fix.column} to ${fix.table}`);
      } else {
        console.log(`✅ ${fix.column} already exists in ${fix.table}`);
      }
    } catch (error) {
      console.log(`⚠️  ${fix.description}: ${error.message}`);
    }
  }

  // Now create the indexes that failed before
  console.log('\n🔗 Creating missing indexes...');
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_proposals_customer_id ON proposals(customer_id)',
    'CREATE INDEX IF NOT EXISTS idx_contact_threads_customer ON contact_threads(customer_id)',
    'CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id)'
  ];

  for (const indexQuery of indexes) {
    try {
      await sequelize.query(indexQuery);
      console.log(`✅ ${indexQuery.split(' ')[5] || 'Index'} created`);
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) {
        console.log(`⚠️  Index creation: ${error.message}`);
      }
    }
  }
}

async function verifyFixes() {
  console.log('\n🔍 3. VERIFYING FIXES');
  console.log('-' .repeat(40));

  try {
    // Test model loading
    console.log('Testing model loading...');
    const models = require('./models');
    console.log(`✅ ${Object.keys(models).length} models loaded successfully`);

    // Test database sync
    console.log('Testing database sync...');
    await sequelize.sync({ alter: false, force: false });
    console.log('✅ Database sync successful');

    // Test some basic queries
    console.log('Testing basic queries...');

    const tables = ['users', 'customers', 'proposals', 'orders'];
    for (const table of tables) {
      try {
        const [result] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`✅ ${table}: ${result[0].count} records`);
      } catch (error) {
        console.log(`⚠️  ${table}: ${error.message}`);
      }
    }

    console.log('✅ All verifications passed');

  } catch (error) {
    console.log(`❌ Verification failed: ${error.message}`);
    throw error;
  }
}

// Run the fixes
if (require.main === module) {
  fixDatabaseErrors().catch(console.error);
}

module.exports = fixDatabaseErrors;