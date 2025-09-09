const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixColumnNames() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'njcabinets_db',
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('🔧 Fixing column names in catalog_sub_type_assignments table...\n');

    // Fix createdAt -> created_at
    console.log('Renaming createdAt to created_at...');
    await connection.execute(
      'ALTER TABLE catalog_sub_type_assignments CHANGE createdAt created_at datetime NOT NULL'
    );
    console.log('✅ createdAt renamed to created_at');

    // Fix updatedAt -> updated_at
    console.log('Renaming updatedAt to updated_at...');
    await connection.execute(
      'ALTER TABLE catalog_sub_type_assignments CHANGE updatedAt updated_at datetime NOT NULL'
    );
    console.log('✅ updatedAt renamed to updated_at');

    console.log('\n🎉 Column names fixed successfully!');

    // Verify the changes
    console.log('\n🔍 Verifying changes...');
    const [columns] = await connection.execute('DESCRIBE catalog_sub_type_assignments');

    const timestampColumns = columns.filter(col =>
      col.Field.includes('created_at') || col.Field.includes('updated_at') ||
      col.Field.includes('createdAt') || col.Field.includes('updatedAt')
    );

    console.log('Timestamp columns found:');
    timestampColumns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

  } catch (error) {
    console.error('❌ Error fixing column names:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

fixColumnNames().catch(console.error);
