'use strict';
// Adds is_deleted boolean to resource_links (and resource_files if somehow missing) for soft-delete filtering.
// Idempotent.
module.exports = {
  async up(qi, Sequelize) {
    const sequelize = qi.sequelize;
    async function hasTable(t){
      const [r] = await sequelize.query("SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?", { replacements: [t]});
      return Number((Array.isArray(r)?r[0]?.c:r?.c)||0) > 0;
    }
    async function hasColumn(t,c){
      const [r] = await sequelize.query("SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?", { replacements: [t,c]});
      return Number((Array.isArray(r)?r[0]?.c:r?.c)||0) > 0;
    }

    if (await hasTable('resource_links')) {
      if (!(await hasColumn('resource_links','is_deleted'))) {
        try {
          // Determine safest placement: prefer AFTER visible_to_group_ids if it exists, else after visible_to_group_types, else no ordering
          let positionClause = '';
          if (await hasColumn('resource_links','visible_to_group_ids')) {
            positionClause = ' AFTER visible_to_group_ids';
          } else if (await hasColumn('resource_links','visible_to_group_types')) {
            positionClause = ' AFTER visible_to_group_types';
          } // else leave blank to append at end
          await sequelize.query(`ALTER TABLE resource_links ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0${positionClause}`);
          console.log('[MIGRATE] Added is_deleted to resource_links');
        } catch(e){ if(!/Duplicate column/.test(e.message)) throw e; }
      }
    } else {
      console.warn('[MIGRATE] resource_links table missing; skipping is_deleted add');
    }

    if (await hasTable('resource_files')) {
      if (!(await hasColumn('resource_files','is_deleted'))) {
        try {
          let positionClause = '';
            if (await hasColumn('resource_files','mime_type')) {
              positionClause = ' AFTER mime_type';
            } else if (await hasColumn('resource_files','file_type')) {
              positionClause = ' AFTER file_type';
            }
          await sequelize.query(`ALTER TABLE resource_files ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0${positionClause}`);
          console.log('[MIGRATE] Added is_deleted to resource_files (backfill)');
        } catch(e){ if(!/Duplicate column/.test(e.message)) throw e; }
      }
    }
  },
  async down(){
    // Non-destructive; retain soft delete semantic.
    return Promise.resolve();
  }
};
