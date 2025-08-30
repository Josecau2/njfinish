const sequelize = require('./config/db');
const { QueryTypes } = require('sequelize');

async function updateETAFieldsToString() {
  try {
    console.log('Updating ETA fields to VARCHAR...');
    
    // Modify assembled_eta_days column to VARCHAR
    await sequelize.query(`
      ALTER TABLE manufacturers 
      MODIFY COLUMN assembled_eta_days VARCHAR(255) NULL 
      COMMENT 'Estimated delivery time for assembled items'
    `, { type: QueryTypes.RAW });
    
    console.log('✓ Updated assembled_eta_days to VARCHAR');
    
    // Modify unassembled_eta_days column to VARCHAR
    await sequelize.query(`
      ALTER TABLE manufacturers 
      MODIFY COLUMN unassembled_eta_days VARCHAR(255) NULL 
      COMMENT 'Estimated delivery time for unassembled items'
    `, { type: QueryTypes.RAW });
    
    console.log('✓ Updated unassembled_eta_days to VARCHAR');
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration
updateETAFieldsToString();
