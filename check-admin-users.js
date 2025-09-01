const { sequelize, User, UserGroup } = require('./models');

async function checkAdminUsers() {
  try {
    console.log('Checking admin users in the database...');
    
    const adminUsers = await User.findAll({
      include: [{
        model: UserGroup,
        as: 'group',
        where: {
          name: 'Admin'
        }
      }]
    });
    
    console.log(`Found ${adminUsers.length} admin users:`);
    adminUsers.forEach(user => {
      console.log(`- Email: ${user.email}, Name: ${user.name}, ID: ${user.id}`);
    });
    
    // Also check all users to see what's available
    const allUsers = await User.findAll({
      include: [{
        model: UserGroup,
        as: 'group'
      }]
    });
    
    console.log(`\nAll users in database (${allUsers.length}):`);
    allUsers.forEach(user => {
      console.log(`- Email: ${user.email}, Name: ${user.name}, Group: ${user.group?.name || 'No group'}`);
    });
    
    await sequelize.close();
  } catch (error) {
    console.error('Error checking users:', error.message);
  }
}

checkAdminUsers();
