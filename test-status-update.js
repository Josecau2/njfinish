// Test script to verify status updates work correctly
const axios = require('axios');

const baseURL = 'http://localhost:8080';

// Test different status transitions
const testStatusUpdates = async () => {
    try {
        // You'll need to replace this with a valid token from your login
        const token = 'your_jwt_token_here';
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        const testCases = [
            {
                description: 'Update to Follow up 1',
                payload: {
                    action: 'update',
                    formData: {
                        id: 71,
                        status: 'Follow up 1',
                        description: 'Kitchen Remodel'
                    }
                }
            },
            {
                description: 'Update to Measurement Scheduled',
                payload: {
                    action: 'update',
                    formData: {
                        id: 71,
                        status: 'Measurement Scheduled',
                        description: 'Kitchen Remodel'
                    }
                }
            },
            {
                description: 'Update to Proposal done',
                payload: {
                    action: 'update',
                    formData: {
                        id: 71,
                        status: 'Proposal done',
                        description: 'Kitchen Remodel'
                    }
                }
            }
        ];

        for (const testCase of testCases) {
            console.log(`\n=== Testing: ${testCase.description} ===`);
            console.log('Payload:', JSON.stringify(testCase.payload, null, 2));
            
            try {
                const response = await axios.post(`${baseURL}/api/update-proposals`, testCase.payload, { headers });
                console.log('✅ Success:', response.data);
            } catch (error) {
                console.log('❌ Error:', error.response?.data || error.message);
            }
        }

    } catch (error) {
        console.error('Test setup error:', error.message);
    }
};

console.log('Status Update Test Script');
console.log('Note: Replace "your_jwt_token_here" with a valid JWT token from browser localStorage');
console.log('Run with: node test-status-update.js');

testStatusUpdates();
