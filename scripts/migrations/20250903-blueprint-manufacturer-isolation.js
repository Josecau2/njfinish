'use strict';

// Adds blueprint/manufacturer isolation fields to global_modification_templates
// and scope/manufacturer fields to global_modification_categories

module.exports = {
  async up({ context: qi }) {
    const sequelize = qi ? qi.sequelize : require('../../config/db');

    // helper: check column exists
    async function hasColumn(table, col){
      const [rows] = await sequelize.query("SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?", { replacements: [table, col] });
      const c = Array.isArray(rows) ? rows[0]?.c : rows?.c; return Number(c||0) > 0;
    }

    // Add blueprint/manufacturer isolation fields to templates
    if (!(await hasColumn('global_modification_templates', 'is_blueprint'))) {
      await sequelize.query('ALTER TABLE global_modification_templates ADD COLUMN is_blueprint TINYINT(1) NOT NULL DEFAULT 0 AFTER name');
    }

    if (!(await hasColumn('global_modification_templates', 'manufacturer_id'))) {
      await sequelize.query('ALTER TABLE global_modification_templates ADD COLUMN manufacturer_id INT NULL AFTER is_blueprint');
    }

    // Rename default_price to price_cents for clarity and convert to integer cents
    if (await hasColumn('global_modification_templates', 'default_price') && !(await hasColumn('global_modification_templates', 'price_cents'))) {
      // Add new column
      await sequelize.query('ALTER TABLE global_modification_templates ADD COLUMN price_cents INT NULL AFTER manufacturer_id');

      // Migrate data: convert decimal dollars to integer cents
      await sequelize.query('UPDATE global_modification_templates SET price_cents = ROUND(default_price * 100) WHERE default_price IS NOT NULL');

      // Drop old column
      await sequelize.query('ALTER TABLE global_modification_templates DROP COLUMN default_price');
    }

    // Add scope and manufacturer_id to categories for proper scoping
    if (!(await hasColumn('global_modification_categories', 'scope'))) {
      await sequelize.query('ALTER TABLE global_modification_categories ADD COLUMN scope ENUM(\'gallery\', \'manufacturer\') NOT NULL DEFAULT \'gallery\' AFTER name');
    }

    if (!(await hasColumn('global_modification_categories', 'manufacturer_id'))) {
      await sequelize.query('ALTER TABLE global_modification_categories ADD COLUMN manufacturer_id INT NULL AFTER scope');
    }

    // Add description field to categories
    if (!(await hasColumn('global_modification_categories', 'description'))) {
      await sequelize.query('ALTER TABLE global_modification_categories ADD COLUMN description TEXT NULL AFTER image');
    }

    // Add indexes for new fields
    try {
      await sequelize.query('CREATE INDEX idx_gmt_blueprint ON global_modification_templates (is_blueprint, manufacturer_id)');
    } catch (e) {
      // Index might already exist
    }

    try {
      await sequelize.query('CREATE INDEX idx_gmcat_scope ON global_modification_categories (scope, manufacturer_id)');
    } catch (e) {
      // Index might already exist
    }

    // Add unique constraint for category scoping: (scope, manufacturer_id, name) must be unique
    try {
      await sequelize.query('CREATE UNIQUE INDEX idx_gmcat_unique_scope_name ON global_modification_categories (scope, manufacturer_id, name)');
    } catch (e) {
      // Constraint might already exist
    }

    console.log('✅ Schema migration completed: Added blueprint/manufacturer isolation fields');
  },

  async down({ context: qi }) {
    // Non-destructive rollback: do nothing (keep data).
    return Promise.resolve();
  }
};
