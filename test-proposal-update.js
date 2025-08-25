const axios = require('axios');

// Test script to debug proposal update issues
async function testProposalUpdate() {
    try {
        console.log('🧪 Testing Proposal Update API...\n');

        // Step 1: Login as contractor to get token
        console.log('1. Logging in as contractor...');
        const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
            email: 'tkk@tkk.com',
            password: 'password123' // Replace with actual password
        });

        if (!loginResponse.data.success) {
            console.error('❌ Login failed:', loginResponse.data.message);
            return;
        }

        const token = loginResponse.data.token;
        const user = loginResponse.data.user;
        console.log('✅ Login successful! User:', user.name, 'Group:', user.group_id);

        // Step 2: Get a proposal to update
        console.log('\n2. Fetching contractor proposals...');
        const proposalsResponse = await axios.get('http://localhost:8080/api/get-proposals', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!proposalsResponse.data.success || !proposalsResponse.data.data || proposalsResponse.data.data.length === 0) {
            console.error('❌ No proposals found for testing');
            return;
        }

        const testProposal = proposalsResponse.data.data[0];
        console.log('✅ Found test proposal:', {
            id: testProposal.id,
            status: testProposal.status,
            type: testProposal.type,
            owner_group_id: testProposal.owner_group_id
        });

        // Step 3: Test proposal update (simulate what EditProposal does)
        console.log('\n3. Testing proposal update...');
        
        const updatePayload = {
            action: 'update', // or whatever action the frontend sends
            formData: {
                id: testProposal.id,
                status: testProposal.status, // Keep same status
                description: 'Test update from script',
                owner_group_id: testProposal.owner_group_id,
                customerId: testProposal.customerId || 0,
                type: testProposal.type
            }
        };

        console.log('📤 Sending update payload:', JSON.stringify(updatePayload, null, 2));

        const updateResponse = await axios.post('http://localhost:8080/api/update-proposals', updatePayload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Update successful!', updateResponse.data);

    } catch (error) {
        console.error('\n❌ Error occurred:');
        
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Status Text:', error.response.statusText);
            console.error('Response Data:', error.response.data);
            console.error('Headers:', error.response.headers);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error setting up request:', error.message);
        }
        
        console.error('\nFull error:', error);
    }
}

// Test different scenarios
async function testMultipleScenarios() {
    console.log('🔬 Running multiple test scenarios...\n');
    
    try {
        // Login first
        console.log('Logging in...');
        const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
            email: 'tkk@tkk.com',
            password: 'password123'
        });

        const token = loginResponse.data.token;
        
        // Get proposals
        const proposalsResponse = await axios.get('http://localhost:8080/api/get-proposals', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const testProposal = proposalsResponse.data.data[0];
        
        // Test scenarios
        const scenarios = [
            {
                name: 'Update without status change',
                payload: {
                    formData: {
                        id: testProposal.id,
                        description: 'Updated description',
                        // Don't include status to avoid validation
                    }
                }
            },
            {
                name: 'Update keeping same status',
                payload: {
                    formData: {
                        id: testProposal.id,
                        status: testProposal.status,
                        description: 'Updated with same status',
                    }
                }
            },
            {
                name: 'Update with minimal data',
                payload: {
                    formData: {
                        id: testProposal.id,
                    }
                }
            }
        ];

        for (const scenario of scenarios) {
            console.log(`\n🧪 Testing: ${scenario.name}`);
            try {
                const response = await axios.post('http://localhost:8080/api/update-proposals', scenario.payload, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
                console.log('✅ Success:', response.data.message || 'Updated');
            } catch (error) {
                console.error('❌ Failed:', error.response?.data?.message || error.message);
            }
        }

    } catch (error) {
        console.error('❌ Test setup failed:', error.message);
    }
}

// Run the tests
console.log('🚀 Starting Proposal Update Tests\n');
console.log('Make sure the backend server is running on localhost:8080\n');

// Run basic test first
testProposalUpdate()
    .then(() => {
        console.log('\n' + '='.repeat(50));
        return testMultipleScenarios();
    })
    .then(() => {
        console.log('\n✨ All tests completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Test execution failed:', error);
        process.exit(1);
    });
