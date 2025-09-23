const sequelize = require('../config/db');

async function columnExists(table, column) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    { replacements: [table, column] }
  );
  return Number(rows[0]?.cnt || 0) > 0;
}

async function ensureColumn(table, column, definition) {
  if (await columnExists(table, column)) {
    return false;
  }
  await sequelize.query(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
  return true;
}

async function ensureTable(sql) {
  await sequelize.query(sql);
}

async function triggerExists(name) {
  const [rows] = await sequelize.query(
    'SELECT COUNT(*) AS cnt FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE() AND TRIGGER_NAME = ?',
    { replacements: [name] }
  );
  return Number(rows[0]?.cnt || 0) > 0;
}

async function recreateTrigger(name, sql) {
  if (await triggerExists(name)) {
    await sequelize.query(`DROP TRIGGER IF EXISTS \`${name}\``);
  } else {
    await sequelize.query(`DROP TRIGGER IF EXISTS \`${name}\``);
  }
  await sequelize.query(sql);
}

async function ensureTimestampMirrors(table, camelCreated = 'createdAt', camelUpdated = 'updatedAt') {
  await ensureColumn(table, 'created_at', 'created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
  await ensureColumn(table, 'updated_at', 'updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

  await sequelize.query(`UPDATE ${table} SET created_at = ${camelCreated} WHERE ${camelCreated} IS NOT NULL`);
  await sequelize.query(`UPDATE ${table} SET updated_at = ${camelUpdated} WHERE ${camelUpdated} IS NOT NULL`);

  const insertTriggerName = `bi_${table}_sync_timestamps`;
  const updateTriggerName = `bu_${table}_sync_timestamps`;

  const insertTriggerSql = `CREATE TRIGGER \`${insertTriggerName}\`
    BEFORE INSERT ON ${table}
    FOR EACH ROW
    BEGIN
      SET NEW.${camelCreated} = COALESCE(NEW.${camelCreated}, NEW.created_at, NOW());
      SET NEW.created_at = COALESCE(NEW.created_at, NEW.${camelCreated}, NOW());
      SET NEW.${camelUpdated} = COALESCE(NEW.${camelUpdated}, NEW.updated_at, NEW.${camelCreated});
      SET NEW.updated_at = COALESCE(NEW.updated_at, NEW.${camelUpdated}, NEW.${camelCreated});
    END`;

  const updateTriggerSql = `CREATE TRIGGER \`${updateTriggerName}\`
    BEFORE UPDATE ON ${table}
    FOR EACH ROW
    BEGIN
      SET NEW.${camelCreated} = COALESCE(NEW.${camelCreated}, NEW.created_at, OLD.${camelCreated}, NOW());
      SET NEW.created_at = COALESCE(NEW.created_at, NEW.${camelCreated}, OLD.created_at, NOW());
      SET NEW.${camelUpdated} = COALESCE(NEW.${camelUpdated}, NEW.updated_at, NEW.${camelCreated}, OLD.${camelUpdated}, NOW());
      SET NEW.updated_at = COALESCE(NEW.updated_at, NEW.${camelUpdated}, NEW.created_at, OLD.updated_at, NOW());
    END`;

  await recreateTrigger(insertTriggerName, insertTriggerSql);
  await recreateTrigger(updateTriggerName, updateTriggerSql);
}

async function run() {
  const results = [];

  // categories
  results.push({ step: 'categories.categoryId', changed: await ensureColumn('categories', 'categoryId', "categoryId VARCHAR(255) NULL AFTER id") });
  results.push({ step: 'categories.type', changed: await ensureColumn('categories', 'type', "type VARCHAR(255) NOT NULL DEFAULT 'legacy'") });
  results.push({ step: 'categories.isDeleted', changed: await ensureColumn('categories', 'isDeleted', "isDeleted TINYINT(1) NOT NULL DEFAULT 0") });
  results.push({ step: 'categories.presentAtAllLocations', changed: await ensureColumn('categories', 'presentAtAllLocations', "presentAtAllLocations TINYINT(1) NOT NULL DEFAULT 0") });
  results.push({ step: 'categories.categoryType', changed: await ensureColumn('categories', 'categoryType', "categoryType VARCHAR(255) NULL") });
  results.push({ step: 'categories.isTopLevel', changed: await ensureColumn('categories', 'isTopLevel', "isTopLevel TINYINT(1) NOT NULL DEFAULT 0") });
  results.push({ step: 'categories.onlineVisibility', changed: await ensureColumn('categories', 'onlineVisibility', "onlineVisibility TINYINT(1) NOT NULL DEFAULT 1") });
  results.push({ step: 'categories.createdAt', changed: await ensureColumn('categories', 'createdAt', "createdAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP") });
  results.push({ step: 'categories.updatedAt', changed: await ensureColumn('categories', 'updatedAt', "updatedAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") });

  await sequelize.query("UPDATE categories SET categoryId = CONCAT('legacy-', id) WHERE categoryId IS NULL");
  await sequelize.query("ALTER TABLE categories MODIFY COLUMN categoryId VARCHAR(255) NOT NULL");

  // customizations
  await ensureColumn('customizations', 'headerBg', "headerBg VARCHAR(255) NOT NULL DEFAULT '#ffffff'");
  await ensureColumn('customizations', 'headerFontColor', "headerFontColor VARCHAR(255) NOT NULL DEFAULT '#333333'");
  await ensureColumn('customizations', 'sidebarBg', "sidebarBg VARCHAR(255) NOT NULL DEFAULT '#212631'");
  await ensureColumn('customizations', 'sidebarFontColor', "sidebarFontColor VARCHAR(255) NOT NULL DEFAULT '#ffffff'");
  await ensureColumn('customizations', 'logoText', "logoText VARCHAR(255) NULL");
  await ensureColumn('customizations', 'logoBg', "logoBg VARCHAR(255) NULL");
  await ensureColumn('customizations', 'logoImage', "logoImage TEXT NULL");
  await ensureColumn('customizations', 'createdAt', "createdAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP");
  await ensureColumn('customizations', 'updatedAt', "updatedAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

  // global_modification_categories
  await ensureColumn('global_modification_categories', 'scope', "scope ENUM('gallery','manufacturer') NOT NULL DEFAULT 'gallery'");
  await ensureColumn('global_modification_categories', 'manufacturer_id', "manufacturer_id INT NULL");
  await ensureColumn('global_modification_categories', 'order_index', "order_index INT NOT NULL DEFAULT 0");

  // login_customizations
  await ensureColumn('login_customizations', 'title', "title VARCHAR(255) NULL");
  await ensureColumn('login_customizations', 'subtitle', "subtitle VARCHAR(255) NULL");
  await ensureColumn('login_customizations', 'backgroundColor', "backgroundColor VARCHAR(255) NULL");
  await ensureColumn('login_customizations', 'showForgotPassword', "showForgotPassword TINYINT(1) NOT NULL DEFAULT 1");
  await ensureColumn('login_customizations', 'showKeepLoggedIn', "showKeepLoggedIn TINYINT(1) NOT NULL DEFAULT 1");
  await ensureColumn('login_customizations', 'rightTitle', "rightTitle VARCHAR(255) NULL");
  await ensureColumn('login_customizations', 'rightSubtitle', "rightSubtitle VARCHAR(255) NULL");
  await ensureColumn('login_customizations', 'rightTagline', "rightTagline VARCHAR(255) NULL");
  await ensureColumn('login_customizations', 'rightDescription', "rightDescription TEXT NULL");
  await ensureColumn('login_customizations', 'createdAt', "createdAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP");
  await ensureColumn('login_customizations', 'updatedAt', "updatedAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

  // manufacturer_catalog_files
  await ensureColumn('manufacturer_catalog_files', 'filename', "filename VARCHAR(255) NULL");
  await ensureColumn('manufacturer_catalog_files', 'file_path', "file_path VARCHAR(512) NULL");
  await ensureColumn('manufacturer_catalog_files', 'mimetype', "mimetype VARCHAR(255) NULL");
  await ensureColumn('manufacturer_catalog_files', 'createdAt', "createdAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP");
  await ensureColumn('manufacturer_catalog_files', 'updatedAt', "updatedAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

  await sequelize.query("UPDATE manufacturer_catalog_files SET filename = file_name WHERE filename IS NULL");

  // pdf_customizations
  await ensureColumn('pdf_customizations', 'vendor_id', "vendor_id INT NULL");
  await ensureColumn('pdf_customizations', 'pdfHeader', "pdfHeader VARCHAR(255) NULL");
  await ensureColumn('pdf_customizations', 'pdfFooter', "pdfFooter TEXT NULL");
  await ensureColumn('pdf_customizations', 'headerLogo', "headerLogo VARCHAR(255) NULL");
  await ensureColumn('pdf_customizations', 'companyName', "companyName VARCHAR(255) NULL");
  await ensureColumn('pdf_customizations', 'companyPhone', "companyPhone VARCHAR(50) NULL");
  await ensureColumn('pdf_customizations', 'companyEmail', "companyEmail VARCHAR(255) NULL");
  await ensureColumn('pdf_customizations', 'companyWebsite', "companyWebsite VARCHAR(255) NULL");
  await ensureColumn('pdf_customizations', 'companyAddress', "companyAddress TEXT NULL");
  await ensureColumn('pdf_customizations', 'headerBgColor', "headerBgColor VARCHAR(50) NULL");
  await ensureColumn('pdf_customizations', 'headerTxtColor', "headerTxtColor VARCHAR(50) NULL");
  await ensureColumn('pdf_customizations', 'isDeleted', "isDeleted TINYINT(1) NOT NULL DEFAULT 0");
  await ensureColumn('pdf_customizations', 'createdAt', "createdAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP");
  await ensureColumn('pdf_customizations', 'updatedAt', "updatedAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

  // proposal_statuses table
  await ensureTable(`CREATE TABLE IF NOT EXISTS proposal_statuses (
    id INT NOT NULL AUTO_INCREMENT,
    label VARCHAR(255) NOT NULL,
    value VARCHAR(255) NOT NULL UNIQUE,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  // Mirror snake_case timestamps for compatibility scripts
  await ensureTimestampMirrors('users');
  await ensureTimestampMirrors('customers');
  await ensureTimestampMirrors('proposals');
  await ensureTimestampMirrors('orders');
  await ensureTimestampMirrors('manufacturers');

  console.log('Schema fixes applied successfully');
  await sequelize.close();
}

run().catch(async (err) => {
  console.error('Schema fixes failed:', err.message);
  try { await sequelize.close(); } catch (_) {}
  process.exit(1);
});
