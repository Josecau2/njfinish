/*
  Quick diagnostic to inspect modification-related data in the database.
  - Lists tables containing "modif" in their name
  - Prints counts and a few recent rows (joins catalog data when available)
*/
const sequelize = require('../config/db');

async function listModTables(dbName) {
  const [rows] = await sequelize.query(
    'SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_name LIKE ? ORDER BY table_name',
    { replacements: [dbName, '%modif%'] }
  );
  return rows.map(r => r.table_name);
}

async function countTable(table) {
  try {
    const [[row]] = await sequelize.query(`SELECT COUNT(*) as cnt FROM \`${table}\``);
    return row.cnt || 0;
  } catch (e) {
    return 0;
  }
}

async function sampleRows(table, limit = 5) {
  try {
    const [rows] = await sequelize.query(`SELECT * FROM \`${table}\` ORDER BY 1 DESC LIMIT ${limit}`);
    return rows;
  } catch (e) {
    return [];
  }
}

async function sampleManufacturerModifications(limit = 25) {
  // Pretty join to show catalog code/description if the table exists
  const sql = `
    SELECT mmd.id, mmd.catalog_data_id, mmd.modification_name, mmd.price, mmd.description, mmd.notes,
           mmd.created_at, mmd.updated_at,
           mcd.code AS catalog_code, mcd.description AS catalog_description, mcd.style AS catalog_style
    FROM manufacturer_modification_details mmd
    LEFT JOIN manufacturer_catalog_data mcd ON mmd.catalog_data_id = mcd.id
    ORDER BY mmd.updated_at DESC
    LIMIT ${limit}
  `;
  try {
    const [rows] = await sequelize.query(sql);
    return rows;
  } catch (e) {
    return [];
  }
}

async function main() {
  try {
    await sequelize.authenticate();
    const dbName = sequelize.config?.database;
    console.log('Connected to DB:', dbName);

    const tables = await listModTables(dbName);
    if (!tables.length) {
      console.log('No tables matching %modif% found in schema:', dbName);
    } else {
      console.log('\nModification-related tables:');
      for (const t of tables) {
        const cnt = await countTable(t);
        console.log(`- ${t}: ${cnt} rows`);
      }
      console.log('');
      for (const t of tables) {
        const rows = await sampleRows(t, 5);
        if (rows.length) {
          console.log(`Sample rows from ${t}:`);
          console.table(rows);
        }
      }
    }

    // Specific manufacturer modification details, if present
    const manMods = await sampleManufacturerModifications(25);
    if (manMods.length) {
      console.log('\nLatest manufacturer_modification_details:');
      console.table(manMods);
    } else {
      console.log('\nNo rows found in manufacturer_modification_details or table missing.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sequelize.close().catch(() => {});
  }
}

main();
