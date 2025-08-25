const axios = require('axios');

async function tryDifferentPasswords() {
    const passwords = ['test123', 'password', '123456', 'tkk123', 'Test123!'];
    
    for (const password of passwords) {
        try {
            console.log(`🔑 Trying password: ${password}`);
            const loginResponse = await axios.post('http://localhost:8080/api/login', {
                email: 'tkk@tkk.com',
                password: password
            });
            
            if (loginResponse.data.token) {
                console.log(`✅ LOGIN SUCCESS with password: ${password}`);
                console.log(`   User: ${loginResponse.data.user.first_name} ${loginResponse.data.user.last_name}`);
                console.log(`   Group ID: ${loginResponse.data.user.group_id}`);
                console.log(`   Role ID: ${loginResponse.data.user.role_id}`);
                return;
            }
        } catch (error) {
            console.log(`❌ Failed with ${password}: ${error.response?.data?.message || error.message}`);
        }
    }
    
    console.log('\n❌ None of the common passwords worked. The user might need a password reset.');
}

tryDifferentPasswords();
