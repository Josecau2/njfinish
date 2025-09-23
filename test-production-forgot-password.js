#!/usr/bin/env node
/**
 * Test production forgot password functionality
 */

require('dotenv').config();
const axios = require('axios');

const PRODUCTION_API = 'https://app.nj.contractors';
const TEST_EMAIL = 'joseca@symmetricalwolf.com'; // Use the email from the screenshot

async function testProductionForgotPassword() {
  console.log('🔐 Testing Production Forgot Password');
  console.log('====================================');
  console.log(`API URL: ${PRODUCTION_API}/api/forgot-password`);
  console.log(`Test Email: ${TEST_EMAIL}`);
  console.log('');

  try {
    console.log('📡 Making request to production API...');

    const response = await axios.post(`${PRODUCTION_API}/api/forgot-password`, {
      email: TEST_EMAIL
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ForgotPasswordTest/1.0'
      },
      timeout: 30000, // 30 second timeout for production
      validateStatus: function (status) {
        return status >= 200 && status < 500; // Accept 4xx responses too
      }
    });

    console.log(`✅ Response received (Status: ${response.status})`);
    console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);

    if (response.status === 200) {
      console.log('');
      console.log('🎯 Next Steps:');
      console.log('1. Check email inbox for reset link');
      console.log('2. Verify SMTP settings are working in production');
      console.log('3. Check backend server logs for any errors');
    }

    return true;

  } catch (error) {
    console.log('❌ Request failed:');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('Cannot connect to production server');
      console.log('The server might be down or unreachable');
    } else if (error.code === 'ENOTFOUND') {
      console.log('Cannot resolve hostname: app.nj.contractors');
      console.log('DNS or domain configuration issue');
    } else if (error.code === 'ECONNRESET') {
      console.log('Connection reset by server');
      console.log('Server might be overloaded or rejecting requests');
    } else if (error.response) {
      console.log(`HTTP Status: ${error.response.status}`);
      console.log(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.log(`Error: ${error.message}`);
    }

    return false;
  }
}

// Run the test
if (require.main === module) {
  testProductionForgotPassword()
    .then((success) => {
      if (success) {
        console.log('\n🎉 Production test completed!');
        console.log('If no email arrives, check backend SMTP configuration.');
      } else {
        console.log('\n💥 Production test failed!');
        console.log('Check server status and configuration.');
      }
    })
    .catch((error) => {
      console.error('Unexpected error:', error.message);
    });
}

module.exports = { testProductionForgotPassword };