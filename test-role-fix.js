const axios = require('axios');

const baseURL = 'http://localhost:8080';

async function testRoleFix() {
    try {
        console.log('🚀 Testing Role ID Fix for Contractor Access\n');
        
        // 1. Fetch all users to see current state
        console.log('1. Fetching all users...');
        const usersResponse = await axios.get(`${baseURL}/api/users`);
        const users = Array.isArray(usersResponse.data) ? usersResponse.data : usersResponse.data.users || [];
        console.log(`Found ${users.length} users`);
        
        if (users.length === 0) {
            console.log('No users data found');
            console.log('Raw response:', JSON.stringify(usersResponse.data, null, 2));
            return;
        }
        
        // Show users with their role_id status
        console.log('\nUsers with role_id issues:');
        const problematicUsers = users.filter(user => 
            user.group_id && (user.role_id === null || user.role_id === undefined || user.role_id === 0)
        );
        
        if (problematicUsers.length === 0) {
            console.log('✅ No users found with missing role_id - checking first few users:');
            users.slice(0, 5).forEach(user => {
                console.log(`  - ${user.name}: group_id=${user.group_id}, role_id=${user.role_id}, group=${user.group?.name || 'None'}`);
            });
        } else {
            problematicUsers.forEach(user => {
                console.log(`  - ${user.name}: group_id=${user.group_id}, role_id=${user.role_id} ❌`);
            });
            
            // Fix the first problematic user
            const userToFix = problematicUsers[0];
            console.log(`\n2. Fixing user: ${userToFix.name} (ID: ${userToFix.id})`);
            console.log(`   Setting role_id to match group_id: ${userToFix.group_id}`);
            
            const updateData = {
                name: userToFix.name,
                password: '', // Empty to keep existing password
                isSalesRep: userToFix.isSalesRep,
                location: userToFix.location,
                userGroup: userToFix.group_id
            };
            
            const updateResponse = await axios.put(`${baseURL}/api/users/${userToFix.id}`, updateData);
            console.log('✅ Update successful');
            
            // Verify the fix
            console.log('\n3. Verifying fix...');
            const verifyResponse = await axios.get(`${baseURL}/api/users/${userToFix.id}`);
            const updatedUser = verifyResponse.data;
            
            console.log(`   User: ${updatedUser.name}`);
            console.log(`   group_id: ${updatedUser.group_id}`);
            console.log(`   role_id: ${updatedUser.role_id}`);
            console.log(`   Group name: ${updatedUser.group?.name || 'None'}`);
            
            if (updatedUser.role_id === updatedUser.group_id && updatedUser.role_id !== null) {
                console.log('   ✅ SUCCESS: role_id now properly set!');
                console.log('   ✅ This user should now have contractor access.');
            } else {
                console.log('   ❌ ISSUE: role_id still not set correctly');
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testRoleFix();
