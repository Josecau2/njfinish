const axios = require('axios');

async function quickTest() {
    try {
        console.log('Testing login...');
        const response = await axios.post('http://localhost:8080/api/login', {
            email: 'contractor1@example.com',
            password: 'ContractorPass1!'
        });
        console.log('Login success:', response.data.name);
        
        // Now test a simple proposal update
        const token = response.data.token;
        const testPayload = {
            action: 'accept',
            formData: {
                id: 68, // Use a known proposal ID
                status: 'Proposal accepted'
            }
        };
        
        console.log('Testing status transition...');
        const updateResponse = await axios.post('http://localhost:8080/api/update-proposals', testPayload, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Update success:', updateResponse.data.success);
        
    } catch (error) {
        console.error('Error:', error.response?.status, error.response?.data || error.message);
    }
}

quickTest();
