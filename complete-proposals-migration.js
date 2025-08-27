const sequelize = require('./config/db');

async function completeDataMigration() {
  try {
    await sequelize.authenticate();
    console.log('Completing data migration for proposals...');
    
    // Get first admin user
    const [adminResult] = await sequelize.query("SELECT id FROM users WHERE role = 'Admin' AND isDeleted = false LIMIT 1");
    
    if (adminResult.length > 0) {
      const adminId = adminResult[0].id;
      console.log('Using admin ID:', adminId);
      
      // Update proposals without created_by_user_id
      const [result] = await sequelize.query(
        "UPDATE proposals SET created_by_user_id = ? WHERE created_by_user_id IS NULL",
        { replacements: [adminId] }
      );
      
      console.log('Updated proposals without created_by_user_id:', result.affectedRows || 0);
    } else {
      console.log('No admin user found - creating proposals without owner for now');
    }
    
    // Verify the migration
    const [count] = await sequelize.query("SELECT COUNT(*) as total, COUNT(created_by_user_id) as with_creator FROM proposals WHERE isDeleted = false");
    
    console.log('\nMigration verification:');
    console.log('- Total active proposals:', count[0].total);
    console.log('- Proposals with creator:', count[0].with_creator);
    console.log('- Migration complete:', count[0].total === count[0].with_creator ? '✅' : '❌');
    
    if (count[0].total !== count[0].with_creator) {
      console.log('Warning: Some proposals still missing created_by_user_id');
    }
    
    await sequelize.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Migration error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

if (require.main === module) {
  completeDataMigration();
}

module.exports = completeDataMigration;
