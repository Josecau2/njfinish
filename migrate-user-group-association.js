const mysql = require('mysql2/promise');
require('dotenv').config();

async function addUserGroupAssociation() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  try {
    console.log('Adding user-group association...');

    // Check if group_id column already exists in users table
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND TABLE_SCHEMA = ? AND COLUMN_NAME = 'group_id'",
      [process.env.DB_NAME]
    );

    if (columns.length === 0) {
      // Add group_id column to users table
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN group_id INT NULL,
        ADD INDEX idx_users_group_id (group_id),
        ADD FOREIGN KEY fk_users_group_id (group_id) REFERENCES user_groups(id) ON DELETE SET NULL
      `);
      console.log('✓ Added group_id column with FK constraint to users table');
    } else {
      console.log('✓ group_id column already exists in users table');
    }

    // Verify the changes
    const [updatedColumns] = await connection.execute(
      "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND TABLE_SCHEMA = ? AND COLUMN_NAME = 'group_id'",
      [process.env.DB_NAME]
    );

    if (updatedColumns.length > 0) {
      console.log('\nUser table group_id column:');
      updatedColumns.forEach(col => {
        console.log(`  ${col.COLUMN_NAME}: ${col.DATA_TYPE} (Nullable: ${col.IS_NULLABLE})`);
      });
    }

    console.log('\n✅ User-group association migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  addUserGroupAssociation();
}

module.exports = { addUserGroupAssociation };
