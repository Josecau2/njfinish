// Check if UserRole was created correctly
const { User, UserRole, UserGroup } = require('./models/index');

async function checkUserRole() {
  try {
    console.log('Checking UserRole for user 11...');
    
    const user = await User.findByPk(11);
    console.log('User data:', {
      id: user.id,
      role: user.role,
      group_id: user.group_id,
      role_id: user.role_id
    });
    
    const roleEntry = await UserRole.findOne({ where: { userId: 11 } });
    console.log('UserRole entry:', roleEntry ? roleEntry.toJSON() : 'Not found');
    
  } catch (error) {
    console.error('Check error:', error);
  }
  
  process.exit(0);
}

checkUserRole();
