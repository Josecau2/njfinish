const sequelize = require('./config/db');
const migration = require('./scripts/migrations/20250903-blueprint-manufacturer-isolation');

async function runMigration() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    await migration.up({ context: null });
    console.log('✅ Migration completed successfully');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
