const axios = require('axios');

async function debugLogin() {
    const baseURL = 'http://localhost:8080';
    
    try {
        console.log('🔍 Debugging login endpoints...\n');
        
        // Test admin login
        console.log('1. Testing admin login...');
        try {
            const adminResponse = await axios.post(`${baseURL}/api/auth/login`, {
                email: 'joseca@symmetricalwolf.com',
                password: 'admin123'
            });
            console.log('✅ Admin login successful');
            console.log('Response data:', JSON.stringify(adminResponse.data, null, 2));
        } catch (error) {
            console.log('❌ Admin login failed');
            console.log('Status:', error.response?.status);
            console.log('Response:', JSON.stringify(error.response?.data, null, 2));
        }
        
        console.log('\n2. Testing contractor login...');
        try {
            const contractorResponse = await axios.post(`${baseURL}/api/auth/login`, {
                email: 'contractor1@example.com',
                password: 'ContractorPass1!'
            });
            console.log('✅ Contractor login successful');
            console.log('Response data:', JSON.stringify(contractorResponse.data, null, 2));
        } catch (error) {
            console.log('❌ Contractor login failed');
            console.log('Status:', error.response?.status);
            console.log('Response:', JSON.stringify(error.response?.data, null, 2));
        }
        
        // Test server connectivity
        console.log('\n3. Testing server connectivity...');
        try {
            const healthCheck = await axios.get(`${baseURL}/api/proposals`);
            console.log('✅ Server is responding (though auth required)');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Server is responding (401 expected without auth)');
            } else {
                console.log('❌ Server connectivity issue');
                console.log('Error:', error.message);
            }
        }
        
    } catch (error) {
        console.error('Debug failed:', error.message);
    }
}

debugLogin();
