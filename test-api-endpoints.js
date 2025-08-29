const fetch = require('node-fetch');

async function testAPIEndpoints() {
    const baseUrl = 'http://localhost:8080/api';
    
    // You'll need to replace this with a real token from your application
    const token = 'your-auth-token-here'; 
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    console.log('Testing API endpoints...\n');

    try {
        // Test 1: Test bulk edit endpoint
        console.log('1. Testing bulk edit endpoint...');
        const bulkEditResponse = await fetch(`${baseUrl}/manufacturers/catalog/bulk-edit`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                itemIds: [6628, 6629], // Use some IDs from our test
                updates: {
                    style: 'API_TEST_STYLE',
                    description: 'Updated via API test'
                }
            })
        });

        if (bulkEditResponse.ok) {
            const result = await bulkEditResponse.json();
            console.log('   ✓ Bulk edit response:', result);
        } else {
            console.log('   ✗ Bulk edit failed:', bulkEditResponse.status, await bulkEditResponse.text());
        }

        // Test 2: Test style name edit endpoint  
        console.log('\n2. Testing style name edit endpoint...');
        const styleEditResponse = await fetch(`${baseUrl}/manufacturers/1/style-name`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                oldStyleName: 'API_TEST_STYLE',
                newStyleName: 'RENAMED_API_STYLE'
            })
        });

        if (styleEditResponse.ok) {
            const result = await styleEditResponse.json();
            console.log('   ✓ Style name edit response:', result);
        } else {
            console.log('   ✗ Style name edit failed:', styleEditResponse.status, await styleEditResponse.text());
        }

    } catch (error) {
        console.error('API test error:', error);
    }
}

// Note: This will fail without proper authentication
// It's just to show the endpoint structure
testAPIEndpoints();
