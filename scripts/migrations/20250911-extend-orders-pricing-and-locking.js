'use strict';
// Adds missing pricing / financial / metadata columns to orders table to match models/Order.js
// Idempotent: only adds columns or indexes that are absent.
// Columns covered:
//  parts_cents, assembly_cents, mods_cents, subtotal_before_discount_cents,
//  discount_cents, delivery_cents, tax_cents, tax_rate_pct, discount_pct,
//  m_cost, m_markup, currency, created_by_user_id, locked_at, locked_by_user_id

module.exports = {
  async up(qi, Sequelize) {
    const sequelize = qi.sequelize;

    async function hasTable(name) {
      const [r] = await sequelize.query(
        "SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
        { replacements: [name] }
      );
      return Number((Array.isArray(r) ? r[0]?.c : r?.c) || 0) > 0;
    }

    async function hasColumn(table, col) {
      const [r] = await sequelize.query(
        "SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
        { replacements: [table, col] }
      );
      return Number((Array.isArray(r) ? r[0]?.c : r?.c) || 0) > 0;
    }

    async function hasIndex(table, idx) {
      const [r] = await sequelize.query("SHOW INDEX FROM `" + table + "` WHERE Key_name = ?", { replacements: [idx] });
      return Array.isArray(r) && r.length > 0;
    }

    const table = 'orders';
    if (!(await hasTable(table))) {
      console.warn('[EXTEND ORDERS] Table orders does not exist yet – skipping (earlier migration will create it)');
      return;
    }

    const columns = [
      ['parts_cents', 'INT NULL'],
      ['assembly_cents', 'INT NULL'],
      ['mods_cents', 'INT NULL'],
      ['subtotal_before_discount_cents', 'INT NULL'],
      ['discount_cents', 'INT NULL'],
      ['delivery_cents', 'INT NULL'],
      ['tax_cents', 'INT NULL'],
      ['tax_rate_pct', 'DECIMAL(5,2) NULL'],
      ['discount_pct', 'DECIMAL(5,2) NULL'],
      ['m_cost', 'DECIMAL(10,2) NULL'],
      ['m_markup', 'DECIMAL(5,2) NULL'],
      ['currency', "VARCHAR(3) NULL DEFAULT 'USD'"],
      ['created_by_user_id', 'INT NULL'],
      ['locked_at', 'DATETIME NULL'],
      ['locked_by_user_id', 'INT NULL']
    ];

    const toAdd = [];
    for (const [col, def] of columns) {
      // created_by_user_id may exist already if manually added; skip gracefully
      // currency may have been added with a different default; we won't modify existing definition here
      if (!(await hasColumn(table, col))) {
        toAdd.push(`ADD COLUMN ${col} ${def}`);
      }
    }

    if (toAdd.length) {
      // Chunk to keep individual ALTER statements reasonable
      const batchSize = 8;
      while (toAdd.length) {
        const group = toAdd.splice(0, batchSize);
        const stmt = `ALTER TABLE ${table}\n  ${group.join(',\n  ')};`;
        try {
          await sequelize.query(stmt);
        } catch (e) {
          if (!/Duplicate column/.test(e.message)) throw e;
        }
      }
      console.log('[EXTEND ORDERS] Added missing columns');
    } else {
      console.log('[EXTEND ORDERS] All extended columns already present');
    }

    // Optional helpful index for filtering by created_by_user_id (not defined in model indexes yet)
    if (!(await hasIndex(table, 'idx_orders_created_by_user'))) {
      try {
        await sequelize.query(`CREATE INDEX idx_orders_created_by_user ON ${table} (created_by_user_id)`);
        console.log('[EXTEND ORDERS] Created index idx_orders_created_by_user');
      } catch (e) {
        console.warn('[EXTEND ORDERS] Could not create idx_orders_created_by_user:', e.message);
      }
    }
  },
  async down() {
    // No destructive down to avoid data loss; safe no-op.
    return Promise.resolve();
  }
};
