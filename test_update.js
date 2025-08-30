// Test user update directly
const { User, UserRole, UserGroup } = require('./models/index');
const authController = require('./controllers/authController');

async function testUpdate() {
  try {
    // Simulate the request and response objects
    const req = {
      params: { id: '11' },
      body: { userGroup: '1' }
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
    
    console.log('Testing updateUser function with userGroup: 1');
    await authController.updateUser(req, res);
    
  } catch (error) {
    console.error('Test error:', error);
  }
  
  process.exit(0);
}

testUpdate();
