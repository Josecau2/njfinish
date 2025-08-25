const axios = require('axios');

const baseURL = 'http://localhost:8080';

async function fixTestContractorGroup() {
    try {
        console.log('🔧 Fixing Test Contractor Group Configuration\n');
        
        // 1. Find the test contractor group by searching all groups
        console.log('1. Finding test contractor group...');
        const groupsResponse = await axios.get(`${baseURL}/api/usersgroups`);
        let groups = [];
        
        // Handle different response formats
        if (Array.isArray(groupsResponse.data)) {
            groups = groupsResponse.data;
        } else if (groupsResponse.data.data) {
            groups = groupsResponse.data.data;
        } else {
            // Try to parse if it's an object with numeric keys
            groups = Object.values(groupsResponse.data).filter(item => item && typeof item === 'object' && item.id);
        }
        
        console.log(`Found ${groups.length} groups total`);
        
        const testGroup = groups.find(group => 
            group.name && group.name.toLowerCase().includes('test')
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
        console.log(`   Current modules: ${JSON.stringify(testGroup.modules)}`);
        
        // 2. Update the group to enable all modules
        console.log('\n2. Updating group to enable all contractor modules...');
        
        const updatedModules = {
            dashboard: true,
            proposals: true,
            customers: true,
            resources: true
        };
        
        const updateData = {
            name: testGroup.name,
            group_type: 'contractor', // Ensure it's set as contractor type
            modules: updatedModules
        };
        
        console.log('Sending update:', updateData);
        
        const updateResponse = await axios.put(`${baseURL}/api/usersgroups/${testGroup.id}`, updateData);
        console.log('✅ Group updated successfully');
        console.log('Response:', updateResponse.data);
        
        // 3. Verify the update
        console.log('\n3. Verifying update...');
        const verifyResponse = await axios.get(`${baseURL}/api/usersgroups/${testGroup.id}`);
        const updatedGroup = verifyResponse.data;
        
        console.log(`✅ Verified group: ${updatedGroup.name}`);
        console.log(`   Type: ${updatedGroup.group_type}`);
        console.log(`   Modules: ${JSON.stringify(updatedGroup.modules)}`);
        
        // Parse and check modules
        let parsedModules = updatedGroup.modules;
        if (typeof updatedGroup.modules === 'string') {
            try {
                parsedModules = JSON.parse(updatedGroup.modules);
            } catch (e) {
                console.log('   ❌ Error parsing modules JSON');
                return;
            }
        }
        
        console.log('\n4. Module status:');
        console.log(`   Dashboard: ${parsedModules.dashboard ? '✅' : '❌'}`);
        console.log(`   Proposals: ${parsedModules.proposals ? '✅' : '❌'}`);
        console.log(`   Customers: ${parsedModules.customers ? '✅' : '❌'}`);
        console.log(`   Resources: ${parsedModules.resources ? '✅' : '❌'}`);
        
        if (parsedModules.proposals && parsedModules.customers) {
            console.log('\n🎉 SUCCESS! The test contractor group now has proposals and customers modules enabled.');
            console.log('   The user should now be able to see:');
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
            console.error('Headers:', error.response.headers);
        }
    }
}

fixTestContractorGroup();
