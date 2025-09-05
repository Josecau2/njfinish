const sequelize = require('./config/db');

async function verifySchema() {
  try {
    // Check templates table
    const [templateRows] = await sequelize.query('DESCRIBE global_modification_templates');
    console.log('✅ Templates table schema:');
    templateRows.forEach(r => {
      console.log(`  - ${r.Field}: ${r.Type} ${r.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${r.Default ? 'DEFAULT ' + r.Default : ''}`);
    });

    // Check categories table
    const [categoryRows] = await sequelize.query('DESCRIBE global_modification_categories');
    console.log('\n✅ Categories table schema:');
    categoryRows.forEach(r => {
      console.log(`  - ${r.Field}: ${r.Type} ${r.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${r.Default ? 'DEFAULT ' + r.Default : ''}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Schema verification failed:', error);
    process.exit(1);
  }
}

verifySchema();
