const axios = require('axios');

async function testLoginFlow() {
  console.log('🔐 Testing Login Flow\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Login from localhost:3000 perspective (cross-origin)
    console.log('\n📋 Test 1: Login from frontend (localhost:3000 -> localhost:8080)');
    console.log('-'.repeat(60));

    const response = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'joseca@symmetricalwolf.com',
      password: 'admin123'
    }, {
      withCredentials: true,
      headers: {
        'Origin': 'http://localhost:3000',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Status:', response.status);
    console.log('✅ Status Text:', response.statusText);
    console.log('\n📦 Response Headers:');
    console.log('   Set-Cookie:', response.headers['set-cookie']);
    console.log('   Access-Control-Allow-Origin:', response.headers['access-control-allow-origin']);
    console.log('   Access-Control-Allow-Credentials:', response.headers['access-control-allow-credentials']);

    console.log('\n📦 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));

    // Validate response structure
    console.log('\n✔️ Validation:');
    const { sessionActive, userId, name, role, role_id, group_id, group, email } = response.data;

    console.log('   sessionActive:', sessionActive ? '✅ true' : '❌ false/missing');
    console.log('   userId:', userId ? `✅ ${userId}` : '❌ missing');
    console.log('   name:', name ? `✅ ${name}` : '❌ missing');
    console.log('   role:', role ? `✅ ${role}` : '❌ missing');
    console.log('   role_id:', role_id ? `✅ ${role_id}` : '❌ missing');
    console.log('   group_id:', group_id ? `✅ ${group_id}` : '❌ missing');
    console.log('   email:', email ? `✅ ${email}` : '❌ missing');
    console.log('   group:', group ? '✅ present' : '⚠️ null/missing');

    if (!sessionActive) {
      console.log('\n❌ ERROR: sessionActive is false or missing!');
      console.log('   This would cause the frontend to throw "Session not established"');
    } else {
      console.log('\n✅ All checks passed! Login should work.');
    }

    // Test 2: Same-origin login (localhost:8080 -> localhost:8080)
    console.log('\n\n📋 Test 2: Same-origin login (localhost:8080 -> localhost:8080)');
    console.log('-'.repeat(60));

    const sameOriginResponse = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'joseca@symmetricalwolf.com',
      password: 'admin123'
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
        // No Origin header for same-origin requests
      }
    });

    console.log('✅ Status:', sameOriginResponse.status);
    console.log('✅ Response Data:', JSON.stringify(sameOriginResponse.data, null, 2));

  } catch (error) {
    console.error('\n❌ Login Failed!');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Error Message:', error.response?.data?.message || error.message);
    console.error('\nFull Error Data:', error.response?.data);

    if (error.response?.status === 404) {
      console.error('\n⚠️ User not found in database');
    } else if (error.response?.status === 401) {
      console.error('\n⚠️ Invalid credentials');
    } else if (error.response?.status === 500) {
      console.error('\n⚠️ Server error - check backend logs');
    }
  }

  console.log('\n' + '='.repeat(60));
}

testLoginFlow();
