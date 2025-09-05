const sequelize = require('../config/db');
(async () => {
  try {
    const [rows] = await sequelize.query('SHOW INDEX FROM global_modification_categories');
    console.log(rows.map(r => ({ Key_name: r.Key_name, Non_unique: r.Non_unique, Seq_in_index: r.Seq_in_index, Column_name: r.Column_name })));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
