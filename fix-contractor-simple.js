const axios = require('axios');

const baseURL = 'http://localhost:8080';

async function fixTestContractorGroup() {
    try {
        console.log('🔧 Fixing Test Contractor Group Configuration\n');
        
        // 1. Get all user groups
        console.log('1. Fetching user groups...');
        const groupsResponse = await axios.get(`${baseURL}/api/usersgroups`);
        console.log('Response structure:', typeof groupsResponse.data, Object.keys(groupsResponse.data));
        
        // The API returns { message: "...", users: [...] }
        const groups = groupsResponse.data.users || [];
        console.log(`Found ${groups.length} groups total`);
        
        // 2. Find test contractor group
        const testGroup = groups.find(group => 
            group.name && group.name.toLowerCase().includes('test contractor')
        );
        
        if (!testGroup) {
            console.log('❌ Test contractor group not found');
            console.log('Available groups:');
            groups.slice(0, 5).forEach(group => {
                console.log(`  - ${group.name} (ID: ${group.id}, Type: ${group.group_type})`);
            });
            return;
        }
        
        console.log(`✅ Found test group: ${testGroup.name} (ID: ${testGroup.id})`);
        console.log(`   Current type: ${testGroup.group_type}`);
        console.log(`   Current modules:`, testGroup.modules);
        
        // 3. Update the group to enable all modules
        console.log('\n2. Updating group to enable all contractor modules...');
        
        const updatedModules = {
            dashboard: true,
            proposals: true,
            customers: true,
            resources: true
        };
        
        const updateData = {
            name: testGroup.name,
            group_type: 'contractor',
            modules: updatedModules
        };
        
        console.log('Sending update:', updateData);
        
        const updateResponse = await axios.put(`${baseURL}/api/usersgroups/${testGroup.id}`, updateData);
        console.log('✅ Group updated successfully');
        console.log('Update response:', updateResponse.data);
        
        // 4. Verify the update
        console.log('\n3. Verifying update...');
        const verifyResponse = await axios.get(`${baseURL}/api/usersgroups/${testGroup.id}`);
        const updatedGroup = verifyResponse.data.user || verifyResponse.data;
        
        console.log(`✅ Verified group: ${updatedGroup.name}`);
        console.log(`   Type: ${updatedGroup.group_type}`);
        console.log(`   Modules:`, updatedGroup.modules);
        
        // 5. Check module status
        const modules = updatedGroup.modules;
        console.log('\n4. Module status:');
        console.log(`   Dashboard: ${modules.dashboard ? '✅' : '❌'}`);
        console.log(`   Proposals: ${modules.proposals ? '✅' : '❌'}`);
        console.log(`   Customers: ${modules.customers ? '✅' : '❌'}`);
        console.log(`   Resources: ${modules.resources ? '✅' : '❌'}`);
        
        if (modules.proposals && modules.customers) {
            console.log('\n🎉 SUCCESS! The test contractor group now has proposals and customers modules enabled.');
            console.log('   The user tkk@tkk.com should now be able to see:');
            console.log('   - Proposals menu in navigation');
            console.log('   - Customers menu in navigation');
            console.log('   - Create proposal and customer options');
        } else {
            console.log('\n❌ Something went wrong - modules are still not enabled properly');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
        }
    }
}

fixTestContractorGroup();
