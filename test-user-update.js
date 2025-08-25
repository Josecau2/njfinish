const axios = require('axios');

async function testUserUpdate() {
    const baseURL = 'http://localhost:8080';
    
    try {
        console.log('🚀 Testing User Update with User Group Assignment...\n');
        
        // First, let's get all users to see current state
        console.log('1. Fetching all users...');
        const usersResponse = await axios.get(`${baseURL}/api/users`);
        const users = usersResponse.data.users;
        
        console.log(`Found ${users.length} users:`);
        users.forEach(user => {
            console.log(`   - ${user.name} (ID: ${user.id}, group_id: ${user.group_id}, role_id: ${user.role_id})`);
        });
        console.log('');
        
        // Get all user groups
        console.log('2. Fetching all user groups...');
        const groupsResponse = await axios.get(`${baseURL}/api/usersgroups`);
        const groups = groupsResponse.data;
        
        console.log(`Found ${groups.length} user groups:`);
        groups.forEach(group => {
            console.log(`   - ${group.name} (ID: ${group.id})`);
        });
        console.log('');
        
        // Find the "Tkk" user (ID 29) or any user to test with
        const testUser = users.find(u => u.name === 'Tkk') || users[0];
        if (!testUser) {
            console.log('❌ No users found to test with');
            return;
        }
        
        console.log(`3. Testing update on user: ${testUser.name} (ID: ${testUser.id})`);
        console.log(`   Current state: group_id=${testUser.group_id}, role_id=${testUser.role_id}`);
        
        // Find a contractor group to assign
        const contractorGroup = groups.find(g => g.group_type === 'contractor') || groups[0];
        if (!contractorGroup) {
            console.log('❌ No contractor groups found');
            return;
        }
        
        console.log(`   Assigning user to group: ${contractorGroup.name} (ID: ${contractorGroup.id})`);
        
        // Update the user with the new group
        const updateData = {
            name: testUser.name,
            email: testUser.email,
            password: '', // Empty password means no change
            confirmPassword: '',
            userGroup: contractorGroup.id, // This should set both group_id and role_id
            location: testUser.location || '1',
            isSalesRep: testUser.isSalesRep || false
        };
        
        console.log('4. Sending update request...');
        const updateResponse = await axios.put(`${baseURL}/api/users/${testUser.id}`, updateData);
        
        console.log('✅ Update response received:');
        console.log(`   Status: ${updateResponse.data.status}`);
        console.log(`   Message: ${updateResponse.data.message}`);
        
        if (updateResponse.data.user) {
            const updatedUser = updateResponse.data.user;
            console.log(`   Updated user state:`);
            console.log(`     - group_id: ${updatedUser.group_id}`);
            console.log(`     - role_id: ${updatedUser.role_id}`);
            
            // Verify the fix
            if (updatedUser.group_id == contractorGroup.id && updatedUser.role_id == contractorGroup.id) {
                console.log('🎉 SUCCESS: Both group_id and role_id are set correctly!');
            } else {
                console.log('❌ ISSUE: group_id and role_id do not match expected values');
                console.log(`   Expected both to be: ${contractorGroup.id}`);
                console.log(`   Got group_id: ${updatedUser.group_id}, role_id: ${updatedUser.role_id}`);
            }
        }
        
        console.log('\n5. Fetching updated user to verify database state...');
        const verifyResponse = await axios.get(`${baseURL}/api/users/${testUser.id}`);
        const verifiedUser = verifyResponse.data;
        
        console.log('✅ Database verification:');
        console.log(`   - group_id: ${verifiedUser.group_id}`);
        console.log(`   - role_id: ${verifiedUser.role_id}`);
        console.log(`   - User group: ${verifiedUser.group ? verifiedUser.group.name : 'Not loaded'}`);
        
    } catch (error) {
        console.error('❌ Test failed:', error.response ? error.response.data : error.message);
    }
}

// Run the test
testUserUpdate();
