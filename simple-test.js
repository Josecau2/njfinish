const axios = require('axios');

console.log('🔍 Simple test starting...');

async function simpleTest() {
    try {
        console.log('Testing login...');
        const response = await axios.post('http://localhost:8080/api/login', {
            email: 'joseca@symmetricalwolf.com',
            password: 'admin123'
        });
        console.log('Login success:', response.data);
    } catch (error) {
        console.error('Login failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

simpleTest().then(() => {
    console.log('Simple test completed');
}).catch(err => {
    console.error('Simple test error:', err);
});
