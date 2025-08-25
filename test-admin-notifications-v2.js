const axios = require('axios');

console.log('🚀 Admin notification test script starting...');

// Test script to verify admin notifications when contractor accepts proposal
async function testAdminNotifications() {
    console.log('📍 Function testAdminNotifications called');
    const baseURL = 'http://localhost:8080';
    
    try {
        console.log('🧪 Testing Admin Notifications on Proposal Acceptance...\n');
        
        // Step 1: Login as admin to get initial notification count
        console.log('1. Logging in as admin...');
        const adminLogin = await axios.post(`${baseURL}/api/login`, {
            email: 'joseca@symmetricalwolf.com',
            password: 'admin123'
        });
        
        if (!adminLogin.data.token) {
            throw new Error('Admin login failed - no token received');
        }
        
        const adminToken = adminLogin.data.token;
        console.log('✅ Admin logged in successfully');
        
        // Step 2: Get initial unread count for admin
        console.log('\n2. Getting initial admin notification count...');
        const initialCount = await axios.get(`${baseURL}/api/notifications/unread-count`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        console.log(`📬 Initial admin unread count: ${initialCount.data.unreadCount}`);
        
        // Step 3: Login as contractor
        console.log('\n3. Logging in as contractor...');
        const contractorLogin = await axios.post(`${baseURL}/api/login`, {
            email: 'contractor1@example.com',
            password: 'ContractorPass1!'
        });
        
        if (!contractorLogin.data.token) {
            throw new Error('Contractor login failed - no token received');
        }
        
        const contractorToken = contractorLogin.data.token;
        console.log('✅ Contractor logged in successfully');
        
        // Step 4: Get a proposal that can be accepted
        console.log('\n4. Finding a proposal to accept...');
        const proposals = await axios.get(`${baseURL}/api/proposals`, {
            headers: { 'Authorization': `Bearer ${contractorToken}` }
        });
        
        console.log(`Found ${proposals.data.data.length} proposals`);
        
        let proposalId;
        const acceptableProposal = proposals.data.data.find(p => 
            p.status === 'sent'
        );
        
        if (!acceptableProposal) {
            console.log('⚠️  No proposals in "sent" status found. Checking all statuses...');
            const statusCounts = {};
            proposals.data.data.forEach(p => {
                statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
                console.log(`   Proposal ${p.id}: status = "${p.status}"`);
            });
            console.log('Status summary:', statusCounts);
            
            // Try to change the first "Proposal done" to "sent" status
            const proposalDone = proposals.data.data.find(p => p.status === 'Proposal done');
            if (proposalDone) {
                console.log(`\n📝 Attempting to change proposal ${proposalDone.id} status from "Proposal done" to "sent"...`);
                
                try {
                    const updateResponse = await axios.put(`${baseURL}/api/proposals/${proposalDone.id}`, {
                        status: 'sent'
                    }, {
                        headers: { 'Authorization': `Bearer ${adminToken}` }
                    });
                    
                    if (updateResponse.data.success) {
                        console.log('✅ Successfully updated proposal status to "sent"');
                        proposalId = proposalDone.id;
                    } else {
                        throw new Error('Failed to update proposal status');
                    }
                } catch (updateError) {
                    console.error('❌ Failed to update proposal status:', updateError.response?.data || updateError.message);
                    throw new Error('No valid proposals found and cannot create test scenario');
                }
            } else {
                throw new Error('No proposals found to test with');
            }
        } else {
            proposalId = acceptableProposal.id;
            console.log(`✅ Found proposal ${proposalId} with status: ${acceptableProposal.status}`);
        }
        
        // Step 5: Accept the proposal as contractor
        console.log(`\n5. Accepting proposal ${proposalId} as contractor...`);
        const acceptResponse = await axios.post(`${baseURL}/api/proposals/${proposalId}/accept`, {}, {
            headers: { 'Authorization': `Bearer ${contractorToken}` }
        });
        
        console.log('Accept response:', acceptResponse.data);
        
        if (acceptResponse.data.success) {
            console.log('✅ Proposal accepted successfully');
        } else {
            console.log('⚠️  Proposal accept returned success=false, continuing anyway...');
        }
        
        // Step 6: Wait a moment for the notification to be created
        console.log('\n6. Waiting for notification processing...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Step 7: Check admin notifications again
        console.log('\n7. Checking admin notifications after proposal acceptance...');
        const finalCount = await axios.get(`${baseURL}/api/notifications/unread-count`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        console.log(`📬 Final admin unread count: ${finalCount.data.unreadCount}`);
        
        // Step 8: Get the actual notifications to see content
        console.log('\n8. Fetching admin notifications...');
        const notifications = await axios.get(`${baseURL}/api/notifications`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const recentNotifications = notifications.data.data.filter(n => 
            new Date(n.created_at) > new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
        );
        
        console.log(`📋 Recent notifications (${recentNotifications.length}):`);
        recentNotifications.forEach(notification => {
            console.log(`  - ${notification.message} (${notification.type}) - ${notification.read_status ? 'Read' : 'Unread'} - ${new Date(notification.created_at).toLocaleTimeString()}`);
        });
        
        // Step 9: Verify the notification increase
        const countIncrease = finalCount.data.unreadCount - initialCount.data.unreadCount;
        
        console.log('\n📊 Results:');
        console.log(`   Initial count: ${initialCount.data.unreadCount}`);
        console.log(`   Final count: ${finalCount.data.unreadCount}`);
        console.log(`   Increase: ${countIncrease}`);
        
        if (countIncrease > 0) {
            console.log('\n✅ SUCCESS: Admin received notification(s) when contractor accepted proposal!');
            
            // Check if there's a specific proposal acceptance notification
            const proposalNotification = recentNotifications.find(n => 
                n.message.toLowerCase().includes('proposal') && 
                (n.message.toLowerCase().includes('accept') || n.message.toLowerCase().includes('ready'))
            );
            
            if (proposalNotification) {
                console.log(`   📧 Found proposal acceptance notification: "${proposalNotification.message}"`);
            }
            
        } else {
            console.log('\n❌ ISSUE: No new notifications were created for admin');
            
            // Additional debugging info
            console.log('\n🔍 Debugging info:');
            console.log(`   Proposal ID: ${proposalId}`);
            console.log(`   Accept response:`, acceptResponse.data);
            console.log(`   Recent notifications count: ${recentNotifications.length}`);
            console.log(`   All recent notifications:`, recentNotifications.map(n => ({
                id: n.id,
                message: n.message,
                type: n.type,
                created_at: n.created_at
            })));
        }
        
    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        if (error.response) {
            console.error('   Response status:', error.response.status);
            console.error('   Response data:', error.response.data);
        }
        console.error('   Stack trace:', error.stack);
    }
}

console.log('📝 Calling testAdminNotifications function...');

// Run the test
testAdminNotifications()
    .then(() => {
        console.log('\n🏁 Test completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Unexpected error:', error);
        process.exit(1);
    });
