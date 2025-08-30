// Check current user permissions for debugging
const { getUserPermissions } = require('./middleware/permissions');
const { User } = require('./models/index');

async function checkUserPermissions() {
  try {
    console.log('Checking user permissions...');
    
    // Check user 11 (the one we updated earlier)
    const user = await User.findByPk(11, {
      include: [{
        model: require('./models/UserGroup'),
        as: 'group'
      }]
    });
    
    if (user) {
      console.log('User 11 data:', {
        id: user.id,
        email: user.email,
        role: user.role,
        group_id: user.group_id,
        role_id: user.role_id
      });
      
      const permissions = await getUserPermissions(user);
      console.log('User 11 permissions:', permissions);
      console.log('Has admin:groups permission:', permissions.includes('admin:groups'));
    } else {
      console.log('User 11 not found');
    }
    
    // Check if there are any other admin users
    const adminUsers = await User.findAll({
      where: { role: 'Admin' },
      attributes: ['id', 'email', 'role', 'group_id', 'role_id']
    });
    console.log('All admin users:', adminUsers.map(u => u.toJSON()));
    
  } catch (error) {
    console.error('Check error:', error);
  }
  
  process.exit(0);
}

checkUserPermissions();
