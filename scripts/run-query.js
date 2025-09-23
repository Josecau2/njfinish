const sequelize = require('../config/db');

(async () => {
  try {
    const sql = process.argv.slice(2).join(' ');
    if (!sql) {
      console.error('Usage: node scripts/run-query.js <SQL>');
      process.exit(1);
    }
    const [rows] = await sequelize.query(sql);
    console.log(JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
