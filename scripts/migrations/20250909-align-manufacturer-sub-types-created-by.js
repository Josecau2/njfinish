// Align manufacturer_sub_types created_by column naming with model (created_by_user_id) and timestamps
'use strict';

module.exports = {
  async up(qi){
    const sequelize = qi.sequelize;
    async function hasColumn(table,col){
      const [r] = await sequelize.query("SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?", { replacements: [table, col] });
      return Number((Array.isArray(r)?r[0]?.c:r?.c)||0) > 0;
    }
    // If legacy created_by exists and new does not, rename
    const table = 'manufacturer_sub_types';
    const legacy = await hasColumn(table,'created_by');
    const desired = await hasColumn(table,'created_by_user_id');
    if (legacy && !desired){
      try { await qi.renameColumn(table,'created_by','created_by_user_id'); } catch(e){ if(!/Duplicate column|Unknown column/.test(e.message)) throw e; }
    }
    // Ensure timestamps are camelCase to match Sequelize default (if snake_case present)
    const hasCreatedAt = await hasColumn(table,'createdAt');
    const hasCreated_at = await hasColumn(table,'created_at');
    if (!hasCreatedAt && hasCreated_at){
      try { await qi.renameColumn(table,'created_at','createdAt'); } catch(e){ /* ignore */ }
    }
    const hasUpdatedAt = await hasColumn(table,'updatedAt');
    const hasUpdated_at = await hasColumn(table,'updated_at');
    if (!hasUpdatedAt && hasUpdated_at){
      try { await qi.renameColumn(table,'updated_at','updatedAt'); } catch(e){ /* ignore */ }
    }
  },
  async down(){ return Promise.resolve(); }
};
