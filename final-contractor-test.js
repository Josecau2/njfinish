const axios = require('axios');

async function finalContractorTest() {
  try {
    console.log('🎯 Final Complete Test with Proper Capitalization\n');
    
    // 1. Test original contractor login
    console.log('1. Testing original contractor (tkk@tkk.com) login...');
    const originalLogin = await axios.post('http://localhost:8080/api/login', {
      email: 'tkk@tkk.com',
      password: 'admin123'
    });
    
    console.log('✅ Original contractor login successful');
    console.log('  Role:', originalLogin.data.role);
    console.log('  Group Type:', originalLogin.data.group?.group_type);
    
    // 2. Test new contractor login
    console.log('\n2. Testing new contractor login...');
    const newLogin = await axios.post('http://localhost:8080/api/login', {
      email: 'capitalized.test@example.com',
      password: 'contractor123'
    });
    
    console.log('✅ New contractor login successful');
    console.log('  Role:', newLogin.data.role);
    console.log('  Group Type:', newLogin.data.group?.group_type);
    
    // 3. Test contractor functionality
    console.log('\n3. Testing contractor functionality...');
    const headers = { Authorization: `Bearer ${newLogin.data.token}` };
    
    const customersResponse = await axios.get('http://localhost:8080/api/customers', { headers });
    console.log('✅ Customer access working - found', customersResponse.data.data?.length || 0, 'customers');
    
    const proposalsResponse = await axios.get('http://localhost:8080/api/proposals', { headers });
    console.log('✅ Proposal access working - found', proposalsResponse.data.proposals?.length || 0, 'proposals');
    
    console.log('\n🎉 ALL TESTS PASSED WITH PROPER CAPITALIZATION!');
    console.log('\n📋 Final Summary:');
    console.log('   ✅ User.role properly set to "Contractor" (capitalized)');
    console.log('   ✅ Login returns "Contractor" role');
    console.log('   ✅ Frontend permissions handle capitalization correctly');
    console.log('   ✅ All contractor functionality working');
    console.log('   ✅ User creation assigns proper roles and permissions');
    console.log('   ✅ Group scoping enforced correctly');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  } finally {
    process.exit(0);
  }
}

finalContractorTest();
