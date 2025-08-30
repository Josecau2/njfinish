const FormData = require('form-data');
const axios = require('axios');

async function testHTTPUpdate() {
    console.log('Testing HTTP update...');
    
    try {
        // Create FormData to mimic the frontend
        const formData = new FormData();
        
        // Add the same data as the frontend would
        formData.append('name', 'Jose Fleitas');
        formData.append('email', 'jose@test.com');
        formData.append('phone', '555-1234');
        formData.append('address', 'Test Address');
        formData.append('website', 'https://test.com');
        formData.append('isPriceMSRP', 'true');
        formData.append('costMultiplier', '1.5');
        formData.append('instructions', 'Test instructions');
        formData.append('assembledEtaDays', '7-14 days');
        formData.append('unassembledEtaDays', '3-4 days');
        
        console.log('Sending HTTP request with ETA data:');
        console.log('  assembledEtaDays: "7-14 days"');
        console.log('  unassembledEtaDays: "3-4 days"');
        
        // Make the HTTP request to our API
        const response = await axios.put(`http://localhost:8080/api/manufacturers/1/update`, formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': 'Bearer your-token-here' // You might need to adjust this
            }
        });
        
        console.log('HTTP Response:', response.data);
        
    } catch (error) {
        console.error('HTTP Error:', error.response?.data || error.message);
    }
}

testHTTPUpdate();
