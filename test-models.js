console.log('Testing model imports...');

try {
  const { ContactInfo, ContactThread, ContactMessage, User } = require('./models');
  console.log('Models imported successfully');
  console.log('ContactInfo:', typeof ContactInfo);
  console.log('ContactThread:', typeof ContactThread);
  console.log('ContactMessage:', typeof ContactMessage);
  console.log('User:', typeof User);
} catch (error) {
  console.error('Error importing models:', error.message);
  console.error(error.stack);
}

console.log('Test completed');
