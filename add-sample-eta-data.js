const sequelize = require('./config/db');
const { QueryTypes } = require('sequelize');

async function addSampleETAData() {
  try {
    console.log('Adding sample ETA data to manufacturers...');
    
    // Update existing manufacturers with sample ETA data
    await sequelize.query(`
      UPDATE manufacturers 
      SET assembled_eta_days = 14, unassembled_eta_days = 7
      WHERE name = 'Jose Fleitas'
    `, { type: QueryTypes.UPDATE });
    
    await sequelize.query(`
      UPDATE manufacturers 
      SET assembled_eta_days = 21, unassembled_eta_days = 10
      WHERE name = 'Test CSV Manufacturer'
    `, { type: QueryTypes.UPDATE });
    
    await sequelize.query(`
      UPDATE manufacturers 
      SET assembled_eta_days = 10, unassembled_eta_days = 5
      WHERE name = 'CSV Limit Test Manufacturer'
    `, { type: QueryTypes.UPDATE });
    
    console.log('✅ Sample ETA data added successfully!');
    
    // Verify the data
    const manufacturers = await sequelize.query(`
      SELECT name, assembled_eta_days, unassembled_eta_days 
      FROM manufacturers 
      WHERE assembled_eta_days IS NOT NULL
    `, { type: QueryTypes.SELECT });
    
    console.log('📋 Manufacturers with ETA data:');
    manufacturers.forEach(m => {
      console.log(`  - ${m.name}: Assembled=${m.assembled_eta_days} days, Unassembled=${m.unassembled_eta_days} days`);
    });
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the script
addSampleETAData();
