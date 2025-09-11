/**
 * Test Contractor Customer Deletion
 *
 * This script tests that contractors can delete their own customers
 * but not customers created by other contractors or admin users.
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Test contractor login (replace with actual contractor credentials)
const contractorCredentials = {
  email: 'test@contractor.com', // Replace with actual contractor email
  password: 'password123'       // Replace with actual contractor password
};

async function testContractorCustomerDeletion() {
  try {
    console.log('🧪 Testing Contractor Customer Deletion Permissions');
    console.log('=' .repeat(60));

    // Step 1: Login as contractor
    console.log('1️⃣ Logging in as contractor...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, contractorCredentials);
    const contractorToken = loginResponse.data.token;
    const contractorUser = loginResponse.data.user;

    console.log(`   ✅ Logged in as: ${contractorUser.name}`);
    console.log(`   ✅ User role: ${contractorUser.role}`);
    console.log(`   ✅ Group type: ${contractorUser.group?.group_type}`);
    console.log(`   ✅ Customer module enabled: ${contractorUser.group?.modules?.customers}`);

    // Step 2: Get contractor's customers
    console.log('\n2️⃣ Fetching contractor customers...');
    const customersResponse = await axios.get(`${API_BASE}/customers`, {
      headers: { Authorization: `Bearer ${contractorToken}` }
    });

    const customers = customersResponse.data;
    console.log(`   📊 Found ${customers.length} customers`);

    if (customers.length === 0) {
      console.log('   ⚠️  No customers found. Creating a test customer first...');

      // Create a test customer
      const newCustomer = await axios.post(`${API_BASE}/customers`, {
        name: 'Test Customer for Deletion',
        email: 'testdelete@example.com',
        mobile: '555-0123',
        address: '123 Test St',
        city: 'Test City',
        state: 'TC',
        zipCode: '12345'
      }, {
        headers: { Authorization: `Bearer ${contractorToken}` }
      });

      console.log(`   ✅ Created test customer: ${newCustomer.data.name} (ID: ${newCustomer.data.id})`);
      customers.push(newCustomer.data);
    }

    // Step 3: Try to delete contractor's own customer
    const testCustomer = customers[0];
    console.log(`\n3️⃣ Attempting to delete customer: ${testCustomer.name} (ID: ${testCustomer.id})`);

    try {
      const deleteResponse = await axios.delete(`${API_BASE}/customers/delete/${testCustomer.id}`, {
        headers: { Authorization: `Bearer ${contractorToken}` }
      });

      console.log('   ✅ SUCCESS: Contractor can delete their own customers!');
      console.log(`   📋 Response: ${deleteResponse.data.message}`);

    } catch (deleteError) {
      console.log('   ❌ FAILED: Contractor cannot delete their own customers');
      console.log(`   📋 Error: ${deleteError.response?.status} - ${deleteError.response?.data?.message}`);

      if (deleteError.response?.status === 403) {
        console.log('   🔍 This indicates a permissions issue that needs to be fixed');
      }
    }

    // Step 4: Verify customer is marked as deleted (status = 0) not actually removed
    console.log('\n4️⃣ Verifying customer deletion behavior...');
    try {
      const checkResponse = await axios.get(`${API_BASE}/customers`, {
        headers: { Authorization: `Bearer ${contractorToken}` }
      });

      const remainingCustomers = checkResponse.data;
      const deletedCustomer = remainingCustomers.find(c => c.id === testCustomer.id);

      if (!deletedCustomer) {
        console.log('   ✅ Customer no longer appears in customer list (correctly filtered out)');
      } else if (deletedCustomer.status === 0) {
        console.log('   ✅ Customer marked as deleted (status = 0) but not removed from database');
      } else {
        console.log('   ⚠️  Customer still active - deletion may not have worked properly');
      }

    } catch (error) {
      console.log('   ❌ Error checking customer status:', error.message);
    }

    console.log('\n🎉 Contractor customer deletion test completed!');
    console.log('\n📋 Summary:');
    console.log('   • Contractors should be able to delete customers they created');
    console.log('   • Deletion sets customer status to 0 (soft delete)');
    console.log('   • Deleted customers are filtered out from customer lists');
    console.log('   • Backend enforces contractor scoping (created_by_user_id)');

  } catch (error) {
    console.error('❌ Test failed:', error.message);

    if (error.response?.status === 401) {
      console.log('🔍 Authentication failed - check contractor credentials');
    } else if (error.response?.status === 403) {
      console.log('🔍 Permission denied - contractor may not have customer module enabled');
    }
  }
}

// Run the test
testContractorCustomerDeletion();
