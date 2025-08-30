const sequelize = require('./config/db');
const { QueryTypes } = require('sequelize');

async function addManufacturerETAFields() {
  try {
    console.log('Adding ETA fields to manufacturers table...');
    
    // Add assembled_eta_days column
    await sequelize.query(`
      ALTER TABLE manufacturers 
      ADD COLUMN assembled_eta_days INT NULL 
      COMMENT 'Estimated delivery time in days for assembled items'
    `, { type: QueryTypes.RAW });
    
    console.log('✓ Added assembled_eta_days column');
    
    // Add unassembled_eta_days column
    await sequelize.query(`
      ALTER TABLE manufacturers 
      ADD COLUMN unassembled_eta_days INT NULL 
      COMMENT 'Estimated delivery time in days for unassembled items'
    `, { type: QueryTypes.RAW });
    
    console.log('✓ Added unassembled_eta_days column');
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('⚠️  Columns already exist, skipping migration');
    } else {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  } finally {
    await sequelize.close();
  }
}

// Run the migration
addManufacturerETAFields();
