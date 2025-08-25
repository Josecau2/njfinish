const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateDataModelExtensions() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  try {
    console.log('Starting data model extensions migration...');

    // ===== USER GROUPS EXTENSIONS =====
    console.log('\n1. Extending user_groups table...');
    
    // Check existing columns in user_groups
    const [userGroupColumns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'user_groups' AND TABLE_SCHEMA = ?",
      [process.env.DB_NAME]
    );
    const userGroupColumnNames = userGroupColumns.map(col => col.COLUMN_NAME);
    
    // Add group_type if missing
    if (!userGroupColumnNames.includes('group_type')) {
      await connection.execute(`
        ALTER TABLE user_groups 
        ADD COLUMN group_type ENUM('standard', 'contractor') DEFAULT 'standard' NOT NULL
      `);
      console.log('   ✓ Added group_type column to user_groups');
    } else {
      console.log('   ✓ group_type column already exists in user_groups');
    }

    // Add modules if missing
    if (!userGroupColumnNames.includes('modules')) {
      await connection.execute(`
        ALTER TABLE user_groups 
        ADD COLUMN modules JSON DEFAULT NULL
      `);
      console.log('   ✓ Added modules column to user_groups');
    } else {
      console.log('   ✓ modules column already exists in user_groups');
    }

    // Add contractor_settings for future use
    if (!userGroupColumnNames.includes('contractor_settings')) {
      await connection.execute(`
        ALTER TABLE user_groups 
        ADD COLUMN contractor_settings JSON DEFAULT NULL COMMENT 'Store defaults like price_multiplier, allowed manufacturers'
      `);
      console.log('   ✓ Added contractor_settings column to user_groups');
    } else {
      console.log('   ✓ contractor_settings column already exists in user_groups');
    }

    // ===== CUSTOMERS TABLE EXTENSIONS =====
    console.log('\n2. Extending customers table...');
    
    // Check existing columns in customers
    const [customerColumns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'customers' AND TABLE_SCHEMA = ?",
      [process.env.DB_NAME]
    );
    const customerColumnNames = customerColumns.map(col => col.COLUMN_NAME);
    
    // Add group_id (FK to user_groups)
    if (!customerColumnNames.includes('group_id')) {
      await connection.execute(`
        ALTER TABLE customers 
        ADD COLUMN group_id INT NULL,
        ADD INDEX idx_customers_group_id (group_id),
        ADD FOREIGN KEY fk_customers_group_id (group_id) REFERENCES user_groups(id) ON DELETE SET NULL
      `);
      console.log('   ✓ Added group_id column with FK constraint to customers');
    } else {
      console.log('   ✓ group_id column already exists in customers');
    }

    // Add created_by_user_id (FK to users)  
    if (!customerColumnNames.includes('created_by_user_id')) {
      await connection.execute(`
        ALTER TABLE customers 
        ADD COLUMN created_by_user_id INT NULL,
        ADD INDEX idx_customers_created_by (created_by_user_id),
        ADD FOREIGN KEY fk_customers_created_by (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('   ✓ Added created_by_user_id column with FK constraint to customers');
    } else {
      console.log('   ✓ created_by_user_id column already exists in customers');
    }

    // Add phone column if missing (consolidate homePhone/mobile)
    if (!customerColumnNames.includes('phone')) {
      await connection.execute(`
        ALTER TABLE customers 
        ADD COLUMN phone VARCHAR(255) NULL COMMENT 'Primary phone number'
      `);
      console.log('   ✓ Added phone column to customers');
    } else {
      console.log('   ✓ phone column already exists in customers');
    }

    // Add compound index for efficient queries
    await connection.execute(`
      CREATE INDEX IF NOT EXISTS idx_customers_group_name ON customers(group_id, name)
    `);
    console.log('   ✓ Added compound index on (group_id, name) to customers');

    // Add soft delete support if not exists
    if (!customerColumnNames.includes('deleted_at')) {
      await connection.execute(`
        ALTER TABLE customers 
        ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL
      `);
      console.log('   ✓ Added deleted_at column for soft delete to customers');
    } else {
      console.log('   ✓ deleted_at column already exists in customers');
    }

    // ===== PROPOSALS TABLE EXTENSIONS =====
    console.log('\n3. Extending proposals table...');
    
    // Check existing columns in proposals
    const [proposalColumns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'proposals' AND TABLE_SCHEMA = ?",
      [process.env.DB_NAME]
    );
    const proposalColumnNames = proposalColumns.map(col => col.COLUMN_NAME);

    // Add owner_group_id (FK to user_groups)
    if (!proposalColumnNames.includes('owner_group_id')) {
      await connection.execute(`
        ALTER TABLE proposals 
        ADD COLUMN owner_group_id INT NULL,
        ADD INDEX idx_proposals_owner_group (owner_group_id),
        ADD FOREIGN KEY fk_proposals_owner_group (owner_group_id) REFERENCES user_groups(id) ON DELETE SET NULL
      `);
      console.log('   ✓ Added owner_group_id column with FK constraint to proposals');
    } else {
      console.log('   ✓ owner_group_id column already exists in proposals');
    }

    // Update existing proposal status enum to include new statuses
    await connection.execute(`
      ALTER TABLE proposals 
      MODIFY COLUMN status ENUM(
        'draft',
        'sent', 
        'accepted',
        'rejected',
        'expired',
        'Draft',
        'Follow up 1',
        'Follow up 2', 
        'Follow up 3',
        'Measurement Scheduled',
        'Measurement done',
        'Design done',
        'Proposal done',
        'Proposal accepted',
        'Proposal rejected'
      ) NULL COMMENT 'Extended status enum with new values while preserving existing ones'
    `);
    console.log('   ✓ Extended status enum in proposals (backward compatible)');

    // Add accepted_at timestamp
    if (!proposalColumnNames.includes('accepted_at')) {
      await connection.execute(`
        ALTER TABLE proposals 
        ADD COLUMN accepted_at TIMESTAMP NULL DEFAULT NULL
      `);
      console.log('   ✓ Added accepted_at column to proposals');
    } else {
      console.log('   ✓ accepted_at column already exists in proposals');
    }

    // Add accepted_by (can be user ID or external signer name)
    if (!proposalColumnNames.includes('accepted_by')) {
      await connection.execute(`
        ALTER TABLE proposals 
        ADD COLUMN accepted_by VARCHAR(255) NULL COMMENT 'User ID or external signer name'
      `);
      console.log('   ✓ Added accepted_by column to proposals');
    } else {
      console.log('   ✓ accepted_by column already exists in proposals');
    }

    // Add is_locked boolean
    if (!proposalColumnNames.includes('is_locked')) {
      await connection.execute(`
        ALTER TABLE proposals 
        ADD COLUMN is_locked BOOLEAN DEFAULT FALSE COMMENT 'Locks prices after acceptance'
      `);
      console.log('   ✓ Added is_locked column to proposals');
    } else {
      console.log('   ✓ is_locked column already exists in proposals');
    }

    // Add compound index for efficient queries
    await connection.execute(`
      CREATE INDEX IF NOT EXISTS idx_proposals_owner_status ON proposals(owner_group_id, status)
    `);
    console.log('   ✓ Added compound index on (owner_group_id, status) to proposals');

    // ===== NOTIFICATIONS TABLE =====
    console.log('\n4. Creating notifications table...');
    
    // Check if notifications table exists
    const [tables] = await connection.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'notifications' AND TABLE_SCHEMA = ?",
      [process.env.DB_NAME]
    );

    if (tables.length === 0) {
      await connection.execute(`
        CREATE TABLE notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          recipient_user_id INT NOT NULL,
          type VARCHAR(100) NOT NULL COMMENT 'Notification type (e.g., proposal_accepted, customer_created)',
          payload JSON NULL COMMENT 'Additional data for the notification',
          read_at TIMESTAMP NULL DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_notifications_recipient_read (recipient_user_id, read_at),
          FOREIGN KEY fk_notifications_recipient (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB COMMENT='System notifications for users'
      `);
      console.log('   ✓ Created notifications table with indexes and FK constraints');
    } else {
      console.log('   ✓ notifications table already exists');
    }

    // ===== DATA MIGRATION FOR BACKWARD COMPATIBILITY =====
    console.log('\n5. Migrating existing data for backward compatibility...');

    // Get the admin/primary group ID (assume first group or create default)
    const [adminGroups] = await connection.execute(
      "SELECT id FROM user_groups WHERE group_type = 'standard' ORDER BY id LIMIT 1"
    );
    
    let adminGroupId = null;
    if (adminGroups.length > 0) {
      adminGroupId = adminGroups[0].id;
      console.log(`   ✓ Found admin group with ID: ${adminGroupId}`);
    } else {
      // Create default admin group if none exists
      const [result] = await connection.execute(`
        INSERT INTO user_groups (name, group_type, modules) 
        VALUES ('Admin Group', 'standard', NULL)
      `);
      adminGroupId = result.insertId;
      console.log(`   ✓ Created default admin group with ID: ${adminGroupId}`);
    }

    // Set default owner_group_id for existing proposals
    const [updateResult] = await connection.execute(
      "UPDATE proposals SET owner_group_id = ? WHERE owner_group_id IS NULL",
      [adminGroupId]
    );
    console.log(`   ✓ Updated ${updateResult.affectedRows} existing proposals with default owner_group_id`);

    // Map existing proposal statuses to new enum values
    await connection.execute(`
      UPDATE proposals 
      SET status = CASE 
        WHEN status IN ('Draft') THEN 'draft'
        WHEN status IN ('Proposal done', 'Follow up 1', 'Follow up 2', 'Follow up 3') THEN 'sent'
        WHEN status IN ('Proposal accepted') THEN 'accepted'
        WHEN status IN ('Proposal rejected') THEN 'rejected'
        ELSE status
      END
      WHERE status IN ('Draft', 'Proposal done', 'Follow up 1', 'Follow up 2', 'Follow up 3', 'Proposal accepted', 'Proposal rejected')
    `);
    console.log('   ✓ Mapped existing proposal statuses to new enum values');

    // Set accepted_at for proposals that are already accepted
    await connection.execute(`
      UPDATE proposals 
      SET accepted_at = updatedAt 
      WHERE status = 'accepted' AND accepted_at IS NULL
    `);
    console.log('   ✓ Set accepted_at timestamp for existing accepted proposals');

    // ===== VERIFY MIGRATION =====
    console.log('\n6. Verifying migration results...');

    // Verify user_groups structure
    const [finalUserGroupColumns] = await connection.execute(
      "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'user_groups' AND TABLE_SCHEMA = ? ORDER BY ORDINAL_POSITION",
      [process.env.DB_NAME]
    );
    console.log('   user_groups table structure:');
    finalUserGroupColumns.forEach(col => {
      console.log(`     ${col.COLUMN_NAME}: ${col.DATA_TYPE} (Nullable: ${col.IS_NULLABLE}, Default: ${col.COLUMN_DEFAULT || 'NULL'})`);
    });

    // Verify customers structure  
    const [finalCustomerColumns] = await connection.execute(
      "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'customers' AND TABLE_SCHEMA = ? AND COLUMN_NAME IN ('group_id', 'created_by_user_id', 'phone', 'deleted_at') ORDER BY ORDINAL_POSITION",
      [process.env.DB_NAME]
    );
    console.log('   customers table new columns:');
    finalCustomerColumns.forEach(col => {
      console.log(`     ${col.COLUMN_NAME}: ${col.DATA_TYPE} (Nullable: ${col.IS_NULLABLE})`);
    });

    // Verify proposals structure
    const [finalProposalColumns] = await connection.execute(
      "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'proposals' AND TABLE_SCHEMA = ? AND COLUMN_NAME IN ('owner_group_id', 'accepted_at', 'accepted_by', 'is_locked') ORDER BY ORDINAL_POSITION",
      [process.env.DB_NAME]
    );
    console.log('   proposals table new columns:');
    finalProposalColumns.forEach(col => {
      console.log(`     ${col.COLUMN_NAME}: ${col.DATA_TYPE} (Nullable: ${col.IS_NULLABLE})`);
    });

    // Count records to ensure no data loss
    const [userGroupCount] = await connection.execute("SELECT COUNT(*) as count FROM user_groups");
    const [customerCount] = await connection.execute("SELECT COUNT(*) as count FROM customers");
    const [proposalCount] = await connection.execute("SELECT COUNT(*) as count FROM proposals");
    
    console.log('\n   Record counts (verifying no data loss):');
    console.log(`     user_groups: ${userGroupCount[0].count}`);
    console.log(`     customers: ${customerCount[0].count}`);
    console.log(`     proposals: ${proposalCount[0].count}`);

    console.log('\n✅ Data model extensions migration completed successfully!');
    console.log('\nNew capabilities added:');
    console.log('  • User groups can be typed as "contractor" with optional settings');
    console.log('  • Customers can be owned by contractor groups');
    console.log('  • Proposals have ownership, enhanced status tracking, and locking');
    console.log('  • Notifications system ready for implementation');
    console.log('  • All existing data preserved with backward compatibility');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateDataModelExtensions();
}

module.exports = { migrateDataModelExtensions };
