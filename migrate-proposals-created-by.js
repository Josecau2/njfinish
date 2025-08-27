const sequelize = require('./config/db');

async function addCreatedByUserIdToProposals() {
  try {
    await sequelize.authenticate();
    console.log('Adding created_by_user_id column to proposals table...');
    
    // Add the column
    await sequelize.query(`
      ALTER TABLE proposals 
      ADD COLUMN created_by_user_id INT(11) NULL 
      COMMENT 'User who created this proposal'
    `);
    
    console.log('✅ Column added successfully');
    
    // Add foreign key constraint
    try {
      await sequelize.query(`
        ALTER TABLE proposals 
        ADD CONSTRAINT fk_proposals_created_by_user 
        FOREIGN KEY (created_by_user_id) REFERENCES users(id)
      `);
      console.log('✅ Foreign key constraint added');
    } catch (err) {
      console.log('⚠️  Foreign key constraint not added (might already exist):', err.message);
    }
    
    // Add index for performance
    try {
      await sequelize.query(`
        CREATE INDEX idx_proposals_created_by_user ON proposals(created_by_user_id)
      `);
      console.log('✅ Index added');
    } catch (err) {
      console.log('⚠️  Index not added (might already exist):', err.message);
    }
    
    // Update existing proposals to set created_by_user_id based on available data
    console.log('Updating existing proposals...');
    
    // For proposals with designer set, use that as created_by
    const [designerUpdate] = await sequelize.query(`
      UPDATE proposals 
      SET created_by_user_id = designer 
      WHERE designer IS NOT NULL AND created_by_user_id IS NULL
    `);
    
    console.log(`✅ Updated ${designerUpdate.affectedRows || 0} proposals with designer data`);
    
    // For proposals without designer, try to assign to the first admin user
    const [adminResult] = await sequelize.query(`
      SELECT id FROM users WHERE role = 'Admin' AND isDeleted = false LIMIT 1
    `);
    
    if (adminResult.length > 0) {
      const adminId = adminResult[0].id;
      const [adminUpdate] = await sequelize.query(`
        UPDATE proposals 
        SET created_by_user_id = ? 
        WHERE created_by_user_id IS NULL
      `, [adminId]);
      
      console.log(`✅ Updated ${adminUpdate.affectedRows || 0} proposals to admin user ${adminId}`);
    }
    
    await sequelize.close();
    console.log('✅ Migration completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await sequelize.close();
  }
}

addCreatedByUserIdToProposals();
