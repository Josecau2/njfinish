const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testManufacturerCreation() {
  try {
    const formData = new FormData();
    
    // Add form data
    formData.append('name', 'Test Manufacturer');
    formData.append('email', 'test@example.com');
    formData.append('phone', '123-456-7890');
    formData.append('address', '123 Test Street');
    formData.append('website', 'https://test.com');
    formData.append('isPriceMSRP', 'true');
    formData.append('costMultiplier', '1.5');
    formData.append('instructions', 'Test instructions');

    console.log('Sending request to create manufacturer...');
    
    const response = await axios.post('http://localhost:8080/api/manufacturers/create', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log('Response received:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error creating manufacturer:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data || error.message);
  }
}

testManufacturerCreation();
