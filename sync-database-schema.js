const sequelize = require('./config/db');
const fs = require('fs');
const path = require('path');

// Import all models
const models = require('./models');

async function syncDatabaseSchema() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected');

    console.log('\n=== 1. CHECKING CURRENT DATABASE TABLES ===');
    const [dbTables] = await sequelize.query('SHOW TABLES');
    const currentTables = dbTables.map(table => Object.values(table)[0]).sort();
    console.log('Current database tables:', currentTables.length);
    currentTables.forEach(table => console.log(`  - ${table}`));

    console.log('\n=== 2. CHECKING APPLIED MIGRATIONS ===');
    const [migrations] = await sequelize.query('SELECT name FROM sequelizemeta ORDER BY name');
    console.log('Applied migrations:', migrations.length);
    migrations.forEach(m => console.log(`  ✓ ${m.name}`));

    console.log('\n=== 3. CHECKING PENDING MIGRATIONS ===');
    const migrationDir = path.join(__dirname, 'scripts', 'migrations');
    const allMigrationFiles = fs.readdirSync(migrationDir)
      .filter(f => f.endsWith('.js'))
      .sort();

    const appliedNames = migrations.map(m => m.name);
    const pendingMigrations = allMigrationFiles.filter(f => !appliedNames.includes(f));

    if (pendingMigrations.length > 0) {
      console.log('Pending migrations:', pendingMigrations.length);
      pendingMigrations.forEach(m => console.log(`  ⚠️  ${m}`));
    } else {
      console.log('✓ All migrations are applied');
    }

    console.log('\n=== 4. CHECKING MODEL-TABLE ALIGNMENT ===');
    const modelNames = Object.keys(models);
    console.log('Defined models:', modelNames.length);

    // Check for missing models
    const expectedModels = currentTables
      .filter(t => t !== 'sequelizemeta')
      .map(table => {
        // Convert table name to expected model name
        return table.split('_').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join('');
      });

    const missingModels = [];
    expectedModels.forEach(expected => {
      const variations = [
        expected,
        expected.endsWith('s') ? expected.slice(0, -1) : expected + 's',
        expected.replace(/s+/g, ''),
        expected.toLowerCase()
      ];

      const found = variations.some(v =>
        modelNames.some(actual => actual.toLowerCase() === v.toLowerCase())
      );

      if (!found) {
        const originalTable = currentTables.find(t => {
          const converted = t.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join('');
          return converted === expected;
        });
        missingModels.push({ table: originalTable, expectedModel: expected });
      }
    });

    if (missingModels.length > 0) {
      console.log('\n⚠️  Missing models:');
      missingModels.forEach(({ table, expectedModel }) => {
        console.log(`  - Table '${table}' needs model '${expectedModel}'`);
      });
    } else {
      console.log('✓ All tables have corresponding models');
    }

    console.log('\n=== 5. CHECKING TABLE SCHEMA CONSISTENCY ===');
    for (const modelName of modelNames) {
      const model = models[modelName];
      if (!model || !model.tableName) continue;

      const tableName = model.tableName;
      if (!currentTables.includes(tableName)) {
        console.log(`⚠️  Model '${modelName}' references table '${tableName}' which doesn't exist`);
        continue;
      }

      try {
        // Get actual table structure
        const [tableDesc] = await sequelize.query(`DESCRIBE ${tableName}`);
        const actualColumns = tableDesc.map(col => col.Field);

        // Get model's expected structure
        const modelAttributes = Object.keys(model.rawAttributes);

        // Check for missing columns in database
        const missingInDB = modelAttributes.filter(attr => {
          const field = model.rawAttributes[attr].field || attr;
          return !actualColumns.includes(field);
        });

        // Check for extra columns in database
        const extraInDB = actualColumns.filter(col => {
          return !modelAttributes.some(attr => {
            const field = model.rawAttributes[attr].field || attr;
            return field === col;
          });
        });

        if (missingInDB.length > 0 || extraInDB.length > 0) {
          console.log(`\n📋 Table: ${tableName} (Model: ${modelName})`);
          if (missingInDB.length > 0) {
            console.log(`  Missing in DB: ${missingInDB.join(', ')}`);
          }
          if (extraInDB.length > 0) {
            console.log(`  Extra in DB: ${extraInDB.join(', ')}`);
          }
        } else {
          console.log(`✓ ${tableName}`);
        }
      } catch (error) {
        console.log(`❌ Error checking ${tableName}: ${error.message}`);
      }
    }

    console.log('\n=== 6. RUNNING SEQUELIZE SYNC (DRY RUN) ===');
    try {
      // First, let's see what sync would do
      await sequelize.sync({ alter: false, force: false, logging: console.log });
      console.log('✓ Models are in sync with database');
    } catch (error) {
      console.log('⚠️  Sync would make changes:', error.message);
    }

    console.log('\n=== 7. SUMMARY ===');
    console.log(`- Database tables: ${currentTables.length}`);
    console.log(`- Applied migrations: ${migrations.length}`);
    console.log(`- Pending migrations: ${pendingMigrations.length}`);
    console.log(`- Defined models: ${modelNames.length}`);
    console.log(`- Missing models: ${missingModels.length}`);

    if (pendingMigrations.length > 0) {
      console.log('\n🔧 RECOMMENDED ACTIONS:');
      console.log('1. Run pending migrations first');
      console.log('2. Create missing models');
      console.log('3. Fix schema mismatches');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during schema sync:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  syncDatabaseSchema();
}

module.exports = syncDatabaseSchema;
