const http = require('http');

const baseUrl = 'http://localhost:8080';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data: parsed });
          } else {
            reject({ status: res.statusCode, data: parsed, message: `HTTP ${res.statusCode}` });
          }
        } catch (e) {
          reject({ status: res.statusCode, data: body, message: 'Parse error' });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testSubTypesAPI() {
  console.log('🧪 Testing Sub-Types API...');

  try {
    // Test GET sub-types for manufacturer 1 (without auth first to see the response)
    console.log('\n1. Testing GET /api/manufacturers/1/sub-types');
    try {
      const response = await makeRequest('GET', '/api/manufacturers/1/sub-types');
      console.log('✅ Sub-types fetched successfully:', response.data);
    } catch (error) {
      console.log('📝 Expected auth error (401/403):', error.status, error.data);
      if (error.status === 401 || error.status === 403) {
        console.log('✅ Authentication protection is working correctly');
      }
    }

    // Test the basic API route structure
    console.log('\n2. Testing basic connectivity to /api/manufacturers/1');
    try {
      const response = await makeRequest('GET', '/api/manufacturers/1');
      console.log('✅ Manufacturer endpoint accessible, status:', response.status);
    } catch (error) {
      console.log('📝 Manufacturer endpoint response:', error.status, error.data);
    }

    console.log('\n🎉 Sub-types API connectivity test completed!');
    console.log('Note: Full CRUD testing requires authentication tokens');

  } catch (error) {
    console.error('❌ Sub-types API test failed:', error);
  }
}

// Run the test
testSubTypesAPI().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});
