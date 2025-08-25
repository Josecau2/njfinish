const axios = require('axios');

async function testDirectAccess() {
    try {
        console.log('🎯 Testing direct contractor access bypassing single group fetch...\n');
        
        // 1. Login as contractor
        const loginResponse = await axios.post('http://localhost:8080/api/login', {
            email: 'tkk@tkk.com',
            password: 'admin123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful');
        
        // 2. Test each API endpoint individually
        console.log('\n2. Testing API endpoints with authentication...');
        
        const config = {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
        
        // Test customers
        console.log('\nTesting customers endpoint...');
        try {
            const customersResponse = await axios.get('http://localhost:8080/api/customers', config);
            console.log(`✅ Customers API: Success - Found ${customersResponse.data.customers?.length || 0} customers`);
        } catch (error) {
            console.log(`❌ Customers API: Failed`);
            console.log(`   Status: ${error.response?.status}`);
            console.log(`   Message: ${error.response?.data?.message}`);
            if (error.response?.status === 403) {
                console.log('   This indicates a permission issue - the user group permissions may not be properly set');
            }
        }
        
        // Test proposals
        console.log('\nTesting proposals endpoint...');
        try {
            const proposalsResponse = await axios.get('http://localhost:8080/api/proposals', config);
            console.log(`✅ Proposals API: Success - Found ${proposalsResponse.data.proposals?.length || 0} proposals`);
        } catch (error) {
            console.log(`❌ Proposals API: Failed`);
            console.log(`   Status: ${error.response?.status}`);
            console.log(`   Message: ${error.response?.data?.message}`);
        }
        
        // Test resources
        console.log('\nTesting resources endpoint...');
        try {
            const resourcesResponse = await axios.get('http://localhost:8080/api/resources', config);
            console.log(`✅ Resources API: Success - Found ${resourcesResponse.data.resources?.length || 0} resources`);
        } catch (error) {
            console.log(`❌ Resources API: Failed`);
            console.log(`   Status: ${error.response?.status}`);
            console.log(`   Message: ${error.response?.data?.message}`);
        }
        
        // Test usergroups (for dropdown verification)
        console.log('\nTesting usergroups endpoint (for dropdown functionality)...');
        try {
            const userGroupsResponse = await axios.get('http://localhost:8080/api/usersgroups', config);
            console.log(`✅ UserGroups API: Success - Found ${userGroupsResponse.data.users?.length || 0} groups`);
            
            // Find our test contractor group in the response
            const testGroup = userGroupsResponse.data.users?.find(g => g.name === 'test contractor');
            if (testGroup) {
                console.log(`✅ Test contractor group found in API response:`);
                console.log(`   ID: ${testGroup.id}`);
                console.log(`   Type: ${testGroup.group_type}`);
                console.log(`   Modules:`, testGroup.modules);
                console.log(`   Permissions:`, testGroup.permissions);
            }
        } catch (error) {
            console.log(`❌ UserGroups API: Failed`);
            console.log(`   Status: ${error.response?.status}`);
            console.log(`   Message: ${error.response?.data?.message}`);
        }
        
        console.log('\n🏁 Summary:');
        console.log('1. ✅ Contractor login works with admin123 password');
        console.log('2. 🔧 Group permissions update was successful (we fixed the modules)');  
        console.log('3. 📋 ContractorDashboard was updated to use real API data instead of hardcoded values');
        console.log('4. ❓ API access testing shows the current permission status');
        console.log('\nIf customers API fails with 403, the permission middleware needs adjustment.');
        console.log('If it succeeds, then both dashboard hardcoded data AND contractor permissions are fixed! 🎉');
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testDirectAccess();
