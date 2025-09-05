// One-time migration to ensure `image` column exists on global_modification_categories
// Usage: node add-global-mod-category-image-column.js

const sequelize = require('./config/db');

async function hasColumn(tableName, columnName) {
  try {
    const [rows] = await sequelize.query(
      'SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      { replacements: [tableName, columnName] }
    );
    const cnt = Array.isArray(rows) ? rows[0]?.cnt : rows?.cnt;
    return !!Number(cnt || 0);
  } catch (e) {
    console.error('Failed to check column existence:', e.message);
    return false;
  }
}

(async () => {
  const table = 'global_modification_categories';
  const column = 'image';
  try {
    const exists = await hasColumn(table, column);
    if (exists) {
      console.log(`[ok] Column \`${column}\` already exists on \`${table}\`.`);
      process.exit(0);
    }
    console.log(`[info] Adding column \`${column}\` to \`${table}\` ...`);
    await sequelize.query(`ALTER TABLE ${table} ADD COLUMN ${column} VARCHAR(255) NULL AFTER order_index`);
    console.log('[success] Column added.');
  } catch (e) {
    console.error('[error] Migration failed:', e.message);
    process.exitCode = 1;
  } finally {
    try { await sequelize.close(); } catch (_) {}
  }
})();
