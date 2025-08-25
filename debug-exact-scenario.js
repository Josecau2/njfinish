const axios = require('axios');

console.log('🔍 Testing exact scenario from browser...');

async function testExactScenario() {
    const baseURL = 'http://localhost:8080';
    
    try {
        // Login as contractor (since owner_group_id is 14)
        console.log('1. Logging in as contractor...');
        const login = await axios.post(`${baseURL}/api/login`, {
            email: 'contractor1@example.com',
            password: 'ContractorPass1!'
        });
        
        const token = login.data.token;
        console.log('✅ Login successful, user info:', {
            name: login.data.name,
            role: login.data.role,
            group_id: login.data.group_id
        });
        
        // Test the exact payload from the browser
        console.log('\n2. Testing exact browser payload...');
        const exactPayload = {
            "action": "accept",
            "formData": {
                "id": 74,
                "customerId": 44,
                "designer": null,
                "description": "Test update from backend style",
                "measurementDone": false,
                "designDone": false,
                "measurementDate": null,
                "designDate": null,
                "location": null,
                "salesRep": null,
                "leadSource": null,
                "type": "1",
                "assembled": true,
                "status": "Proposal accepted",
                "followUp1Date": null,
                "followUp2Date": null,
                "followUp3Date": null,
                "manufacturersData": [
                    {
                        "manufacturer": 1,
                        "versionName": "Jose Fleitas",
                        "selectedStyle": 1,
                        "items": [
                            {
                                "id": 1,
                                "code": "b09",
                                "description": "laksdald",
                                "qty": 1,
                                "originalPrice": 100,
                                "appliedMultiplier": 1.6,
                                "price": 160,
                                "assemblyFee": 8,
                                "total": 168,
                                "selectVersion": "Jose Fleitas",
                                "includeAssemblyFee": true,
                                "isRowAssembled": true,
                                "hingeSide": "L",
                                "exposedSide": "B"
                            }
                        ],
                        "customItems": [],
                        "summary": {
                            "cabinets": 160,
                            "assemblyFee": 8,
                            "modificationsCost": 0,
                            "styleTotal": 168,
                            "discountPercent": 0,
                            "discountAmount": 0,
                            "total": 168,
                            "taxRate": 0,
                            "taxAmount": 0,
                            "grandTotal": 168
                        }
                    }
                ],
                "date": "2025-08-24T18:20:11.000Z",
                "isDeleted": false,
                "owner_group_id": 14,
                "accepted_at": null,
                "accepted_by": null,
                "sent_at": null,
                "is_locked": false,
                "createdAt": "2025-08-23T15:51:31.000Z",
                "updatedAt": "2025-08-24T18:20:11.000Z",
                "customer": {
                    "id": 44,
                    "name": "Debug Test Customer",
                    "email": "debug.test2@example.com",
                    "phone": null,
                    "address": null
                }
            }
        };
        
        try {
            const response = await axios.post(`${baseURL}/api/update-proposals`, exactPayload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Success:', response.data);
        } catch (error) {
            console.log('❌ Error:', error.response?.status, error.response?.data);
            
            // Check if it's a validation error
            if (error.response?.status === 400) {
                const errorMsg = error.response.data?.message;
                console.log('📋 Detailed error analysis:');
                console.log('   Message:', errorMsg);
                
                if (errorMsg?.includes('status')) {
                    console.log('   💡 This appears to be a status transition issue');
                    
                    // Let's check what the current proposal status is
                    console.log('\n3. Checking current proposal status...');
                    const currentProposal = await axios.get(`${baseURL}/api/proposals/${exactPayload.formData.id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    const proposal = currentProposal.data.data;
                    console.log('📄 Current proposal state:');
                    console.log('   ID:', proposal.id);
                    console.log('   Current Status:', proposal.status);
                    console.log('   Desired Status:', exactPayload.formData.status);
                    console.log('   Is Locked:', proposal.is_locked);
                    console.log('   Accepted At:', proposal.accepted_at);
                    console.log('   Sent At:', proposal.sent_at);
                    
                    // Check if it's already accepted
                    if (proposal.status === 'Proposal accepted' || proposal.status === 'accepted') {
                        console.log('   ⚠️  Proposal is already accepted!');
                    } else if (proposal.is_locked) {
                        console.log('   🔒 Proposal is locked!');
                    } else {
                        console.log('   🤔 Status transition should be valid...');
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('\n💥 Test failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testExactScenario().then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
}).catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
});
