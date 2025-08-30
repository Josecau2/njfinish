const { ContactInfo } = require('./models');

async function testContactInfo() {
  try {
    console.log('Testing ContactInfo sync...');
    await ContactInfo.sync();
    console.log('ContactInfo sync successful');
    
    console.log('Testing ContactInfo.findOne...');
    const info = await ContactInfo.findOne({ order: [['updatedAt', 'DESC']] });
    console.log('ContactInfo.findOne result:', info ? 'found data' : 'no data');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testContactInfo();
