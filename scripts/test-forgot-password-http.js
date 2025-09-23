#!/usr/bin/env node
/**
 * Simple HTTP test for forgot password API endpoint
 * This script makes a direct HTTP request to test the forgot password functionality
 *
 * Usage:
 *   node scripts/test-forgot-password-http.js
 */

require('dotenv').config();
const axios = require('axios');

// Configuration
const TEST_EMAIL = 'fleitipon@icloud.com';
const API_BASE_URL = process.env.APP_URL || 'http://localhost:8080';

async function testForgotPasswordHTTP() {
  console.log('🔐 Testing Forgot Password HTTP Endpoint');
  console.log('==========================================');
  console.log(`Email: ${TEST_EMAIL}`);
  console.log(`API URL: ${API_BASE_URL}/api/forgot-password`);
  console.log('');

  try {
    console.log('📡 Making HTTP request...');

    const startTime = Date.now();
    const response = await axios.post(`${API_BASE_URL}/api/forgot-password`, {
      email: TEST_EMAIL
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000, // 15 second timeout
      validateStatus: function (status) {
        return status >= 200 && status < 500; // Accept 4xx responses too
      }
    });

    const duration = Date.now() - startTime;

    console.log(`✅ Success! (${duration}ms)`);
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);

    if (response.data.message) {
      console.log('');
      console.log('📧 Expected behavior:');
      console.log('- Reset token should be generated in database');
      console.log('- Email should be sent to fleitipon@icloud.com');
      console.log('- Check the email inbox for the reset link');
    }

    return response.data;

  } catch (error) {
    console.log('❌ Request failed:');

    if (error.code === 'ECONNREFUSED') {
      console.log(`Cannot connect to server at ${API_BASE_URL}`);
      console.log('Please ensure the backend server is running.');
      console.log('Try running: node index.js');
    } else if (error.code === 'ENOTFOUND') {
      console.log(`Cannot resolve hostname: ${API_BASE_URL}`);
      console.log('Please check the API_BASE_URL configuration.');
    } else if (error.response) {
      console.log(`HTTP Status: ${error.response.status}`);
      console.log(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.code === 'ETIMEDOUT') {
      console.log('Request timed out. Server may be slow to respond.');
    } else {
      console.log(`Error: ${error.message}`);
    }

    throw error;
  }
}

// Run the test
if (require.main === module) {
  testForgotPasswordHTTP()
    .then(() => {
      console.log('\n🎉 HTTP test completed successfully!');
      process.exit(0);
    })
    .catch(() => {
      console.log('\n💥 HTTP test failed!');
      process.exit(1);
    });
}

module.exports = { testForgotPasswordHTTP };