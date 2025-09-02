const sequelize = require('./config/db');
const { QueryTypes } = require('sequelize');

async function addDeliveryFeeField() {
  try {
    // Check if delivery_fee column already exists
    const columns = await sequelize.query(
      "SHOW COLUMNS FROM manufacturers LIKE 'delivery_fee'",
      { type: QueryTypes.SELECT }
    );

    if (columns.length === 0) {
      await sequelize.query(
        `ALTER TABLE manufacturers
         ADD COLUMN delivery_fee DECIMAL(10,2) DEFAULT 0.00
         COMMENT 'Delivery fee charged by manufacturer'`,
        { type: QueryTypes.RAW }
      );
      console.log('✅ delivery_fee column added to manufacturers table');
    } else {
      console.log('⚠️ delivery_fee column already exists in manufacturers table');
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error adding delivery fee field:', error);
    process.exit(1);
  }
}

addDeliveryFeeField();
