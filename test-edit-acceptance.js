const axios = require('axios');

async function testEditAcceptance() {
    const BASE_URL = 'http://localhost:8080';

    try {
        // First, create a test proposal
        console.log('🧪 Creating test proposal...');
        const createResponse = await axios.post(`${BASE_URL}/api/proposals`, {
            customerId: 1,
            customer: { name: 'Test Customer' },
            description: 'TEST: Edit Acceptance Flow',
            manufacturersData: JSON.stringify([{
                manufacturer: 1,
                manufacturerName: 'Test Manufacturer',
                selectedStyle: 101,
                styleName: 'Test Style',
                items: [
                    { id: 1, name: 'Test Cabinet', price: 1000, quantity: 2, total: 2000 }
                ],
                summary: {
                    cabinets: 2000,
                    assemblyFee: 200,
                    modifications: 100,
                    styleTotal: 2300,
                    discountPercent: 10,
                    discountAmount: 230,
                    total: 2070,
                    deliveryFee: 150,
                    taxRate: 8.25,
                    tax: 170.78,
                    grandTotal: 2390.78
                }
            }])
        }, {
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBuamNhYmluZXRzLmNvbSIsIm5hbWUiOiJBZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTczNDcxNDY4NywiZXhwIjoxNzM0ODAxMDg3fQ.pD1IuofJ7FKi1vOKRZyDrb_lWOl5BnWbJp0oJuDHKGg'
            }
        });

        const proposalId = createResponse.data.id;
        console.log(`✅ Created test proposal: ${proposalId}`);

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Now test the edit acceptance flow (this should create an order)
        console.log(`🧪 Testing edit acceptance for proposal ${proposalId}...`);
        const acceptResponse = await axios.put(`${BASE_URL}/api/update-proposals`, {
            id: proposalId,
            action: 'accept'
        }, {
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBuamNhYmluZXRzLmNvbSIsIm5hbWUiOiJBZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTczNDcxNDY4NywiZXhwIjoxNzM0ODAxMDg3fQ.pD1IuofJ7FKi1vOKRZyDrb_lWOl5BnWbJp0oJuDHKGg'
            }
        });

        console.log(`✅ Acceptance response:`, acceptResponse.data);

        // Check if order was created
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`🔍 Checking if order was created for proposal ${proposalId}...`);

        // Check orders for this proposal
        const { spawn } = require('child_process');
        const checkOrder = spawn('node', ['debug-list-orders.js', '--proposal', proposalId], {
            stdio: ['ignore', 'pipe', 'pipe']
        });

        let orderOutput = '';
        checkOrder.stdout.on('data', (data) => {
            orderOutput += data.toString();
        });

        checkOrder.on('close', (code) => {
            console.log('📋 Order check result:');
            console.log(orderOutput);

            if (orderOutput.includes('Found orders:') && !orderOutput.includes('No orders found')) {
                console.log('🎉 SUCCESS: Order was created via edit acceptance flow!');
            } else {
                console.log('❌ FAILED: No order found for accepted proposal');
            }
        });

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testEditAcceptance();
