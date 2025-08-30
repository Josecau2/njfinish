const sequelize = require('./config/db');
const { ContactThread, ContactMessage, User } = require('./models');

async function checkThreadsInDB() {
  try {
    await sequelize.authenticate();
    console.log('🔄 Checking threads in database...\n');
    
    // Get all threads
    const threads = await ContactThread.findAll({
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'role'] },
        { model: ContactMessage, as: 'messages', attributes: ['id', 'body', 'is_admin'] }
      ]
    });
    
    console.log(`📋 Found ${threads.length} threads in database:`);
    
    threads.forEach((thread, i) => {
      console.log(`\n${i+1}. Thread ID: ${thread.id}`);
      console.log(`   Subject: "${thread.subject}"`);
      console.log(`   User ID: ${thread.user_id}`);
      console.log(`   Owner: ${thread.owner ? thread.owner.name : 'No owner found'}`);
      console.log(`   Status: ${thread.status}`);
      console.log(`   Messages: ${thread.messages ? thread.messages.length : 0}`);
      
      if (thread.messages && thread.messages.length > 0) {
        thread.messages.forEach((msg, j) => {
          console.log(`     ${j+1}. ${msg.is_admin ? 'Admin' : 'User'}: "${msg.body.substring(0, 50)}..."`);
        });
      }
    });
    
    // Test the same query that listThreads uses for contractor
    console.log('\n🔍 Testing contractor query (user_id: 46)...');
    const contractorThreads = await ContactThread.findAll({
      where: { user_id: 46 },
      include: [{ model: User, as: 'owner', attributes: ['id', 'name'] }]
    });
    console.log(`📋 Contractor query found ${contractorThreads.length} threads`);
    
    // Test the same query that listThreads uses for admin (no where clause)
    console.log('\n🔍 Testing admin query (no where clause)...');
    const adminThreads = await ContactThread.findAll({
      include: [{ model: User, as: 'owner', attributes: ['id', 'name'] }]
    });
    console.log(`📋 Admin query found ${adminThreads.length} threads`);
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkThreadsInDB();
