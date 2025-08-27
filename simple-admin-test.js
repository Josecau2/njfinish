const axios = require('axios');

async function simpleAdminTest() {
  try {
    console.log('Testing admin user creation...');
    
    // Wait a moment for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Login
    const login = await axios.post('http://localhost:8080/api/login', {
      email: 'joseca@symmetricalwolf.com',
      password: 'admin123'
    });
    console.log('Login successful');
    
    // Create admin user
    const user = await axios.post('http://localhost:8080/api/users', {
      name: 'Simple Admin Test',
      email: 'simple.admin@example.com',
      password: 'admin123',
      userGroup: 1
    }, { headers: { Authorization: `Bearer ${login.data.token}` } });
    
    console.log('User created, role:', user.data.user.role);
    
    // Check database
    const { User } = require('./models');
    const dbUser = await User.findByPk(user.data.user.id);
    console.log('DB role:', dbUser.role, 'role_id:', dbUser.role_id);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

simpleAdminTest().then(() => process.exit(0));
