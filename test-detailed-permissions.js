const axios = require('axios');

async function testContractorPermissions() {
    try {
        console.log('🔍 Testing contractor permissions in detail...\n');
        
        // 1. Login to get token
        const loginResponse = await axios.post('http://localhost:8080/api/login', {
            email: 'tkk@tkk.com',
            password: 'admin123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful, got token');
        
        // 2. Check the user group directly
        console.log('\n2. Checking group permissions...');
        const groupResponse = await axios.get('http://localhost:8080/api/usersgroups/14');
        const group = groupResponse.data.user || groupResponse.data;
        
        console.log('Group details:');
        console.log(`  Name: ${group.name}`);
        console.log(`  Type: ${group.group_type}`);
        console.log(`  Modules:`, group.modules);
        console.log(`  Computed permissions:`, group.permissions);
        
        // 3. Test specific API calls
        console.log('\n3. Testing specific API endpoints...');
        
        // Test customers with headers
        console.log('\nTesting /api/customers...');
        try {
            const customersResponse = await axios.get('http://localhost:8080/api/customers', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(`✅ Customers: ${customersResponse.data.customers?.length || 0} found`);
        } catch (error) {
            console.log(`❌ Customers failed:`, error.response?.data);
            console.log(`   Status: ${error.response?.status}`);
        }
        
        // Test proposals
        console.log('\nTesting /api/proposals...');
        try {
            const proposalsResponse = await axios.get('http://localhost:8080/api/proposals', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(`✅ Proposals: ${proposalsResponse.data.proposals?.length || 0} found`);
        } catch (error) {
            console.log(`❌ Proposals failed:`, error.response?.data);
            console.log(`   Status: ${error.response?.status}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testContractorPermissions();
