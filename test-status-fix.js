const axios = require('axios');

console.log('🧪 Testing status transition fix...');

async function testStatusTransitionFix() {
    const baseURL = 'http://localhost:8080';
    
    try {
        // Login as contractor
        console.log('1. Logging in as contractor...');
        const login = await axios.post(`${baseURL}/api/login`, {
            email: 'contractor1@example.com',
            password: 'ContractorPass1!'
        });
        
        const token = login.data.token;
        console.log('✅ Login successful');
        
        // Get a draft proposal to test with
        console.log('\n2. Finding a draft proposal...');
        const proposals = await axios.get(`${baseURL}/api/proposals`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        let draftProposal = proposals.data.data.find(p => 
            (p.status === 'draft' || p.status === 'Draft') && !p.is_locked
        );
        
        if (!draftProposal) {
            console.log('⚠️  No draft proposals found. Creating one...');
            
            // Create a test draft proposal
            const createResponse = await axios.post(`${baseURL}/api/create-proposals`, {
                action: 'save',
                formData: {
                    customerId: 44,
                    description: 'Test proposal for status transition',
                    status: 'draft',
                    manufacturersData: JSON.stringify([{
                        manufacturer: 1,
                        versionName: "Test",
                        selectedStyle: 1,
                        items: [{
                            id: 1,
                            code: "test",
                            description: "test item",
                            qty: 1,
                            originalPrice: 100,
                            price: 100,
                            total: 100
                        }],
                        summary: { total: 100, grandTotal: 100 }
                    }])
                }
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (createResponse.data.success) {
                draftProposal = createResponse.data.proposal;
                console.log(`✅ Created test proposal ${draftProposal.id}`);
            } else {
                throw new Error('Failed to create test proposal');
            }
        } else {
            console.log(`✅ Found draft proposal ${draftProposal.id} with status: "${draftProposal.status}"`);
        }
        
        // Test the status transition from draft to accepted
        console.log(`\n3. Testing transition from "${draftProposal.status}" to "Proposal accepted"...`);
        
        const acceptPayload = {
            action: 'accept',
            formData: {
                id: draftProposal.id,
                customerId: draftProposal.customerId,
                description: draftProposal.description,
                status: 'Proposal accepted',
                manufacturersData: draftProposal.manufacturersData
            }
        };
        
        try {
            const acceptResponse = await axios.post(`${baseURL}/api/update-proposals`, acceptPayload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (acceptResponse.data.success) {
                console.log('✅ SUCCESS: Status transition from draft to "Proposal accepted" now works!');
                console.log('   Response:', acceptResponse.data.message);
            } else {
                console.log('❌ Failed:', acceptResponse.data.message);
            }
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('❌ Still getting 400 error:', error.response.data.message);
            } else {
                console.log('❌ Other error:', error.response?.status, error.response?.data || error.message);
            }
        }
        
        // Test a few other transitions to make sure we didn't break anything
        console.log('\n4. Testing other valid transitions...');
        
        // Test Draft to sent
        const sentPayload = {
            action: 'send',
            formData: {
                id: draftProposal.id,
                status: 'sent'
            }
        };
        
        try {
            await axios.post(`${baseURL}/api/update-proposals`, sentPayload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Draft → sent transition works');
        } catch (error) {
            console.log('❌ Draft → sent failed:', error.response?.data?.message);
        }
        
    } catch (error) {
        console.error('\n💥 Test failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testStatusTransitionFix().then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
}).catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
});
