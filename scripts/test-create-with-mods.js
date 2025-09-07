const axios = require('axios');

async function testCreateProposalWithMods() {
  const base = process.env.BASE_URL || 'http://localhost:8080';
  const token = process.env.JWT || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJqb3NlY2FAc3ltbWV0cmljYWx3b2xmLmNvbSIsIm5hbWUiOiJKb3NlIEZsZWl0YXMiLCJyb2xlIjoiQWRtaW4iLCJyb2xlX2lkIjoyLCJncm91cF9pZCI6MSwiaWF0IjoxNzU3MjExMDUwLCJleHAiOjE3NTcyMzk4NTB9.kSWkd_GfsrSPGdGnrj7wgvLmwTxj0oiJSbcZD1hZyFc';

  console.log('🧪 Testing create proposal with modifications (action "0")');

  try {
    // Simulate the exact payload that would come from the Create form
    const proposalData = {
      action: "0", // This is the save action from CreateProposalForm
      formData: {
        customerName: "Test Customer With Mods",
        customerEmail: "testmods@example.com",
        description: "Test Save With Modifications",
        date: new Date().toISOString(),
        status: "",
        designer: 1,
        manufacturersData: [
          {
            manufacturer: 1,
            manufacturerName: "Jose Fleitas",
            selectedStyle: 1,
            styleName: "Modern",
            items: [
              {
                id: "TEST-1",
                name: "Test Cabinet",
                price: 100,
                quantity: 1,
                total: 100,
                modifications: [
                  { name: "Extra Shelf", price: 25, qty: 1 },
                  { name: "Soft Close", price: 15, qty: 2 }
                ]
              }
            ],
            customItems: [],
            summary: {
              cabinets: 100,
              assemblyFee: 0,
              modificationsCost: 55, // 25 + (15*2)
              total: 155,
              deliveryFee: 0,
              taxRate: 0,
              taxAmount: 0,
              grandTotal: 155
            }
          }
        ]
      }
    };

    console.log('📤 Sending request to create proposal...');
    const response = await axios.post(`${base}/api/create-proposals`, proposalData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const proposalId = response.data?.data?.id;
    console.log('✅ Response:', {
      status: response.status,
      success: response.data?.success,
      proposalId: proposalId
    });

    if (proposalId) {
      // Check what was actually saved
      console.log('🔍 Checking saved data...');
      const { Proposals } = require('./models');
      const saved = await Proposals.findByPk(proposalId);
      if (saved) {
        const md = typeof saved.manufacturersData === 'string' ? JSON.parse(saved.manufacturersData) : saved.manufacturersData;
        console.log('💾 Saved data:', {
          status: saved.status,
          summaryModsCost: md?.[0]?.summary?.modificationsCost,
          itemsCount: md?.[0]?.items?.length,
          firstItemMods: md?.[0]?.items?.[0]?.modifications?.length || 'none'
        });
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
  }
}

testCreateProposalWithMods().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
