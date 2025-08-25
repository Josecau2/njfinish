const axios = require('axios');

async function debugPermissionFlow() {
    try {
        console.log('🔍 Debug: Permission Flow Analysis\n');
        
        // 1. Login as contractor
        console.log('1. Login as contractor...');
        const loginResponse = await axios.post('http://localhost:8080/api/login', {
            email: 'tkk@tkk.com',
            password: 'admin123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful');
        console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));
        
        // 2. Test customers with detailed error logging
        console.log('\n2. Testing customers with enhanced error logging...');
        
        try {
            const customersResponse = await axios.get('http://localhost:8080/api/customers', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000  // 10 second timeout
            });
            console.log('✅ Customers API: SUCCESS!');
            console.log(`Found ${customersResponse.data.customers?.length || 0} customers`);
        } catch (error) {
            console.log('❌ Customers API: FAILED');
            console.log('Error details:');
            console.log(`  Status: ${error.response?.status}`);
            console.log(`  Status Text: ${error.response?.statusText}`);
            console.log(`  Response Headers:`, error.response?.headers);
            console.log(`  Response Data:`, JSON.stringify(error.response?.data, null, 2));
            
            if (error.code) {
                console.log(`  Error Code: ${error.code}`);
            }
            
            // Analyze the specific error
            if (error.response?.status === 403) {
                console.log('\n🔍 Analysis: 403 Forbidden Error');
                console.log('This indicates the user is authenticated but lacks permissions');
                console.log('Possible causes:');
                console.log('- User group permissions not properly computed');
                console.log('- Permission middleware not finding required permission');
                console.log('- Group modules not properly configured');
                console.log('- Database mismatch between user.group_id and actual group');
            }
        }
        
        // 3. Direct test of user info
        console.log('\n3. Testing user info endpoint for debugging...');
        try {
            const userResponse = await axios.get('http://localhost:8080/api/users/current', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ User info:', JSON.stringify(userResponse.data, null, 2));
        } catch (error) {
            console.log('❌ User info endpoint failed or doesn\'t exist');
        }
        
    } catch (error) {
        console.error('❌ Error in debug flow:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

debugPermissionFlow();
