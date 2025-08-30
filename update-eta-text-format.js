const sequelize = require('./config/db');
const { QueryTypes } = require('sequelize');

async function updateETAToTextFormat() {
  try {
    console.log('Updating ETA data to text format...');
    
    // Update Jose Fleitas with text format ETA
    await sequelize.query(`
      UPDATE manufacturers 
      SET assembled_eta_days = '7-8 days', unassembled_eta_days = '3-5 days'
      WHERE name = 'Jose Fleitas'
    `, { type: QueryTypes.UPDATE });
    
    console.log('✅ Updated Jose Fleitas ETA to text format!');
    
    // Verify the update
    const manufacturers = await sequelize.query(`
      SELECT name, assembled_eta_days, unassembled_eta_days 
      FROM manufacturers 
      WHERE name = 'Jose Fleitas'
    `, { type: QueryTypes.SELECT });
    
    console.log('📋 Updated manufacturer:');
    manufacturers.forEach(m => {
      console.log(`  - ${m.name}: Assembled="${m.assembled_eta_days}", Unassembled="${m.unassembled_eta_days}"`);
    });
    
  } catch (error) {
    console.error('❌ Error updating data:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the script
updateETAToTextFormat();
