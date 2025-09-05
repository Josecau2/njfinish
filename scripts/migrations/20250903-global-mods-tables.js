'use strict';

// Creates global_modification_* tables if missing and adds image column.

module.exports = {
  async up({ context: qi }) {
    const sequelize = qi.sequelize;

    // helper: check table exists
    async function hasTable(name){
      const [rows] = await sequelize.query("SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?", { replacements: [name] });
      const c = Array.isArray(rows) ? rows[0]?.c : rows?.c; return Number(c||0) > 0;
    }
    // helper: check column exists
    async function hasColumn(table, col){
      const [rows] = await sequelize.query("SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?", { replacements: [table, col] });
      const c = Array.isArray(rows) ? rows[0]?.c : rows?.c; return Number(c||0) > 0;
    }

    // Categories
    if (!(await hasTable('global_modification_categories'))){
      await sequelize.query(`
        CREATE TABLE global_modification_categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          order_index INT NOT NULL DEFAULT 0,
          image VARCHAR(255) NULL,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          INDEX idx_gmcat_order (order_index)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    } else if (!(await hasColumn('global_modification_categories','image'))){
      await sequelize.query('ALTER TABLE global_modification_categories ADD COLUMN image VARCHAR(255) NULL AFTER order_index');
    }

    // Templates
    if (!(await hasTable('global_modification_templates'))){
      await sequelize.query(`
        CREATE TABLE global_modification_templates (
          id INT AUTO_INCREMENT PRIMARY KEY,
          category_id INT NULL,
          name VARCHAR(255) NOT NULL,
          default_price DECIMAL(10,2) NULL,
          fields_config JSON NULL,
          sample_image VARCHAR(255) NULL,
          is_ready TINYINT(1) NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          INDEX idx_gmt_cat (category_id),
          CONSTRAINT fk_gmt_cat FOREIGN KEY (category_id) REFERENCES global_modification_categories(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    }

    // Assignments
    if (!(await hasTable('global_modification_assignments'))){
      await sequelize.query(`
        CREATE TABLE global_modification_assignments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          template_id INT NOT NULL,
          manufacturer_id INT NOT NULL,
          scope ENUM('all','style','type','item') NOT NULL DEFAULT 'all',
          target_style VARCHAR(100) NULL,
          target_type VARCHAR(100) NULL,
          catalog_data_id INT NULL,
          override_price DECIMAL(10,2) NULL,
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          INDEX idx_gma_tpl (template_id),
          INDEX idx_gma_manu (manufacturer_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    }
  },

  async down({ context: qi }) {
    // Non-destructive rollback: do nothing (keep data).
    return Promise.resolve();
  }
};
