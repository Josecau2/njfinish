const sequelize = require('./config/db');
const { QueryTypes } = require('sequelize');

async function checkETAFields() {
  try {
    console.log('Checking current ETA fields in database...');
    
    // Check the current data
    const manufacturers = await sequelize.query(`
      SELECT id, name, assembled_eta_days, unassembled_eta_days 
      FROM manufacturers 
      WHERE name = 'Jose Fleitas'
    `, { type: QueryTypes.SELECT });
    
    console.log('📋 Current Jose Fleitas data:');
    manufacturers.forEach(m => {
      console.log(`  - ID: ${m.id}`);
      console.log(`  - Name: ${m.name}`);
      console.log(`  - Assembled ETA: "${m.assembled_eta_days}"`);
      console.log(`  - Unassembled ETA: "${m.unassembled_eta_days}"`);
    });
    
    // Check the table structure
    console.log('\n🔍 Checking table structure...');
    const columns = await sequelize.query(`
      DESCRIBE manufacturers
    `, { type: QueryTypes.SELECT });
    
    const etaColumns = columns.filter(col => 
      col.Field.includes('eta') || col.Field.includes('assembled') || col.Field.includes('unassembled')
    );
    
    console.log('ETA-related columns:');
    etaColumns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking ETA fields:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkETAFields();
