const { UserGroup } = require('./models');

async function testContractorModel() {
  try {
    console.log('Testing UserGroup model...');
    
    const contractors = await UserGroup.findAll({
      where: { group_type: 'contractor' },
      limit: 5
    });
    
    console.log(`Found ${contractors.length} contractor groups`);
    contractors.forEach(c => {
      console.log(`- ${c.name} (ID: ${c.id})`);
    });
    
    console.log('✅ Model test successful');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Model test failed:', error.message);
    process.exit(1);
  }
}

testContractorModel();
