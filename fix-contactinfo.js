const { ContactInfo } = require('./models');

async function fixContactInfo() {
  try {
    console.log('Altering ContactInfo table to add missing columns...');
    await ContactInfo.sync({ alter: true });
    console.log('ContactInfo table altered successfully');
    
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

fixContactInfo();
