const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';
const CONTRACTOR_EMAIL = 'tkk@tkk.com';
const CONTRACTOR_PASSWORD = 'admin123';

// Test data
const testCustomer = {
  name: 'Test Customer for Contractor',
  email: 'contractor-customer@test.com',
  phone: '555-0123',
  address: '123 Test Street',
  city: 'Test City',
  state: 'TX',
  zipCode: '12345',
  notes: 'Customer created by contractor during testing'
};

const testProposal = {
  action: 'create',
  formData: {
    customer_id: null, // Will be set after customer creation
    customerId: null,  // Also try this field name
    title: 'Test Proposal by Contractor',
    description: 'This is a test proposal created by a contractor user',
    status: 'draft',
    date: new Date().toISOString(),
    notes: 'Created during contractor permission testing'
  }
};

async function testContractorOperations() {
  let token = null;
  let createdCustomer = null;
  let createdProposal = null;

  try {
    console.log('🔐 Testing Contractor Create Operations...\n');

    // Step 1: Login as contractor
    console.log('1️⃣ Logging in as contractor...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: CONTRACTOR_EMAIL,
      password: CONTRACTOR_PASSWORD
    });
    
    token = loginResponse.data.token;
    console.log('✅ Login successful!');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    
    const user = loginResponse.data.user || loginResponse.data;
    console.log(`   User: ${user?.name || user?.email || 'Unknown'}`);
    console.log(`   Email: ${user?.email || 'Unknown'}`);
    console.log(`   Group: ${user?.group?.name || user?.groupName || 'Unknown'}`);
    console.log(`   Group ID: ${user?.group_id || 'Unknown'}\n`);

    const headers = { Authorization: `Bearer ${token}` };

    // Step 2: Test customer creation
    console.log('2️⃣ Testing customer creation...');
    try {
      const customerResponse = await axios.post(`${BASE_URL}/customers/add`, testCustomer, { headers });
      createdCustomer = customerResponse.data;
      
      console.log('✅ Customer creation successful!');
      console.log(`   Customer ID: ${createdCustomer.id || createdCustomer.customer?.id}`);
      console.log(`   Customer Name: ${createdCustomer.name || createdCustomer.customer?.name}`);
      console.log(`   Customer Email: ${createdCustomer.email || createdCustomer.customer?.email}\n`);
      
      // Extract customer ID for proposal
      const customerId = createdCustomer.id || createdCustomer.customer?.id;
      testProposal.formData.customer_id = customerId;
      testProposal.formData.customerId = customerId;
    } catch (error) {
      console.log('❌ Customer creation failed:');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
      console.log(`   Details: ${JSON.stringify(error.response?.data, null, 2)}\n`);
    }

    // Step 3: Test proposal creation
    console.log('3️⃣ Testing proposal creation...');
    try {
      const proposalResponse = await axios.post(`${BASE_URL}/create-proposals`, testProposal, { headers });
      createdProposal = proposalResponse.data;
      
      console.log('✅ Proposal creation successful!');
      console.log(`   Proposal ID: ${createdProposal.id || createdProposal.proposal?.id}`);
      console.log(`   Proposal Title: ${createdProposal.title || createdProposal.proposal?.title}`);
      console.log(`   Customer ID: ${createdProposal.customer_id || createdProposal.proposal?.customer_id}\n`);
    } catch (error) {
      console.log('❌ Proposal creation failed:');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
      console.log(`   Details: ${JSON.stringify(error.response?.data, null, 2)}\n`);
    }

    // Step 4: Verify contractor can see their created data
    console.log('4️⃣ Verifying contractor can access their created data...');
    
    // Check customers list
    try {
      const customersResponse = await axios.get(`${BASE_URL}/customers`, { headers });
      const customers = customersResponse.data.customers || customersResponse.data;
      console.log(`✅ Can access customers list: Found ${customers.length} customers`);
      
      if (createdCustomer) {
        const foundCustomer = customers.find(c => c.id === (createdCustomer.id || createdCustomer.customer?.id));
        if (foundCustomer) {
          console.log(`   ✅ Created customer found in list: ${foundCustomer.name}`);
        } else {
          console.log(`   ⚠️ Created customer not found in list`);
        }
      }
    } catch (error) {
      console.log('❌ Cannot access customers list:');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
    }

    // Check proposals list
    try {
      const proposalsResponse = await axios.get(`${BASE_URL}/proposals`, { headers });
      const proposals = proposalsResponse.data.proposals || proposalsResponse.data;
      console.log(`✅ Can access proposals list: Found ${proposals.length} proposals`);
      
      if (createdProposal) {
        const foundProposal = proposals.find(p => p.id === (createdProposal.id || createdProposal.proposal?.id));
        if (foundProposal) {
          console.log(`   ✅ Created proposal found in list: ${foundProposal.title}`);
        } else {
          console.log(`   ⚠️ Created proposal not found in list`);
        }
      }
    } catch (error) {
      console.log('❌ Cannot access proposals list:');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n🧹 Cleanup (optional - delete test data)...');
    
    // Optional: Clean up created test data
    if (createdCustomer && (createdCustomer.id || createdCustomer.customer?.id)) {
      try {
        const customerId = createdCustomer.id || createdCustomer.customer?.id;
        await axios.delete(`${BASE_URL}/customers/delete/${customerId}`, { headers });
        console.log(`✅ Test customer deleted (ID: ${customerId})`);
      } catch (error) {
        console.log(`⚠️ Could not delete test customer: ${error.response?.data?.message || error.message}`);
      }
    }

    if (createdProposal && (createdProposal.id || createdProposal.proposal?.id)) {
      try {
        const proposalId = createdProposal.id || createdProposal.proposal?.id;
        await axios.delete(`${BASE_URL}/delete-proposals/${proposalId}`, { headers });
        console.log(`✅ Test proposal deleted (ID: ${proposalId})`);
      } catch (error) {
        console.log(`⚠️ Could not delete test proposal: ${error.response?.data?.message || error.message}`);
      }
    }

  } catch (error) {
    console.log('\n💥 Test failed with error:');
    console.log(`Error: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }

  console.log('\n📊 Test Summary:');
  console.log('================');
  console.log(`✅ Login: ${token ? 'SUCCESS' : 'FAILED'}`);
  console.log(`${createdCustomer ? '✅' : '❌'} Customer Creation: ${createdCustomer ? 'SUCCESS' : 'FAILED'}`);
  console.log(`${createdProposal ? '✅' : '❌'} Proposal Creation: ${createdProposal ? 'SUCCESS' : 'FAILED'}`);
  
  if (token && createdCustomer && createdProposal) {
    console.log('\n🎉 ALL TESTS PASSED! Contractor can create customers and proposals!');
  } else if (token) {
    console.log('\n⚠️ PARTIAL SUCCESS: Login works but creation operations may have issues');
  } else {
    console.log('\n❌ TESTS FAILED: Could not login as contractor');
  }
}

// Alternative test for just checking permissions without creating data
async function testContractorPermissionsOnly() {
  try {
    console.log('\n🔍 Testing Contractor Permissions (Read-Only)...\n');

    // Login
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: CONTRACTOR_EMAIL,
      password: CONTRACTOR_PASSWORD
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('✅ Login successful');
    const user = loginResponse.data.user || loginResponse.data;
    console.log(`   User: ${user?.name || user?.email || 'Unknown'}`);
    console.log(`   Group: ${user?.group?.name || user?.groupName || 'Unknown'}`);
    console.log(`   Modules: ${JSON.stringify(user?.group?.modules || user?.modules || 'None')}\n`);

    // Test endpoint access
    const endpoints = [
      { name: 'Customers', url: '/customers', method: 'GET' },
      { name: 'Proposals', url: '/proposals', method: 'GET' },
      { name: 'Users', url: '/users', method: 'GET' },
      { name: 'Resources', url: '/resources', method: 'GET' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${BASE_URL}${endpoint.url}`, { headers });
        console.log(`✅ ${endpoint.name}: Can access (${response.status})`);
      } catch (error) {
        console.log(`❌ ${endpoint.name}: Access denied (${error.response?.status})`);
      }
    }

  } catch (error) {
    console.log(`❌ Permission test failed: ${error.message}`);
  }
}

// Run tests
if (require.main === module) {
  console.log('🚀 Starting Contractor Creation Tests...\n');
  console.log('This will test if the contractor user can:');
  console.log('1. Login successfully');
  console.log('2. Create customers');
  console.log('3. Create proposals');
  console.log('4. Access their created data\n');
  
  testContractorOperations()
    .then(() => {
      console.log('\n📋 Also running permission-only test...');
      return testContractorPermissionsOnly();
    })
    .then(() => {
      console.log('\n✨ All tests completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Test suite failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testContractorOperations, testContractorPermissionsOnly };
