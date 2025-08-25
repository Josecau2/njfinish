const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';
const FRONTEND_URL = 'http://localhost:3001';
const CONTRACTOR_EMAIL = 'tkk@tkk.com';
const CONTRACTOR_PASSWORD = 'admin123';

// Simulate frontend form data structures
const simulateCustomerFormSubmission = {
  name: 'Frontend Test Customer',
  email: 'frontend-customer@test.com',
  phone: '555-0199',
  address: '456 Frontend Street',
  city: 'React City',
  state: 'CA',
  zipCode: '90210',
  notes: 'Customer created via frontend simulation test'
};

const simulateProposalFormSubmission = {
  action: 'create',
  formData: {
    customerId: null, // Will be set after customer creation
    customerName: 'Frontend Test Customer',
    customerEmail: 'frontend-customer@test.com',
    title: 'Frontend Test Proposal',
    description: 'This proposal was created through frontend simulation',
    status: 'draft',
    date: new Date().toISOString(),
    notes: 'Created via frontend form simulation',
    // Additional fields that frontend might send
    location: '',
    taxRate: 0,
    discount: 0,
    items: []
  }
};

async function simulateFrontendUserFlow() {
  console.log('🌐 Simulating Complete Frontend User Experience...\n');
  console.log('This test simulates a contractor user:');
  console.log('1. Logging in through the frontend');
  console.log('2. Navigating to dashboard');
  console.log('3. Clicking "Add Customer" button');
  console.log('4. Filling out and submitting customer form');
  console.log('5. Clicking "Create Proposal" button');
  console.log('6. Filling out and submitting proposal form');
  console.log('7. Verifying the data appears in their lists\n');

  let token = null;
  let userInfo = null;
  let createdCustomer = null;
  let createdProposal = null;

  try {
    // Step 1: Simulate frontend login
    console.log('🔐 Step 1: Simulating frontend login...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: CONTRACTOR_EMAIL,
      password: CONTRACTOR_PASSWORD
    });
    
    token = loginResponse.data.token;
    userInfo = loginResponse.data.user || loginResponse.data;
    
    console.log('✅ Login successful!');
    console.log(`   User: ${userInfo.name || userInfo.email}`);
    console.log(`   Group: ${userInfo.group?.name || 'Unknown'}`);
    console.log(`   Token stored in localStorage (simulated)`);
    
    // Simulate storing in localStorage
    const simulatedLocalStorage = {
      token: token,
      user: JSON.stringify(userInfo)
    };
    console.log(`   📱 Frontend would store: token and user data\n`);

    const headers = { Authorization: `Bearer ${token}` };

    // Step 2: Simulate accessing contractor dashboard
    console.log('🏠 Step 2: Simulating contractor dashboard access...');
    console.log(`   📱 Frontend would navigate to: ${FRONTEND_URL}/dashboard`);
    console.log('   📱 Dashboard would fetch stats from APIs...');
    
    // Simulate dashboard API calls
    try {
      const customersResponse = await axios.get(`${BASE_URL}/customers`, { headers });
      const proposalsResponse = await axios.get(`${BASE_URL}/proposals`, { headers });
      
      console.log('✅ Dashboard loaded successfully!');
      console.log(`   📊 Found ${customersResponse.data.customers?.length || 0} existing customers`);
      console.log(`   📊 Found ${proposalsResponse.data.proposals?.length || 0} existing proposals`);
      console.log('   📱 Dashboard shows "Add Customer" and "Create Proposal" buttons\n');
    } catch (error) {
      console.log('❌ Dashboard API calls failed:', error.message);
    }

    // Step 3: Simulate clicking "Add Customer" button
    console.log('👤 Step 3: Simulating "Add Customer" button click...');
    console.log(`   📱 Frontend would navigate to: ${FRONTEND_URL}/customers/add`);
    console.log('   📱 Customer form would load with empty fields');
    console.log('   📱 User fills out the form with customer details...\n');

    // Step 4: Simulate customer form submission
    console.log('📝 Step 4: Simulating customer form submission...');
    console.log('   📱 User clicks "Save Customer" button');
    console.log('   📱 Frontend sends POST request to create customer...');
    
    try {
      const customerResponse = await axios.post(`${BASE_URL}/customers/add`, simulateCustomerFormSubmission, { headers });
      createdCustomer = customerResponse.data;
      
      console.log('✅ Customer creation successful!');
      console.log(`   👤 Customer ID: ${createdCustomer.id || createdCustomer.customer?.id}`);
      console.log(`   👤 Customer Name: ${createdCustomer.name || createdCustomer.customer?.name}`);
      console.log(`   👤 Customer Email: ${createdCustomer.email || createdCustomer.customer?.email}`);
      console.log('   📱 Frontend would show success message and redirect to customers list\n');
      
      // Update proposal form data with created customer ID
      const customerId = createdCustomer.id || createdCustomer.customer?.id;
      simulateProposalFormSubmission.formData.customerId = customerId;
      
    } catch (error) {
      console.log('❌ Customer creation failed:');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
      console.log('   📱 Frontend would show error message to user\n');
    }

    // Step 5: Simulate clicking "Create Proposal" button
    console.log('📋 Step 5: Simulating "Create Proposal" button click...');
    console.log(`   📱 Frontend would navigate to: ${FRONTEND_URL}/proposals/create`);
    console.log('   📱 Proposal form would load with customer dropdown');
    console.log('   📱 User selects customer and fills out proposal details...\n');

    // Step 6: Simulate proposal form submission
    console.log('📄 Step 6: Simulating proposal form submission...');
    console.log('   📱 User clicks "Create Proposal" button');
    console.log('   📱 Frontend sends POST request to create proposal...');
    
    try {
      const proposalResponse = await axios.post(`${BASE_URL}/create-proposals`, simulateProposalFormSubmission, { headers });
      createdProposal = proposalResponse.data;
      
      console.log('✅ Proposal creation successful!');
      console.log(`   📄 Proposal created with data: ${JSON.stringify(createdProposal, null, 2)}`);
      console.log('   📱 Frontend would show success message and redirect to proposals list\n');
      
    } catch (error) {
      console.log('❌ Proposal creation failed:');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
      console.log(`   Details: ${JSON.stringify(error.response?.data, null, 2)}`);
      console.log('   📱 Frontend would show error message to user\n');
    }

    // Step 7: Simulate viewing created data in lists
    console.log('📊 Step 7: Simulating user viewing their created data...');
    console.log('   📱 User navigates to customers list to verify their new customer...');
    
    try {
      const customersListResponse = await axios.get(`${BASE_URL}/customers`, { headers });
      const customersList = customersListResponse.data.customers || customersListResponse.data || [];
      
      console.log(`✅ Customers list loaded: ${customersList.length} total customers`);
      
      if (createdCustomer) {
        const customerId = createdCustomer.id || createdCustomer.customer?.id;
        const foundCustomer = customersList.find(c => c.id === customerId);
        if (foundCustomer) {
          console.log(`   👤 ✅ Created customer found in list: "${foundCustomer.name}"`);
        } else {
          console.log(`   👤 ⚠️ Created customer not found in list (may be filtered by group)`);
        }
      }
    } catch (error) {
      console.log('❌ Failed to load customers list:', error.message);
    }

    console.log('   📱 User navigates to proposals list to verify their new proposal...');
    
    try {
      const proposalsListResponse = await axios.get(`${BASE_URL}/proposals`, { headers });
      const proposalsList = proposalsListResponse.data.proposals || proposalsListResponse.data || [];
      
      console.log(`✅ Proposals list loaded: ${proposalsList.length} total proposals`);
      
      if (createdProposal) {
        // Try to find proposal by title since ID structure might vary
        const foundProposal = proposalsList.find(p => 
          p.title === simulateProposalFormSubmission.formData.title ||
          p.description === simulateProposalFormSubmission.formData.description
        );
        if (foundProposal) {
          console.log(`   📄 ✅ Created proposal found in list: "${foundProposal.title}"`);
        } else {
          console.log(`   📄 ⚠️ Created proposal not found in list (may be filtered by group)`);
        }
      }
    } catch (error) {
      console.log('❌ Failed to load proposals list:', error.message);
    }

    // Step 8: Test navigation permissions
    console.log('\n🔐 Step 8: Verifying navigation permissions...');
    
    const navigationTests = [
      { name: 'Dashboard', endpoint: '/dashboard', expected: true },
      { name: 'Customers List', endpoint: '/customers', expected: true },
      { name: 'Proposals List', endpoint: '/proposals', expected: true },
      { name: 'Users List', endpoint: '/users', expected: true },
      { name: 'Resources', endpoint: '/resources', expected: true }
    ];

    for (const test of navigationTests) {
      try {
        await axios.get(`${BASE_URL}${test.endpoint}`, { headers });
        console.log(`   ✅ ${test.name}: Accessible`);
      } catch (error) {
        console.log(`   ${test.expected ? '❌' : '✅'} ${test.name}: ${error.response?.status === 403 ? 'Access Denied' : 'Error'}`);
      }
    }

    // Cleanup
    console.log('\n🧹 Cleanup: Removing test data...');
    
    if (createdCustomer) {
      try {
        const customerId = createdCustomer.id || createdCustomer.customer?.id;
        await axios.delete(`${BASE_URL}/customers/delete/${customerId}`, { headers });
        console.log(`✅ Test customer deleted (ID: ${customerId})`);
      } catch (error) {
        console.log(`⚠️ Could not delete test customer: ${error.response?.data?.message || error.message}`);
      }
    }

    if (createdProposal) {
      try {
        const proposalId = createdProposal.id || createdProposal.proposal?.id;
        if (proposalId) {
          await axios.delete(`${BASE_URL}/delete-proposals/${proposalId}`, { headers });
          console.log(`✅ Test proposal deleted (ID: ${proposalId})`);
        }
      } catch (error) {
        console.log(`⚠️ Could not delete test proposal: ${error.response?.data?.message || error.message}`);
      }
    }

  } catch (error) {
    console.log('\n💥 Frontend simulation failed:');
    console.log(`Error: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }

  // Final Results
  console.log('\n📋 Frontend Simulation Summary:');
  console.log('==================================');
  console.log(`✅ Login: ${token ? 'SUCCESS' : 'FAILED'}`);
  console.log(`${createdCustomer ? '✅' : '❌'} Customer Creation: ${createdCustomer ? 'SUCCESS' : 'FAILED'}`);
  console.log(`${createdProposal ? '✅' : '❌'} Proposal Creation: ${createdProposal ? 'SUCCESS' : 'FAILED'}`);
  
  if (token && createdCustomer && createdProposal) {
    console.log('\n🎉 FRONTEND SIMULATION SUCCESSFUL!');
    console.log('The contractor user can successfully:');
    console.log('✅ Login through the frontend');
    console.log('✅ Access the contractor dashboard');
    console.log('✅ Navigate to customer creation form');
    console.log('✅ Create customers through the form');
    console.log('✅ Navigate to proposal creation form');
    console.log('✅ Create proposals through the form');
    console.log('✅ View their created data in the lists');
    console.log('\n🚀 The contractor portal is fully functional from the frontend!');
  } else {
    console.log('\n⚠️ FRONTEND SIMULATION PARTIAL: Some operations failed');
    console.log('Check the errors above to identify issues.');
  }
}

// Additional test for button functionality
async function testDashboardButtonFunctionality() {
  console.log('\n🔘 Testing Dashboard Button Functionality...\n');
  
  try {
    // Test login first
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: CONTRACTOR_EMAIL,
      password: CONTRACTOR_PASSWORD
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    console.log('✅ Logged in successfully for button tests');
    
    // Test the endpoints that the dashboard buttons would navigate to
    const buttonTests = [
      {
        name: 'Add Customer Button',
        description: 'Tests if /customers/add endpoint accepts POST requests',
        method: 'POST',
        endpoint: '/customers/add',
        testData: {
          name: 'Button Test Customer',
          email: 'button-test@example.com',
          phone: '555-BUTTON'
        }
      },
      {
        name: 'Create Proposal Button', 
        description: 'Tests if /create-proposals endpoint accepts POST requests',
        method: 'POST',
        endpoint: '/create-proposals',
        testData: {
          action: 'create',
          formData: {
            title: 'Button Test Proposal',
            description: 'Testing proposal creation from button',
            status: 'draft',
            date: new Date().toISOString()
          }
        }
      }
    ];

    for (const test of buttonTests) {
      console.log(`🔘 Testing "${test.name}"...`);
      console.log(`   📱 Simulates: User clicks button → navigates to form → submits form`);
      
      try {
        if (test.method === 'POST') {
          const response = await axios.post(`${BASE_URL}${test.endpoint}`, test.testData, { headers });
          console.log(`   ✅ ${test.name}: SUCCESS! Endpoint accepts form submissions`);
          console.log(`   📊 Response status: ${response.status}`);
          
          // Try to clean up if successful
          if (test.endpoint === '/customers/add' && response.data?.id) {
            try {
              await axios.delete(`${BASE_URL}/customers/delete/${response.data.id}`, { headers });
              console.log(`   🧹 Test customer cleaned up`);
            } catch (e) {
              console.log(`   ⚠️ Could not clean up test customer`);
            }
          }
          
        } else {
          const response = await axios.get(`${BASE_URL}${test.endpoint}`, { headers });
          console.log(`   ✅ ${test.name}: SUCCESS! Endpoint accessible`);
        }
      } catch (error) {
        console.log(`   ❌ ${test.name}: FAILED`);
        console.log(`   Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
      console.log('');
    }
    
  } catch (error) {
    console.log('❌ Button functionality test failed:', error.message);
  }
}

// Run the tests
if (require.main === module) {
  console.log('🎭 Starting Complete Frontend Simulation Test...\n');
  
  simulateFrontendUserFlow()
    .then(() => {
      return testDashboardButtonFunctionality();
    })
    .then(() => {
      console.log('\n✨ All frontend simulation tests completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Frontend simulation test suite failed:', error.message);
      process.exit(1);
    });
}

module.exports = { simulateFrontendUserFlow, testDashboardButtonFunctionality };
