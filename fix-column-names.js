const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAndFixColumnNames() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'njcabinets_db',
    port: process.env.DB_PORT || 3306
  });

  const tables = [
    'manufacturer_hinges_details',
    'manufacturer_modification_details',
    'catalog_sub_type_assignments',
    'manufacturer_assembly_costs'
  ];

  console.log('🔍 Checking column names in target tables...\n');

  for (const table of tables) {
    try {
      console.log(`📋 Table: ${table}`);
      const [columns] = await connection.execute(`DESCRIBE ${table}`);

      const camelCaseColumns = columns.filter(col =>
        col.Field.includes('createdAt') || col.Field.includes('updatedAt')
      );

      if (camelCaseColumns.length > 0) {
        console.log('  ❌ Found camelCase columns that need fixing:');
        camelCaseColumns.forEach(col => console.log(`    - ${col.Field} (${col.Type})`));

        // Generate ALTER TABLE commands
        console.log('  🔧 SQL commands to fix:');
        camelCaseColumns.forEach(col => {
          const snakeCaseName = col.Field === 'createdAt' ? 'created_at' : 'updated_at';
          console.log(`    ALTER TABLE ${table} CHANGE ${col.Field} ${snakeCaseName} ${col.Type}${col.Null === 'NO' ? ' NOT NULL' : ''}${col.Default ? ` DEFAULT ${col.Default}` : ''}${col.Extra ? ` ${col.Extra}` : ''};`);
        });
      } else {
        console.log('  ✅ No camelCase timestamp columns found');
      }
      console.log('');

    } catch (error) {
      console.error(`❌ Error checking table ${table}:`, error.message);
    }
  }

  // Generate the complete SQL script
  console.log('\n🚀 Complete SQL script to run:\n');

  for (const table of tables) {
    try {
      const [columns] = await connection.execute(`DESCRIBE ${table}`);
      const camelCaseColumns = columns.filter(col =>
        col.Field.includes('createdAt') || col.Field.includes('updatedAt')
      );

      camelCaseColumns.forEach(col => {
        const snakeCaseName = col.Field === 'createdAt' ? 'created_at' : 'updated_at';
        console.log(`ALTER TABLE ${table} CHANGE ${col.Field} ${snakeCaseName} ${col.Type}${col.Null === 'NO' ? ' NOT NULL' : ''}${col.Default ? ` DEFAULT ${col.Default}` : ''}${col.Extra ? ` ${col.Extra}` : ''};`);
      });
    } catch (error) {
      console.error(`-- Error with table ${table}: ${error.message}`);
    }
  }

  await connection.end();
}

checkAndFixColumnNames().catch(console.error);
