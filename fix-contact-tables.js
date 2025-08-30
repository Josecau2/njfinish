const { ContactThread, ContactMessage } = require('./models');

async function fixContactTables() {
  try {
    console.log('Ensuring ContactThread table...');
    await ContactThread.sync({ alter: true });
    console.log('ContactThread table ready');
    
    console.log('Ensuring ContactMessage table...');
    await ContactMessage.sync({ alter: true });
    console.log('ContactMessage table ready');
    
    console.log('Testing ContactThread.findAll...');
    const threads = await ContactThread.findAll({ limit: 1 });
    console.log('ContactThread.findAll result:', threads.length, 'threads');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixContactTables();
