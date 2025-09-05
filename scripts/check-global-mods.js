#!/usr/bin/env node
require('dotenv').config();
const sequelize = require('../config/db');

(async () => {
  try {
    const tables = ['global_modification_categories','global_modification_templates','global_modification_assignments'];
    for (const t of tables){
      const [existsRows] = await sequelize.query("SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?", { replacements: [t] });
      const exists = Number((Array.isArray(existsRows)?existsRows[0]?.c:existsRows?.c)||0) > 0;
      console.log(`Table ${t}:`, exists ? 'YES' : 'NO');
      if (exists){
        const [cols] = await sequelize.query("SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION", { replacements: [t] });
        console.table(cols);
      }
    }
  } catch (e) {
    console.error('Check error:', e);
  } finally {
    await sequelize.close();
  }
})();
