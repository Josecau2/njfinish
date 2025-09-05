const sequelize = require('./config/db');

async function checkSchema() {
  try {
    await sequelize.authenticate();
    console.log('✓ DB connected');

    // Check global modification tables
    const [rows] = await sequelize.query('SHOW TABLES LIKE "global_modification_%"');
    console.log('\nGlobal mod tables:', rows.map(r => Object.values(r)[0]));

    for (const t of rows) {
      const tname = Object.values(t)[0];
      const [cols] = await sequelize.query(`DESCRIBE ${tname}`);
      console.log(`\n${tname}:`);
      cols.forEach(c => console.log(`  ${c.Field} ${c.Type} ${c.Null} ${c.Key} ${c.Default || ''}`));
    }

    process.exit(0);
  } catch (e) {
    console.log('ERR', e.message);
    process.exit(1);
  }
}

checkSchema();
