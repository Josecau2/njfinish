const axios = require('axios');

// Test script for proposal acceptance API
async function testProposalAcceptance() {
    const baseURL = 'http://localhost:8080';
    
    try {
        // First, let's create a test proposal to accept
        console.log('🧪 Testing Proposal Acceptance API...\n');
        
        // You'll need to replace these with actual values from your system
        const testProposalId = 1; // Replace with actual proposal ID
        const testToken = 'your-jwt-token-here'; // Replace with actual token
        
        console.log(`Testing acceptance of proposal ID: ${testProposalId}`);
        
        // Test 1: Internal acceptance (contractor/admin)
        console.log('\n1. Testing internal acceptance...');
        try {
            const internalResponse = await axios.post(
                `${baseURL}/api/proposals/${testProposalId}/accept`,
                {}, // Empty body for internal acceptance
                {
                    headers: {
                        'Authorization': `Bearer ${testToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('✅ Internal acceptance successful:');
            console.log('Response:', internalResponse.data);
            console.log('Event data:', internalResponse.data.eventData);
            
        } catch (error) {
            console.log('❌ Internal acceptance failed:');
            console.log('Error:', error.response?.data || error.message);
        }
        
        // Test 2: External acceptance (if proposal is not already accepted)
        console.log('\n2. Testing external acceptance...');
        try {
            const externalResponse = await axios.post(
                `${baseURL}/api/proposals/${testProposalId + 1}/accept`, // Use different ID
                {
                    external_signer_name: 'John Customer',
                    external_signer_email: 'john@customer.com'
                },
                {
                    headers: {
                        'Authorization': `Bearer ${testToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('✅ External acceptance successful:');
            console.log('Response:', externalResponse.data);
            console.log('Event data:', externalResponse.data.eventData);
            
        } catch (error) {
            console.log('❌ External acceptance failed:');
            console.log('Error:', error.response?.data || error.message);
        }
        
        // Test 3: Try to accept already accepted proposal (should fail)
        console.log('\n3. Testing duplicate acceptance (should fail)...');
        try {
            await axios.post(
                `${baseURL}/api/proposals/${testProposalId}/accept`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${testToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('❌ Duplicate acceptance should have failed but succeeded');
            
        } catch (error) {
            console.log('✅ Duplicate acceptance correctly rejected:');
            console.log('Error:', error.response?.data?.message || error.message);
        }
        
    } catch (error) {
        console.error('Test setup error:', error.message);
    }
}

// Usage instructions
console.log(`
📋 PROPOSAL ACCEPTANCE API TEST INSTRUCTIONS:

1. Make sure your server is running on port 8080
2. Update the testProposalId and testToken variables in this script
3. Ensure you have proposals in 'sent' status to test with
4. Run: node test-proposal-acceptance.js

🔧 To get test data:
- Login to get a valid JWT token
- Create a proposal and set its status to 'sent'
- Use that proposal ID in this test

⚠️  Note: This test will actually accept proposals, so use test data only!
`);

// Uncomment the line below to run the test (after updating the variables)
// testProposalAcceptance();

module.exports = testProposalAcceptance;
