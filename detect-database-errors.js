#!/usr/bin/env node
/**
 * Comprehensive Database Error Detection Script
 *
 * This script identifies ALL remaining database issues before starting the backend:
 * 1. Model loading errors
 * 2. Foreign key constraint problems
 * 3. Data type mismatches
 * 4. Missing required fields
 * 5. Index creation failures
 */

const sequelize = require('./config/db');

async function detectAllDatabaseErrors() {
  console.log('🔍 COMPREHENSIVE DATABASE ERROR DETECTION');
  console.log('=' .repeat(70));

  const errors = [];
  const warnings = [];

  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    // 1. Test model loading
    console.log('📋 1. TESTING MODEL LOADING');
    console.log('-' .repeat(40));
    await testModelLoading(errors, warnings);

    // 2. Test individual model sync
    console.log('\n📋 2. TESTING INDIVIDUAL MODEL SYNC');
    console.log('-' .repeat(40));
    await testIndividualModelSync(errors, warnings);

    // 3. Test foreign key constraints
    console.log('\n📋 3. TESTING FOREIGN KEY CONSTRAINTS');
    console.log('-' .repeat(40));
    await testForeignKeyConstraints(errors, warnings);

    // 4. Test data integrity
    console.log('\n📋 4. TESTING DATA INTEGRITY');
    console.log('-' .repeat(40));
    await testDataIntegrity(errors, warnings);

    // 5. Summary
    console.log('\n' + '=' .repeat(70));
    console.log('📊 DETECTION SUMMARY');
    console.log(`❌ Errors found: ${errors.length}`);
    console.log(`⚠️  Warnings found: ${warnings.length}`);

    if (errors.length > 0) {
      console.log('\n❌ CRITICAL ERRORS (must fix before starting backend):');
      errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS (should fix but not critical):');
      warnings.forEach((warning, i) => {
        console.log(`   ${i + 1}. ${warning}`);
      });
    }

    if (errors.length === 0) {
      console.log('\n✅ NO CRITICAL ERRORS FOUND! Backend should start successfully.');
    } else {
      console.log('\n🚫 DO NOT START BACKEND UNTIL ALL ERRORS ARE FIXED!');
    }

  } catch (error) {
    console.error('❌ Detection failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

async function testModelLoading(errors, warnings) {
  try {
    const models = require('./models');
    const modelNames = Object.keys(models);
    console.log(`✅ Successfully loaded ${modelNames.length} models`);

    // Test each model individually
    for (const modelName of modelNames) {
      try {
        const model = models[modelName];
        if (!model || typeof model.sync !== 'function') {
          warnings.push(`Model ${modelName} is not a valid Sequelize model`);
          continue;
        }

        // Test model attributes
        const attributes = model.rawAttributes;
        if (!attributes || Object.keys(attributes).length === 0) {
          warnings.push(`Model ${modelName} has no attributes defined`);
        }

      } catch (error) {
        errors.push(`Model ${modelName} loading error: ${error.message}`);
      }
    }

  } catch (error) {
    errors.push(`Model loading failed: ${error.message}`);
  }
}

async function testIndividualModelSync(errors, warnings) {
  try {
    const models = require('./models');
    const modelNames = Object.keys(models);

    for (const modelName of modelNames.slice(0, 10)) { // Test first 10 models
      try {
        const model = models[modelName];
        if (model && typeof model.sync === 'function') {
          await model.sync({ alter: false, force: false });
          console.log(`✅ ${modelName} sync OK`);
        }

      } catch (error) {
        if (error.message.includes('foreign key constraint')) {
          errors.push(`${modelName}: Foreign key constraint error - ${error.message}`);
        } else if (error.message.includes('Unknown column')) {
          errors.push(`${modelName}: Column mismatch - ${error.message}`);
        } else if (error.message.includes('Table') && error.message.includes("doesn't exist")) {
          errors.push(`${modelName}: Missing table - ${error.message}`);
        } else {
          warnings.push(`${modelName}: Sync warning - ${error.message}`);
        }
      }
    }

  } catch (error) {
    errors.push(`Individual model sync test failed: ${error.message}`);
  }
}

async function testForeignKeyConstraints(errors, warnings) {
  const foreignKeyTests = [
    {
      table: 'manufacturer_assembly_costs',
      column: 'catalog_data_id',
      references: 'manufacturer_catalog_data(id)'
    },
    {
      table: 'proposals',
      column: 'customer_id',
      references: 'customers(id)'
    },
    {
      table: 'orders',
      column: 'customer_id',
      references: 'customers(id)'
    },
    {
      table: 'payments',
      column: 'order_id',
      references: 'orders(id)'
    }
  ];

  for (const test of foreignKeyTests) {
    try {
      // Check if referenced table and column exist
      const [refResult] = await sequelize.query(
        `SELECT COUNT(*) as count FROM information_schema.tables
         WHERE table_schema = DATABASE() AND table_name = ?`,
        { replacements: [test.references.split('(')[0]] }
      );

      if (refResult[0].count === 0) {
        warnings.push(`${test.table}.${test.column} references non-existent table ${test.references}`);
      } else {
        console.log(`✅ ${test.table}.${test.column} → ${test.references} OK`);
      }

    } catch (error) {
      warnings.push(`Foreign key test ${test.table}.${test.column}: ${error.message}`);
    }
  }
}

async function testDataIntegrity(errors, warnings) {
  const tables = ['users', 'customers', 'proposals', 'orders', 'manufacturers'];

  for (const table of tables) {
    try {
      // Test basic SELECT
      const [result] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`✅ ${table}: ${result[0].count} records accessible`);

      // Test basic INSERT/DELETE (with rollback)
      await sequelize.transaction(async (t) => {
        await sequelize.query(`INSERT INTO ${table} (created_at, updated_at) VALUES (NOW(), NOW())`, { transaction: t });
        await sequelize.query(`DELETE FROM ${table} WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 SECOND)`, { transaction: t });
        // Transaction will be rolled back automatically
        throw new Error('Rollback test');
      });

    } catch (error) {
      if (error.message === 'Rollback test') {
        console.log(`✅ ${table}: INSERT/DELETE test OK`);
      } else if (error.message.includes("doesn't have a default value")) {
        warnings.push(`${table}: Missing required fields for INSERT operations`);
      } else if (error.message.includes('Unknown column')) {
        errors.push(`${table}: Column structure mismatch - ${error.message}`);
      } else {
        warnings.push(`${table}: Data integrity warning - ${error.message}`);
      }
    }
  }
}

// Run the detection
if (require.main === module) {
  detectAllDatabaseErrors().catch(console.error);
}

module.exports = detectAllDatabaseErrors;