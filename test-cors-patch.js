/**
 * Test script to reproduce the CORS PATCH issue with leads API
 */
const axios = require('axios');

// First login to get a valid token
async function login() {
  try {
    const response = await axios.post('http://localhost:8080/api/login', {
      email: 'joseca@symmetricalwolf.com',
      password: 'admin123'
    });
    console.log('✅ Login successful');
    return response.data.token;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    return null;
  }
}

// Test the CORS preflight with OPTIONS request
async function testPreflight() {
  try {
    const response = await axios.options('http://localhost:8080/api/admin/leads/2', {
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'PATCH',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    });
    console.log('✅ OPTIONS preflight successful');
    console.log('Response headers:', response.headers);
    return true;
  } catch (error) {
    console.error('❌ OPTIONS preflight failed:', error.message);
    console.error('Response:', error.response?.data);
    return false;
  }
}

// Test the actual PATCH request
async function testPatchRequest(token) {
  try {
    const response = await axios.patch('http://localhost:8080/api/admin/leads/2',
      { adminNote: 'Test note from script' },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3000'
        }
      }
    );
    console.log('✅ PATCH request successful');
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.error('❌ PATCH request failed:', error.message);
    console.error('Status:', error.response?.status);
    console.error('Response:', error.response?.data);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🧪 Testing CORS PATCH issue with leads API\n');

  // Step 1: Login
  const token = await login();
  if (!token) {
    console.error('Cannot proceed without valid token');
    return;
  }

  console.log('\n🔍 Testing CORS preflight...');
  // Step 2: Test preflight
  const preflightOk = await testPreflight();

  console.log('\n🔍 Testing actual PATCH request...');
  // Step 3: Test PATCH request
  const patchOk = await testPatchRequest(token);

  console.log('\n📊 Test Results:');
  console.log(`- Login: ✅`);
  console.log(`- Preflight: ${preflightOk ? '✅' : '❌'}`);
  console.log(`- PATCH: ${patchOk ? '✅' : '❌'}`);
}

// Run the tests
runTests().catch(console.error);