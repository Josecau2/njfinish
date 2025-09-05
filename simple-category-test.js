#!/usr/bin/env node

/**
 * Simple Category API Test with Detailed Error Logging
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api/global-mods';

async function testAPI() {
  try {
    console.log('Testing category creation...');

    const response = await axios.post(`${BASE_URL}/categories`, {
      name: 'Test Category',
      scope: 'gallery'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Success:', response.data);
  } catch (error) {
    console.log('❌ Error details:');
    console.log('Status:', error.response?.status);
    console.log('Headers:', error.response?.headers);
    console.log('Data:', error.response?.data);
    console.log('Message:', error.message);
  }
}

testAPI();
