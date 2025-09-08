const axios = require('axios');

async function testWithFrontendHeaders() {
    console.log('Testing with frontend-like headers...');

    try {
        // First, login to get a token
        const loginResponse = await axios.post('http://localhost:8080/api/login', {
            email: 'joseca@symmetricalwolf.com',
            password: 'admin123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful, token length:', token.length);

        // Test with frontend-like headers (including all the headers a browser would send)
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Origin': 'http://localhost:5173',
            'Referer': 'http://localhost:5173/',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        };

        console.log('\nTesting /api/resources/links with browser-like headers...');
        const linksResponse = await axios.get('http://localhost:8080/api/resources/links', { headers });
        console.log('✅ Resources links successful:', linksResponse.status);

        console.log('\nTesting /api/resources/files with browser-like headers...');
        const filesResponse = await axios.get('http://localhost:8080/api/resources/files', { headers });
        console.log('✅ Resources files successful:', filesResponse.status);

        console.log('\nTesting /api/auth/ping with browser-like headers...');
        const pingResponse = await axios.get('http://localhost:8080/api/auth/ping', { headers });
        console.log('✅ Auth ping successful:', pingResponse.status);

    } catch (error) {
        console.error('❌ Test failed:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            headers: error.response?.headers
        });
    }
}

testWithFrontendHeaders();
