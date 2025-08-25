const axios = require('axios');

console.log('🔍 Testing proposal update API...');

async function testProposalUpdate() {
    const baseURL = 'http://localhost:8080';
    
    try {
        // Login first
        console.log('1. Logging in...');
        const login = await axios.post(`${baseURL}/api/login`, {
            email: 'joseca@symmetricalwolf.com',
            password: 'admin123'
        });
        
        const token = login.data.token;
        console.log('✅ Login successful');
        
        // Get an existing proposal to update
        console.log('2. Getting proposals...');
        const proposals = await axios.get(`${baseURL}/api/proposals`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (proposals.data.data.length === 0) {
            throw new Error('No proposals found to test with');
        }
        
        // Find an unlocked proposal
        let testProposal;
        const unlockedProposal = proposals.data.data.find(p => !p.is_locked);
        if (!unlockedProposal) {
            console.log('⚠️  All proposals are locked. Using first proposal and showing detailed info...');
            const firstProposal = proposals.data.data[0];
            console.log(`Proposal ${firstProposal.id} status: ${firstProposal.status}, locked: ${firstProposal.is_locked}`);
            
            // Let's also check a few more proposals
            proposals.data.data.slice(0, 5).forEach(p => {
                console.log(`  Proposal ${p.id}: status="${p.status}", locked=${p.is_locked}`);
            });
            
            // Try to find a draft or non-locked one
            const draftProposal = proposals.data.data.find(p => 
                p.status === 'Draft' || 
                p.status === 'draft' || 
                !p.is_locked
            );
            
            if (draftProposal) {
                console.log(`✅ Found usable proposal ${draftProposal.id}`);
                testProposal = draftProposal;
            } else {
                throw new Error('No unlocked proposals available for testing');
            }
        } else {
            testProposal = unlockedProposal;
            console.log(`✅ Found unlocked proposal ${testProposal.id} to test with`);
        }
        
        // Test the update with different payload structures
        console.log('\n3. Testing different payload structures...');
        
        // Test 1: What the frontend might be sending (incorrect)
        console.log('\nTest 1: Frontend-style payload (likely incorrect)...');
        try {
            const frontendPayload = {
                formData: {
                    id: testProposal.id,
                    description: 'Test update from frontend style',
                    status: testProposal.status
                }
            };
            
            const response1 = await axios.post(`${baseURL}/api/update-proposals`, frontendPayload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Frontend-style payload succeeded:', response1.data.success);
        } catch (error) {
            console.log('❌ Frontend-style payload failed:', error.response?.status, error.response?.data?.message);
        }
        
        // Test 2: What the backend expects (correct)
        console.log('\nTest 2: Backend-expected payload...');
        try {
            const backendPayload = {
                action: 'save',
                formData: {
                    id: testProposal.id,
                    description: 'Test update from backend style',
                    status: testProposal.status
                }
            };
            
            const response2 = await axios.post(`${baseURL}/api/update-proposals`, backendPayload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Backend-expected payload succeeded:', response2.data.success);
        } catch (error) {
            console.log('❌ Backend-expected payload failed:', error.response?.status, error.response?.data?.message);
        }
        
        // Test 3: Missing formData entirely
        console.log('\nTest 3: Missing formData...');
        try {
            const missingFormData = {
                action: 'save'
            };
            
            const response3 = await axios.post(`${baseURL}/api/update-proposals`, missingFormData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Missing formData succeeded:', response3.data.success);
        } catch (error) {
            console.log('❌ Missing formData failed:', error.response?.status, error.response?.data?.message);
        }
        
        // Test 4: Missing ID in formData
        console.log('\nTest 4: Missing ID in formData...');
        try {
            const missingId = {
                action: 'save',
                formData: {
                    description: 'Test without ID'
                }
            };
            
            const response4 = await axios.post(`${baseURL}/api/update-proposals`, missingId, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Missing ID succeeded:', response4.data.success);
        } catch (error) {
            console.log('❌ Missing ID failed:', error.response?.status, error.response?.data?.message);
        }
        
    } catch (error) {
        console.error('\n💥 Test failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testProposalUpdate().then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
}).catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
});
