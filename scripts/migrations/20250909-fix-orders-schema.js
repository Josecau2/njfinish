// Backfill missing columns on orders table (some earlier placeholder migrations were no-ops)
// Idempotent: only adds columns or indexes if absent.
'use strict';

module.exports = {
  async up(qi) {
    const sequelize = qi.sequelize;
    async function hasTable(name){
      const [r] = await sequelize.query("SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?", { replacements: [name] });
      return Number((Array.isArray(r)?r[0]?.c:r?.c)||0) > 0;
    }
    async function hasColumn(table,col){
      const [r] = await sequelize.query("SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?", { replacements: [table, col] });
      return Number((Array.isArray(r)?r[0]?.c:r?.c)||0) > 0;
    }
    async function hasIndex(table, idx){
      const [r] = await sequelize.query("SHOW INDEX FROM `"+table+"` WHERE Key_name = ?", { replacements: [idx] });
      return Array.isArray(r) && r.length > 0;
    }
    const table = 'orders';
    if (!(await hasTable(table))) {
      console.warn('[ORDERS FIX] orders table missing entirely; creating minimal schema');
      await sequelize.query(`CREATE TABLE orders ( id INT AUTO_INCREMENT PRIMARY KEY ) ENGINE=InnoDB;`);
    }
    // Collect missing columns and add in as few ALTERs as possible
    const desired = [
      ['proposal_id','INT NULL'],
      ['owner_group_id','INT NULL'],
      ['customer_id','INT NULL'],
      ['manufacturer_id','INT NULL'],
      ['style_id','INT NULL'],
      ['style_name','VARCHAR(255) NULL'],
      ["status","ENUM('new','processing','completed','canceled') NOT NULL DEFAULT 'new'"],
      ['accepted_at','DATETIME NULL'],
      ['accepted_by_user_id','INT NULL'],
      ['accepted_by_label','VARCHAR(255) NULL'],
      ['grand_total_cents','INT NULL'],
      ['snapshot','JSON NULL'],
      ['createdAt','DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'],
      ['updatedAt','DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP']
    ];
    const toAdd = [];
    for (const [col, def] of desired){
      if (!(await hasColumn(table, col))) toAdd.push(`ADD COLUMN ${col} ${def}`);
    }
    if (toAdd.length){
      const chunked = [];
      // MySQL allows many, but keep statement length sane
      while (toAdd.length) chunked.push(toAdd.splice(0, 8));
      for (const group of chunked){
        const stmt = `ALTER TABLE ${table} \n  ${group.join(',\n  ')};`;
        try { await sequelize.query(stmt); } catch(e){
          if(!/Duplicate column/.test(e.message)) throw e;
        }
      }
    }
    // Indexes
    const idxs = [ ['idx_orders_proposal','proposal_id'], ['idx_orders_owner_group','owner_group_id'], ['idx_orders_customer','customer_id'] ];
    for (const [idx, col] of idxs){
      if (!(await hasIndex(table, idx))){
        try { await sequelize.query(`CREATE INDEX ${idx} ON ${table} (${col})`); } catch(e){ /* ignore duplicates */ }
      }
    }
  },
  async down(){ return Promise.resolve(); }
};
