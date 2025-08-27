const sequelize = require('./config/db');

async function testUserDataIsolation() {
  try {
    await sequelize.authenticate();
    console.log('🔍 Testing User-Level Data Isolation\n');
    
    // 1. Check users and their groups
    console.log('📊 Users and Groups:');
    const [users] = await sequelize.query(`
      SELECT u.id, u.name, u.role, u.group_id, ug.name as group_name, ug.group_type
      FROM users u 
      LEFT JOIN user_groups ug ON u.group_id = ug.id 
      WHERE u.isDeleted = false OR u.isDeleted IS NULL
      ORDER BY u.id
    `);
    
    users.forEach(user => {
      console.log(`  User ${user.id}: ${user.name} (${user.role}) - Group: ${user.group_name || 'None'} (${user.group_type || 'N/A'})`);
    });
    
    // 2. Check customers with their creators
    console.log('\n📋 Customers by Creator:');
    const [customers] = await sequelize.query(`
      SELECT c.id, c.name, c.email, c.created_by_user_id, c.group_id,
             u.name as creator_name, ug.name as group_name
      FROM customers c 
      LEFT JOIN users u ON c.created_by_user_id = u.id
      LEFT JOIN user_groups ug ON c.group_id = ug.id
      WHERE (c.deleted_at IS NULL)
      ORDER BY c.created_by_user_id, c.id
    `);
    
    const customersByUser = {};
    customers.forEach(customer => {
      const userId = customer.created_by_user_id || 'Unknown';
      if (!customersByUser[userId]) {
        customersByUser[userId] = [];
      }
      customersByUser[userId].push(customer);
    });
    
    Object.keys(customersByUser).forEach(userId => {
      const userCustomers = customersByUser[userId];
      const creator = userCustomers[0].creator_name || 'Unknown User';
      console.log(`  User ${userId} (${creator}): ${userCustomers.length} customers`);
      userCustomers.slice(0, 3).forEach(c => {
        console.log(`    - ${c.name} (${c.email})`);
      });
      if (userCustomers.length > 3) {
        console.log(`    ... and ${userCustomers.length - 3} more`);
      }
    });
    
    // 3. Check proposals with their creators
    console.log('\n📝 Proposals by Creator:');
    const [proposals] = await sequelize.query(`
      SELECT p.id, p.description, p.status, p.created_by_user_id, p.owner_group_id,
             u.name as creator_name, ug.name as group_name,
             c.name as customer_name
      FROM proposals p 
      LEFT JOIN users u ON p.created_by_user_id = u.id
      LEFT JOIN user_groups ug ON p.owner_group_id = ug.id
      LEFT JOIN customers c ON p.customerId = c.id
      WHERE p.isDeleted = false
      ORDER BY p.created_by_user_id, p.id
    `);
    
    const proposalsByUser = {};
    proposals.forEach(proposal => {
      const userId = proposal.created_by_user_id || 'Unknown';
      if (!proposalsByUser[userId]) {
        proposalsByUser[userId] = [];
      }
      proposalsByUser[userId].push(proposal);
    });
    
    Object.keys(proposalsByUser).forEach(userId => {
      const userProposals = proposalsByUser[userId];
      const creator = userProposals[0].creator_name || 'Unknown User';
      console.log(`  User ${userId} (${creator}): ${userProposals.length} proposals`);
      userProposals.slice(0, 3).forEach(p => {
        console.log(`    - ${p.description || 'No description'} (${p.status}) - Customer: ${p.customer_name || 'None'}`);
      });
      if (userProposals.length > 3) {
        console.log(`    ... and ${userProposals.length - 3} more`);
      }
    });
    
    // 4. Test isolation for contractor users
    console.log('\n🔒 Testing Data Isolation for Contractors:');
    const contractors = users.filter(u => u.group_type === 'contractor' && u.role !== 'Admin');
    
    for (const contractor of contractors) {
      console.log(`\n  Contractor ${contractor.name} (ID: ${contractor.id}):`);
      
      // Check what customers they can see
      const [contractorCustomers] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM customers 
        WHERE (deleted_at IS NULL) AND created_by_user_id = ?
      `, { replacements: [contractor.id] });
      
      // Check what proposals they can see
      const [contractorProposals] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM proposals 
        WHERE isDeleted = false AND created_by_user_id = ?
      `, { replacements: [contractor.id] });
      
      console.log(`    - Can see ${contractorCustomers[0].count} customers (their own)`);
      console.log(`    - Can see ${contractorProposals[0].count} proposals (their own)`);
    }
    
    console.log('\n✅ User Data Isolation Test Complete');
    await sequelize.close();
    
  } catch (error) {
    console.error('Test error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

if (require.main === module) {
  testUserDataIsolation();
}

module.exports = testUserDataIsolation;
