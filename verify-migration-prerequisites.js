const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyMigrationPrerequisites() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  try {
    console.log('🔍 Verifying migration prerequisites...\n');

    // Check if required tables exist
    const requiredTables = ['users', 'user_groups', 'customers', 'proposals'];
    const placeholders = requiredTables.map(() => '?').join(',');
    const [tables] = await connection.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${placeholders})`,
      [process.env.DB_NAME, ...requiredTables]
    );
    
    const existingTables = tables.map(t => t.TABLE_NAME);
    console.log('✅ Existing tables:', existingTables);
    
    for (const table of requiredTables) {
      if (!existingTables.includes(table)) {
        console.log(`❌ Missing required table: ${table}`);
        return false;
      }
    }

    // Check current record counts
    console.log('\n📊 Current record counts:');
    for (const table of existingTables) {
      try {
        const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   ${table}: ${count[0].count} records`);
      } catch (error) {
        console.log(`   ${table}: Error counting records - ${error.message}`);
      }
    }

    // Check existing schema for user_groups
    console.log('\n🔍 Current user_groups schema:');
    const [userGroupColumns] = await connection.execute(
      "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'user_groups' AND TABLE_SCHEMA = ? ORDER BY ORDINAL_POSITION",
      [process.env.DB_NAME]
    );
    
    userGroupColumns.forEach(col => {
      console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE} (Nullable: ${col.IS_NULLABLE}, Default: ${col.COLUMN_DEFAULT || 'NULL'})`);
    });

    // Check existing schema for customers
    console.log('\n🔍 Current customers schema (relevant columns):');
    const [customerColumns] = await connection.execute(
      "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'customers' AND TABLE_SCHEMA = ? ORDER BY ORDINAL_POSITION",
      [process.env.DB_NAME]
    );
    
    customerColumns.forEach(col => {
      console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE} (Nullable: ${col.IS_NULLABLE})`);
    });

    // Check existing schema for proposals
    console.log('\n🔍 Current proposals schema (relevant columns):');
    const [proposalColumns] = await connection.execute(
      "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'proposals' AND TABLE_SCHEMA = ? ORDER BY ORDINAL_POSITION",
      [process.env.DB_NAME]
    );
    
    proposalColumns.forEach(col => {
      console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE} (Nullable: ${col.IS_NULLABLE})`);
    });

    // Check for existing foreign key constraints
    console.log('\n🔗 Existing foreign key constraints:');
    const [constraints] = await connection.execute(`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = ? 
        AND REFERENCED_TABLE_NAME IS NOT NULL
        AND TABLE_NAME IN ('user_groups', 'customers', 'proposals')
      ORDER BY TABLE_NAME, COLUMN_NAME
    `, [process.env.DB_NAME]);

    if (constraints.length > 0) {
      constraints.forEach(constraint => {
        console.log(`   ${constraint.TABLE_NAME}.${constraint.COLUMN_NAME} -> ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`);
      });
    } else {
      console.log('   No existing foreign key constraints found');
    }

    console.log('\n✅ Prerequisites check completed successfully!');
    console.log('\n📋 Migration will:');
    console.log('   • Add group_type, modules, contractor_settings to user_groups');
    console.log('   • Add group_id, created_by_user_id, phone, deleted_at to customers');
    console.log('   • Add owner_group_id, accepted_at, accepted_by, is_locked to proposals');
    console.log('   • Create notifications table');
    console.log('   • Set up foreign key relationships');
    console.log('   • Preserve all existing data');

    return true;

  } catch (error) {
    console.error('❌ Prerequisites check failed:', error);
    return false;
  } finally {
    await connection.end();
  }
}

// Run verification if this file is executed directly
if (require.main === module) {
  verifyMigrationPrerequisites().then(success => {
    if (success) {
      console.log('\n🚀 Ready to run migration!');
      console.log('Execute: node migrate-data-model-extensions.js');
    } else {
      console.log('\n❌ Prerequisites not met. Please fix issues before running migration.');
      process.exit(1);
    }
  });
}

module.exports = { verifyMigrationPrerequisites };
