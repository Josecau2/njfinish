const sequelize = require('./config/db');

async function checkProposalsTable() {
  try {
    const [rows] = await sequelize.query('DESCRIBE proposals');
    console.log('Proposals table columns:');
    rows.forEach(r => console.log(`  ${r.Field} - ${r.Type}`));

    // Check specifically for our new columns
    const newColumns = ['order_snapshot', 'locked_pricing', 'locked_at', 'locked_by_user_id', 'migrated_to_sections'];
    console.log('\nNew columns status:');
    newColumns.forEach(col => {
      const exists = rows.find(r => r.Field === col);
      console.log(`  ${col}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    });

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkProposalsTable();
