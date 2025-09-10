#!/usr/bin/env node
require('dotenv').config();
const sequelize = require('../config/db');
const fs = require('fs');
const path = require('path');

console.log('🔍 COMPREHENSIVE DATABASE SCHEMA VERIFICATION');
console.log('=' .repeat(70));

async function verifySchema() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful');

    // Get all tables from database
    const [tables] = await sequelize.query("SHOW TABLES");
    const tableNames = tables.map(t => Object.values(t)[0]).filter(name => name !== 'SequelizeMeta');

    console.log(`\n📊 Database has ${tableNames.length + 1} total tables (including SequelizeMeta)`);

    // Check migration status
    const [migrationRecords] = await sequelize.query("SELECT name FROM SequelizeMeta ORDER BY name");
    console.log(`📋 Applied migrations: ${migrationRecords.length}`);

    // Check for all model files
    const modelsDir = path.join(__dirname, '..', 'models');
    const modelFiles = fs.readdirSync(modelsDir)
      .filter(f => f.endsWith('.js') && f !== 'index.js')
      .map(f => f.replace('.js', ''));

    console.log(`🏗️  Model files found: ${modelFiles.length}`);

    // Load models to check associations
    const models = require('../models');
    const modelNames = Object.keys(models).filter(name => name !== 'sequelize' && name !== 'Sequelize');

    console.log(`🔗 Loaded models: ${modelNames.length}`);

    // Check migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.existsSync(migrationsDir)
      ? fs.readdirSync(migrationsDir).filter(f => f.endsWith('.js'))
      : [];

    console.log(`📁 Migration files in scripts/migrations: ${migrationFiles.length}`);

    // Check for old migrations in root
    const rootMigrationsDir = path.join(__dirname, '..', 'migrations');
    const rootMigrationFiles = fs.existsSync(rootMigrationsDir)
      ? fs.readdirSync(rootMigrationsDir).filter(f => f.endsWith('.js'))
      : [];

    if (rootMigrationFiles.length > 0) {
      console.log(`⚠️  Legacy migration files in root/migrations: ${rootMigrationFiles.length}`);
      console.log('   These should be consolidated to scripts/migrations/');
    }

    // Detailed analysis
    console.log('\n📋 DETAILED ANALYSIS:');
    console.log('-'.repeat(50));

    console.log('\n🗄️  Database Tables:');
    tableNames.sort().forEach(table => {
      const systemTables = ['sequelizemeta', 'SequelizeMeta'];
      const isSystemTable = systemTables.includes(table);
      const hasModel = !isSystemTable && modelNames.some(model =>
        models[model].tableName === table ||
        models[model].tableName === table.toLowerCase() ||
        model.toLowerCase() === table.toLowerCase()
      );

      if (isSystemTable) {
        console.log(`   🔧 ${table} (system table)`);
      } else {
        console.log(`   ${hasModel ? '✅' : '❌'} ${table}${hasModel ? '' : ' (no model)'}`);
      }
    });

    console.log('\n🏗️  Model Files:');
    modelNames.sort().forEach(model => {
      const modelInstance = models[model];
      const tableName = modelInstance.tableName || model.toLowerCase();
      const hasTable = tableNames.some(table =>
        table === tableName ||
        table.toLowerCase() === tableName.toLowerCase()
      );
      console.log(`   ${hasTable ? '✅' : '❌'} ${model}${hasTable ? ` → ${tableName}` : ' (no table)'}`);
    });

    console.log('\n📁 Applied Migrations:');
    migrationRecords.slice(-10).forEach(record => {
      console.log(`   ✅ ${record.name}`);
    });
    if (migrationRecords.length > 10) {
      console.log(`   ... and ${migrationRecords.length - 10} more`);
    }

    // Check for common issues
    console.log('\n🔍 ISSUE DETECTION:');
    console.log('-'.repeat(50));

    let issuesFound = 0;

    // Tables without models (excluding expected system tables)
    const systemTables = ['sequelizemeta', 'SequelizeMeta'];
    const tablesWithoutModels = tableNames.filter(table =>
      !systemTables.includes(table) &&
      !modelNames.some(model =>
        models[model].tableName === table ||
        models[model].tableName === table.toLowerCase() ||
        model.toLowerCase() === table.toLowerCase()
      )
    );

    if (tablesWithoutModels.length > 0) {
      console.log(`❌ Tables without models (${tablesWithoutModels.length}):`);
      tablesWithoutModels.forEach(table => console.log(`   - ${table}`));
      issuesFound += tablesWithoutModels.length;
    }

    // Models without tables
    const modelsWithoutTables = modelNames.filter(model => {
      const modelInstance = models[model];
      const tableName = modelInstance.tableName || model.toLowerCase();
      return !tableNames.some(table =>
        table === tableName ||
        table.toLowerCase() === tableName.toLowerCase()
      );
    });

    if (modelsWithoutTables.length > 0) {
      console.log(`❌ Models without tables (${modelsWithoutTables.length}):`);
      modelsWithoutTables.forEach(model => console.log(`   - ${model}`));
      issuesFound += modelsWithoutTables.length;
    }

    // Check Docker readiness
    console.log('\n🐳 DOCKER DEPLOYMENT READINESS:');
    console.log('-'.repeat(50));

    const dockerMigrateScript = path.join(__dirname, 'docker-migrate.js');
    const hasDockerScript = fs.existsSync(dockerMigrateScript);
    console.log(`${hasDockerScript ? '✅' : '❌'} Docker migration script: ${hasDockerScript ? 'present' : 'missing'}`);

    const dockerfile = path.join(__dirname, '..', 'Dockerfile');
    const hasDockerfile = fs.existsSync(dockerfile);
    console.log(`${hasDockerfile ? '✅' : '❌'} Dockerfile: ${hasDockerfile ? 'present' : 'missing'}`);

    if (hasDockerfile) {
      const dockerContent = fs.readFileSync(dockerfile, 'utf8');
      const hasMigrationCmd = dockerContent.includes('migrate') || dockerContent.includes('scripts/');
      console.log(`${hasMigrationCmd ? '✅' : '❌'} Dockerfile includes migration execution: ${hasMigrationCmd ? 'yes' : 'no'}`);
    }

    // Final summary
    console.log('\n🎯 VERIFICATION SUMMARY:');
    console.log('='.repeat(70));

    if (issuesFound === 0) {
      console.log('✅ Schema verification PASSED - No issues detected');
      console.log('✅ Database is ready for Docker deployment');
    } else {
      console.log(`❌ Schema verification FAILED - ${issuesFound} issues detected`);
      console.log('⚠️  Resolve issues before Docker deployment');
    }

    console.log(`\n📊 Final Statistics:`);
    console.log(`   - Database tables: ${tableNames.length}`);
    console.log(`   - Model definitions: ${modelNames.length}`);
    console.log(`   - Applied migrations: ${migrationRecords.length}`);
    console.log(`   - Migration files: ${migrationFiles.length}`);
    console.log(`   - Issues found: ${issuesFound}`);

    await sequelize.close();

    process.exit(issuesFound === 0 ? 0 : 1);

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

verifySchema();
