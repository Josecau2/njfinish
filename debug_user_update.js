// Test script to debug user update issue
const { User, UserRole, UserGroup } = require('./models/index');

async function testUserUpdate() {
  try {
    console.log('Testing user update issue...');
    
    // Test finding user 11
    const user = await User.findByPk(11);
    console.log('User found:', user ? user.toJSON() : 'Not found');
    
    // Test finding a user group
    const groups = await UserGroup.findAll();
    console.log('Available groups:', groups.map(g => ({ id: g.id, name: g.name, group_type: g.group_type })));
    
    // Test finding user role entry
    const roleEntry = await UserRole.findOne({ where: { userId: 11 } });
    console.log('Current role entry:', roleEntry ? roleEntry.toJSON() : 'Not found');
    
  } catch (error) {
    console.error('Test error:', error);
  }
  
  process.exit(0);
}

testUserUpdate();
