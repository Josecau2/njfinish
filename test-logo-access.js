// Test script to check logo access
const axios = require('axios');

async function testLogoAccess() {
  try {
    // Test the API endpoint
    console.log('Testing PDF customization API...');
    const response = await axios.get('http://localhost:8080/api/settings/customization/pdf');
    console.log('API Response:', response.data);
    
    if (response.data.headerLogo) {
      const logoUrl = `http://localhost:8080${response.data.headerLogo}`;
      console.log('Testing logo URL:', logoUrl);
      
      try {
        const logoResponse = await axios.get(logoUrl);
        console.log('Logo accessible! Status:', logoResponse.status);
      } catch (logoError) {
        console.error('Logo not accessible:', logoError.message);
      }
    } else {
      console.log('No logo configured yet');
    }
  } catch (error) {
    console.error('API Error:', error.message);
  }
}

testLogoAccess();
