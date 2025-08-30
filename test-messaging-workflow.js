const axios = require('axios');

async function testMessagingWorkflow() {
  try {
    console.log('🔄 Testing complete messaging workflow...\n');
    
    // Step 1: Login as contractor
    console.log('👤 Step 1: Login as contractor...');
    const contractorLogin = await axios.post('http://localhost:8080/api/login', {
      email: 'contractor@test.com',
      password: 'contractor123'
    });
    
    const contractorToken = contractorLogin.data.token;
    const contractorHeaders = { Authorization: `Bearer ${contractorToken}` };
    console.log('✅ Contractor login successful');
    console.log('📋 Contractor data:', {
      userId: contractorLogin.data.userId,
      name: contractorLogin.data.name,
      role: contractorLogin.data.role,
      role_id: contractorLogin.data.role_id
    });
    
    // Step 2: Contractor creates a thread
    console.log('\n📝 Step 2: Contractor creates a thread...');
    const threadRes = await axios.post('http://localhost:8080/api/contact/threads', {
      subject: 'Need help with cabinet order',
      message: 'Hi, I need assistance with processing a large cabinet order. Can someone help me?'
    }, { headers: contractorHeaders });
    
    const threadId = threadRes.data.data.threadId;
    console.log('✅ Thread created successfully, ID:', threadId);
    
    // Step 3: Contractor lists their threads
    console.log('\n📋 Step 3: Contractor lists their threads...');
    const contractorThreads = await axios.get('http://localhost:8080/api/contact/threads?page=1', { 
      headers: contractorHeaders 
    });
    console.log('✅ Contractor sees', contractorThreads.data.data.length, 'threads');
    contractorThreads.data.data.forEach((thread, i) => {
      console.log(`   ${i+1}. "${thread.subject}" (unread: ${thread.unreadCount})`);
    });
    
    // Step 4: Login as admin
    console.log('\n👑 Step 4: Login as admin...');
    const adminLogin = await axios.post('http://localhost:8080/api/login', {
      email: 'joseca@symmetricalwolf.com',
      password: 'admin123'
    });
    
    const adminToken = adminLogin.data.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    console.log('✅ Admin login successful');
    
    // Step 5: Admin lists all threads
    console.log('\n📋 Step 5: Admin lists all threads...');
    const adminThreads = await axios.get('http://localhost:8080/api/contact/threads?page=1', { 
      headers: adminHeaders 
    });
    console.log('✅ Admin sees', adminThreads.data.data.length, 'threads');
    adminThreads.data.data.forEach((thread, i) => {
      console.log(`   ${i+1}. "${thread.subject}" by ${thread.owner?.name || `user_id:${thread.user_id}`} (unread: ${thread.unreadCount})`);
    });
    
    // Step 6: Admin views the specific thread
    console.log('\n👁️ Step 6: Admin views the thread...');
    const threadView = await axios.get(`http://localhost:8080/api/contact/threads/${threadId}`, { 
      headers: adminHeaders 
    });
    console.log('✅ Admin can view thread');
    console.log('📋 Thread details:');
    console.log('   Subject:', threadView.data.data.subject);
    console.log('   Owner:', threadView.data.data.owner?.name || `user_id:${threadView.data.data.user_id}`);
    console.log('   Messages:', threadView.data.data.messages?.length || 0);
    
    if (threadView.data.data.messages) {
      threadView.data.data.messages.forEach((msg, i) => {
        console.log(`     ${i+1}. ${msg.is_admin ? 'Admin' : 'User'}: "${msg.body.substring(0, 50)}..."`);
      });
    }
    
    // Step 7: Admin replies to the thread
    console.log('\n💬 Step 7: Admin replies to the thread...');
    const replyRes = await axios.post(`http://localhost:8080/api/contact/threads/${threadId}/messages`, {
      body: 'Hello! I can definitely help you with your cabinet order. Let me get the details and assist you right away.'
    }, { headers: adminHeaders });
    console.log('✅ Admin reply sent successfully');
    
    // Step 8: Contractor checks for new messages
    console.log('\n📨 Step 8: Contractor checks for new messages...');
    const updatedContractorThreads = await axios.get('http://localhost:8080/api/contact/threads?page=1', { 
      headers: contractorHeaders 
    });
    console.log('✅ Contractor updated threads:');
    updatedContractorThreads.data.data.forEach((thread, i) => {
      console.log(`   ${i+1}. "${thread.subject}" (unread: ${thread.unreadCount})`);
    });
    
    // Step 9: Contractor views the conversation
    console.log('\n💬 Step 9: Contractor views the full conversation...');
    const contractorThreadView = await axios.get(`http://localhost:8080/api/contact/threads/${threadId}`, { 
      headers: contractorHeaders 
    });
    console.log('✅ Contractor can view full conversation');
    console.log('📋 Messages in conversation:', contractorThreadView.data.data.messages?.length || 0);
    
    if (contractorThreadView.data.data.messages) {
      contractorThreadView.data.data.messages.forEach((msg, i) => {
        console.log(`     ${i+1}. ${msg.is_admin ? 'Admin' : 'User'}: "${msg.body}"`);
      });
    }
    
    console.log('\n🎉 Messaging workflow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testMessagingWorkflow();
