const axios = require('axios');

async function testContractorLogin() {
    try {
        console.log('🔑 Testing contractor login and permissions...\n');
        
        // 1. Login as contractor user
        console.log('1. Logging in as tkk@tkk.com...');
        const loginResponse = await axios.post('http://localhost:8080/api/login', {
            email: 'tkk@tkk.com',
            password: 'admin123'
        });
        
        if (loginResponse.data.token) {
            console.log('✅ Login successful');
            const user = loginResponse.data.user || {};
            console.log(`   User: ${user.first_name || 'N/A'} ${user.last_name || 'N/A'}`);
            console.log(`   Email: ${user.email || 'N/A'}`);
            console.log(`   Role ID: ${user.role_id || 'N/A'}`);
            console.log(`   Group ID: ${user.group_id || 'N/A'}`);
            console.log('   Full user data:', user);
            
            const token = loginResponse.data.token;
            
            // 2. Test API access with token
            console.log('\n2. Testing API access...');
            
            // Test proposals access
            try {
                const proposalsResponse = await axios.get('http://localhost:8080/api/proposals', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log(`✅ Proposals access: Found ${proposalsResponse.data.proposals?.length || 0} proposals`);
            } catch (error) {
                console.log(`❌ Proposals access failed: ${error.response?.data?.message || error.message}`);
            }
            
            // Test customers access
            try {
                const customersResponse = await axios.get('http://localhost:8080/api/customers', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log(`✅ Customers access: Found ${customersResponse.data.customers?.length || 0} customers`);
            } catch (error) {
                console.log(`❌ Customers access failed: ${error.response?.data?.message || error.message}`);
            }
            
            // Test users access (for dashboard stats)
            try {
                const usersResponse = await axios.get('http://localhost:8080/api/users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log(`✅ Users access: Found ${usersResponse.data.users?.length || 0} users`);
            } catch (error) {
                console.log(`❌ Users access failed: ${error.response?.data?.message || error.message}`);
            }
            
        } else {
            console.log('❌ Login failed');
            console.log('Response:', loginResponse.data);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response?.status === 401) {
            console.log('   Issue: Authentication failed - check password');
        } else if (error.response?.status === 403) {
            console.log('   Issue: Access forbidden - check permissions');
        }
    }
}

testContractorLogin();
