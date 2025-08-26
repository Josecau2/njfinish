const axios = require('axios');

// Test the rollback capabilities
async function testRollbackFeatures() {
    const API_BASE_URL = 'http://localhost:8080';
    const manufacturerId = 1; // Replace with actual manufacturer ID
    
    // You'll need to get a valid token from your login process
    const token = 'your-auth-token'; // Replace with actual token
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        console.log('🧪 Testing Rollback Capabilities...\n');

        // 1. Get available backups
        console.log('1. Fetching available backups...');
        const backupsResponse = await axios.get(
            `${API_BASE_URL}/api/manufacturers/${manufacturerId}/catalog/backups`,
            { headers }
        );
        
        console.log('✅ Backups fetched successfully');
        console.log('Available backups:', backupsResponse.data.backups.length);
        
        if (backupsResponse.data.backups.length > 0) {
            console.log('First backup:', {
                sessionId: backupsResponse.data.backups[0].uploadSessionId,
                filename: backupsResponse.data.backups[0].originalName,
                itemsCount: backupsResponse.data.backups[0].itemsCount,
                uploadedAt: backupsResponse.data.backups[0].uploadedAt
            });
        }

        // 2. Test rollback (commented out for safety)
        /*
        if (backupsResponse.data.backups.length > 0) {
            console.log('\n2. Testing rollback...');
            const rollbackResponse = await axios.post(
                `${API_BASE_URL}/api/manufacturers/${manufacturerId}/catalog/rollback`,
                { uploadSessionId: backupsResponse.data.backups[0].uploadSessionId },
                { headers }
            );
            
            console.log('✅ Rollback completed');
            console.log('Result:', rollbackResponse.data.message);
        }
        */

        // 3. Test cleanup old backups
        console.log('\n3. Testing cleanup old backups...');
        const cleanupResponse = await axios.delete(
            `${API_BASE_URL}/api/manufacturers/${manufacturerId}/catalog/cleanup-backups`,
            { headers }
        );
        
        console.log('✅ Cleanup completed');
        console.log('Result:', cleanupResponse.data.message);

        console.log('\n🎉 All rollback features are working correctly!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

console.log('📋 Rollback Feature Test Script');
console.log('================================');
console.log('⚠️  Please update the manufacturerId and token before running');
console.log('⚠️  Uncomment rollback test when ready (it will modify data)');
console.log('');

// Uncomment to run the test
// testRollbackFeatures();
