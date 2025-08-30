// Debug script to check if routes are working
const axios = require('axios');

async function debugRoutes() {
    const baseURL = 'http://localhost:8080';
    
    // Test contractor token (fresh with correct secret)
    const contractorToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsInVzZXJuYW1lIjoidGVzdGNvbnRyYWN0b3IiLCJpYXQiOjE3NTY0OTc3NjksImV4cCI6MTc1NjU4NDE2OX0.y3AV63vJkcwUpswRx8LiDTHo4yXhCtxbFKgT0j9ECHk';
    
    console.log('🔍 Testing route existence...\n');
    
    try {
        // Test simple endpoint first
        console.log('1. Testing GET /api/contact/info');
        const infoResponse = await axios.get(`${baseURL}/api/contact/info`, {
            headers: { Authorization: `Bearer ${contractorToken}` }
        });
        console.log('✅ /api/contact/info works:', infoResponse.status);
    } catch (error) {
        console.log('❌ /api/contact/info failed:', error.response?.status, error.response?.data || error.message);
    }
    
    try {
        // Test threads endpoint with detailed logging
        console.log('\n2. Testing GET /api/contact/threads');
        const threadsResponse = await axios.get(`${baseURL}/api/contact/threads`, {
            headers: { Authorization: `Bearer ${contractorToken}` }
        });
        console.log('✅ /api/contact/threads works:', threadsResponse.status);
        console.log('📊 Response data:', JSON.stringify(threadsResponse.data, null, 2));
    } catch (error) {
        console.log('❌ /api/contact/threads failed:', error.response?.status, error.response?.data || error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('🚨 Server not running on port 8080');
        }
    }
    
    try {
        // Test admin endpoint
        const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJpYXQiOjE3NTY0OTc3NjksImV4cCI6MTc1NjU4NDE2OX0.nV885c5Fo5eqyMAh9StU0hFjKgviqeV70NzTBwPr9c4';
        
        console.log('\n3. Testing GET /api/contact/admin/inbox');
        const adminResponse = await axios.get(`${baseURL}/api/contact/admin/inbox`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ /api/contact/admin/inbox works:', adminResponse.status);
        console.log('📊 Admin response data:', JSON.stringify(adminResponse.data, null, 2));
    } catch (error) {
        console.log('❌ /api/contact/admin/inbox failed:', error.response?.status, error.response?.data || error.message);
    }
}

debugRoutes();
