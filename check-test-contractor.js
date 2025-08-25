const axios = require('axios');

const baseURL = 'http://localhost:8080';

async function checkTestContractor() {
    try {
        console.log('🔍 Checking Test Contractor Configuration\n');
        
        // 1. Find the user tkk@tkk.com
        console.log('1. Looking for user tkk@tkk.com...');
        const usersResponse = await axios.get(`${baseURL}/api/users`);
        const users = usersResponse.data.users || usersResponse.data;
        
        const tkkUser = users.find(user => user.email === 'tkK@tkk.com');
        if (!tkkUser) {
            console.log('❌ User tkK@tkk.com not found');
            return;
        }
        
        console.log(`✅ Found user: ${tkkUser.name}`);
        console.log(`   ID: ${tkkUser.id}`);
        console.log(`   Group ID: ${tkkUser.group_id}`);
        console.log(`   Role ID: ${tkkUser.role_id}`);
        console.log(`   Group: ${tkkUser.group?.name || 'None'}`);
        
        // 2. Get the user group details
        if (tkkUser.group_id) {
            console.log('\n2. Checking user group configuration...');
            const groupsResponse = await axios.get(`${baseURL}/api/usersgroups`);
            const groups = Array.isArray(groupsResponse.data) ? groupsResponse.data : Object.values(groupsResponse.data);
            
            const userGroup = groups.find(group => group.id === tkkUser.group_id);
            if (userGroup) {
                console.log(`✅ Found group: ${userGroup.name}`);
                console.log(`   Type: ${userGroup.group_type}`);
                console.log(`   Modules:`, userGroup.modules);
                
                // Parse modules if it's a string
                let parsedModules = userGroup.modules;
                if (typeof userGroup.modules === 'string') {
                    try {
                        parsedModules = JSON.parse(userGroup.modules);
                    } catch (e) {
                        console.log('   ❌ Error parsing modules JSON');
                    }
                }
                
                console.log(`   Parsed modules:`, parsedModules);
                
                // Check specific permissions
                console.log('\n3. Module permissions:');
                console.log(`   Dashboard: ${parsedModules.dashboard ? '✅' : '❌'}`);
                console.log(`   Proposals: ${parsedModules.proposals ? '✅' : '❌'}`);
                console.log(`   Customers: ${parsedModules.customers ? '✅' : '❌'}`);
                console.log(`   Resources: ${parsedModules.resources ? '✅' : '❌'}`);
                
                if (!parsedModules.proposals) {
                    console.log('\n⚠️  ISSUE: Proposals module is disabled for this group');
                    console.log('   This is why the user cannot see proposal creation/management options');
                }
                
                if (!parsedModules.customers) {
                    console.log('\n⚠️  ISSUE: Customers module is disabled for this group');
                    console.log('   This is why the user cannot see customer creation/management options');
                }
            } else {
                console.log('❌ User group not found');
            }
        } else {
            console.log('\n❌ User has no group assigned');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

checkTestContractor();
