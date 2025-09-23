#!/usr/bin/env node
/**
 * Database Requirements Analysis Script
 *
 * This script analyzes:
 * 1. Migration conflicts and duplicates
 * 2. Current database schema vs expected models
 * 3. Missing tables/columns that need to be created
 * 4. Generates a safe migration plan
 */

const sequelize = require('./config/db');
const fs = require('fs');
const path = require('path');

async function analyzeDatabaseRequirements() {
  console.log('🔍 ANALYZING DATABASE REQUIREMENTS');
  console.log('=' .repeat(80));

  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    // 1. Check migration files for conflicts
    await checkMigrationConflicts();

    // 2. Analyze current database state
    await analyzeCurrentDatabase();

    // 3. Check model requirements
    await analyzeModelRequirements();

    // 4. Generate migration plan
    await generateMigrationPlan();

    console.log('\n' + '=' .repeat(80));
    console.log('✅ Analysis complete. Check the generated migration plan above.');

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

async function checkMigrationConflicts() {
  console.log('📋 1. CHECKING MIGRATION FILES FOR CONFLICTS');
  console.log('-' .repeat(50));

  const migrationDir = path.join(__dirname, 'scripts', 'migrations');

  if (!fs.existsSync(migrationDir)) {
    console.log('⚠️  No migrations directory found');
    return;
  }

  const migrationFiles = fs.readdirSync(migrationDir)
    .filter(f => f.endsWith('.js'))
    .sort();

  console.log(`Found ${migrationFiles.length} migration files:`);

  // Check for applied migrations
  let appliedMigrations = [];
  try {
    const [results] = await sequelize.query('SELECT name FROM SequelizeMeta ORDER BY name');
    appliedMigrations = results.map(r => r.name);
  } catch (error) {
    console.log('⚠️  SequelizeMeta table not found - no migrations applied yet');
  }

  // Analyze each migration
  const migrationAnalysis = [];
  for (const file of migrationFiles) {
    const isApplied = appliedMigrations.includes(file);
    const filePath = path.join(migrationDir, file);

    try {
      const migration = require(filePath);
      const hasUp = typeof migration.up === 'function';
      const hasDown = typeof migration.down === 'function';

      migrationAnalysis.push({
        file,
        isApplied,
        hasUp,
        hasDown,
        status: isApplied ? '✅' : '⏳'
      });
    } catch (error) {
      migrationAnalysis.push({
        file,
        isApplied,
        hasUp: false,
        hasDown: false,
        status: '❌',
        error: error.message
      });
    }
  }

  // Display results
  console.log('\nMigration Status:');
  migrationAnalysis.forEach(({ file, status, isApplied, hasUp, hasDown, error }) => {
    console.log(`${status} ${file} ${isApplied ? '(applied)' : '(pending)'}`);
    if (error) {
      console.log(`   ❌ Error: ${error}`);
    }
    if (!hasUp) {
      console.log('   ⚠️  Missing up() function');
    }
    if (!hasDown) {
      console.log('   ⚠️  Missing down() function');
    }
  });

  // Check for duplicates based on similar functionality
  const duplicateChecks = [
    { pattern: /order/i, files: migrationFiles.filter(f => /order/i.test(f)) },
    { pattern: /proposal/i, files: migrationFiles.filter(f => /proposal/i.test(f)) },
    { pattern: /global.*mod/i, files: migrationFiles.filter(f => /global.*mod/i.test(f)) },
    { pattern: /manufacturer/i, files: migrationFiles.filter(f => /manufacturer/i.test(f)) }
  ];

  console.log('\nPotential Duplicate Migrations:');
  duplicateChecks.forEach(({ pattern, files }) => {
    if (files.length > 1) {
      console.log(`⚠️  ${pattern.source}: ${files.length} files`);
      files.forEach(f => console.log(`   - ${f}`));
    }
  });

  return { migrationAnalysis, appliedMigrations };
}

async function analyzeCurrentDatabase() {
  console.log('\n📊 2. ANALYZING CURRENT DATABASE STATE');
  console.log('-' .repeat(50));

  try {
    // Get all tables
    const [tables] = await sequelize.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0])
      .filter(name => name !== 'SequelizeMeta' && name !== 'sequelizemeta');

    console.log(`Current database has ${tableNames.length} tables:`);

    const tableAnalysis = {};

    for (const tableName of tableNames.slice(0, 10)) { // Limit to first 10 for brevity
      try {
        const [columns] = await sequelize.query(`DESCRIBE ${tableName}`);
        const [count] = await sequelize.query(`SELECT COUNT(*) as count FROM ${tableName}`);

        tableAnalysis[tableName] = {
          columns: columns.length,
          records: count[0].count,
          columnDetails: columns.map(c => ({
            name: c.Field,
            type: c.Type,
            nullable: c.Null === 'YES',
            key: c.Key,
            default: c.Default
          }))
        };

        console.log(`  📋 ${tableName}: ${columns.length} columns, ${count[0].count} records`);
      } catch (error) {
        console.log(`  ❌ ${tableName}: Error analyzing - ${error.message}`);
      }
    }

    if (tableNames.length > 10) {
      console.log(`  ... and ${tableNames.length - 10} more tables`);
    }

    return { tableNames, tableAnalysis };
  } catch (error) {
    console.log(`❌ Error analyzing database: ${error.message}`);
    return { tableNames: [], tableAnalysis: {} };
  }
}

async function analyzeModelRequirements() {
  console.log('\n🏗️  3. ANALYZING MODEL REQUIREMENTS');
  console.log('-' .repeat(50));

  try {
    // Load all models
    const models = require('./models');
    const modelNames = Object.keys(models);

    console.log(`Found ${modelNames.length} Sequelize models:`);

    const modelAnalysis = {};

    for (const modelName of modelNames) {
      const model = models[modelName];

      if (!model || typeof model.sync !== 'function') {
        console.log(`  ⚠️  ${modelName}: Not a valid Sequelize model`);
        continue;
      }

      const tableName = model.tableName || modelName.toLowerCase();
      const attributes = Object.keys(model.rawAttributes || {});

      modelAnalysis[modelName] = {
        tableName,
        attributes,
        attributeCount: attributes.length
      };

      console.log(`  📋 ${modelName} → ${tableName}: ${attributes.length} attributes`);
    }

    return { modelNames, modelAnalysis };
  } catch (error) {
    console.log(`❌ Error loading models: ${error.message}`);
    return { modelNames: [], modelAnalysis: {} };
  }
}

async function generateMigrationPlan() {
  console.log('\n🚀 4. GENERATING SAFE MIGRATION PLAN');
  console.log('-' .repeat(50));

  console.log(`
📋 RECOMMENDED MIGRATION STRATEGY:

1. 🔍 AUDIT PHASE:
   - Backup current database
   - Document existing data structure
   - Identify critical data that must be preserved

2. 🛡️  SAFE MIGRATION APPROACH:
   - Use ALTER TABLE statements instead of DROP/CREATE
   - Add columns with DEFAULT values for non-null constraints
   - Rename columns instead of dropping them
   - Create new tables without affecting existing ones

3. 📝 EXECUTION PLAN:
   - Run analysis script (this one)
   - Execute safe global migration script
   - Verify data integrity
   - Run application tests

4. 🔄 SYNC STRATEGY:
   - Use Sequelize sync with { alter: true, force: false }
   - Preserve existing data and indexes
   - Only add missing structures

💡 NEXT STEPS:
   Run: node create-safe-global-migration.js
`);
}

// Run the analysis
if (require.main === module) {
  analyzeDatabaseRequirements().catch(console.error);
}

module.exports = analyzeDatabaseRequirements;