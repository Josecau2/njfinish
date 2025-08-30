// Test the usergroups API endpoint
const { User, UserGroup } = require('./models/index');
const userGroupController = require('./controllers/userGroupController');

async function testUserGroupAPI() {
  try {
    console.log('Testing userGroups API...');
    
    // Check if user group with id 1 exists
    const group = await UserGroup.findByPk(1);
    console.log('UserGroup 1:', group ? group.toJSON() : 'Not found');
    
    // Test the controller function directly
    const req = {
      params: { id: '1' },
      user: { id: 11, role: 'Admin' }, // Simulating an admin user
      userPermissions: ['admin:groups'] // Simulating permissions
    };
    
    const res = {
      status: (code) => ({
        json: (data) => {
          console.log(`Response ${code}:`, data);
          return { status: code, data };
        }
      }),
      json: (data) => {
        console.log('Response 200:', data);
        return { status: 200, data };
      }
    };
    
    console.log('Testing fetchSingleUser controller...');
    await userGroupController.fetchSingleUser(req, res);
    
  } catch (error) {
    console.error('Test error:', error);
  }
  
  process.exit(0);
}

testUserGroupAPI();
