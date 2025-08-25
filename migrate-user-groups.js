const mysql = require('mysql2/promise');
require('dotenv').config();

async function addUserGroupColumns() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  try {
    console.log('Starting database migration for user groups...');

    // Check if columns already exist
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'user_groups' AND TABLE_SCHEMA = ?",
      [process.env.DB_NAME]
    );
    
    const columnNames = columns.map(col => col.COLUMN_NAME);
    
    // Add group_type column if it doesn't exist
    if (!columnNames.includes('group_type')) {
      await connection.execute(`
        ALTER TABLE user_groups 
        ADD COLUMN group_type ENUM('standard', 'contractor') DEFAULT 'standard' NOT NULL
      `);
      console.log('✓ Added group_type column');
    } else {
      console.log('✓ group_type column already exists');
    }

    // Add modules column if it doesn't exist
    if (!columnNames.includes('modules')) {
      await connection.execute(`
        ALTER TABLE user_groups 
        ADD COLUMN modules JSON DEFAULT ('{"dashboard": false, "proposals": false, "customers": false, "resources": false}') NOT NULL
      `);
      console.log('✓ Added modules column');
    } else {
      console.log('✓ modules column already exists');
    }

    // Update existing records to have proper default values
    await connection.execute(`
      UPDATE user_groups 
      SET modules = JSON_OBJECT(
        'dashboard', false,
        'proposals', false, 
        'customers', false,
        'resources', false
      )
      WHERE modules IS NULL OR JSON_LENGTH(modules) = 0
    `);
    
    console.log('✓ Updated existing records with default module values');

    // Verify the changes
    const [updatedColumns] = await connection.execute(
      "SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'user_groups' AND TABLE_SCHEMA = ? ORDER BY ORDINAL_POSITION",
      [process.env.DB_NAME]
    );
    
    console.log('\nUpdated table structure:');
    updatedColumns.forEach(col => {
      console.log(`  ${col.COLUMN_NAME}: ${col.DATA_TYPE} (Default: ${col.COLUMN_DEFAULT})`);
    });

    console.log('\nMigration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

addUserGroupColumns();
