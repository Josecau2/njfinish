const { Proposals } = require('./models');

(async () => {
  try {
    // Create a test proposal with the CORRECT modification structure
    const testData = {
      customerId: 1,
      description: "Test with CORRECT Modifications Structure",
      status: "draft",
      manufacturersData: JSON.stringify([{
        manufacturer: 1,
        manufacturerName: "Jose Fleitas",
        selectedStyle: 6930,
        styleName: "Test Style",
        items: [{
          id: 1,
          code: "B12",
          name: "12\" Base Cabinet",
          description: "12\" Base Cabinet",
          price: 171.00,
          quantity: 1,
          assemblyFee: 100.00,
          modifications: [{ // This should be an array of modification objects
            description: "LELCO Upgrade",
            cost: "130.00"
          }],
          total: 401.00, // price + assembly + modifications
          taxable: true,
          category: "Base Cabinet"
        }],
        customItems: [],
        summary: {
          cabinets: "171.00",
          assemblyFee: "100.00",
          modificationsCost: "130.00", // Total modifications
          deliveryFee: "200.00",
          styleTotal: "401.00", // cabinets + assembly + modifications
          discountPercent: 0,
          discountAmount: "0.00",
          total: "401.00",
          taxRate: 6.67,
          taxAmount: "26.73",
          grandTotal: "627.73"
        }
      }]),
      owner_group_id: 1,
      created_by_user_id: 1,
      date: new Date()
    };

    console.log('🧪 Creating test proposal with CORRECT modifications structure...');
    const proposal = await Proposals.create(testData);
    console.log(`✅ Created proposal ${proposal.id}`);

    // Test the parsing immediately
    console.log('🔍 Testing double-encoded JSON parsing...');
    let raw = proposal.manufacturersData;
    if (typeof raw === 'string') {
        raw = JSON.parse(raw);
        // Handle double-encoded JSON
        if (typeof raw === 'string') {
            raw = JSON.parse(raw);
        }
    }

    console.log('Summary modificationsCost:', raw[0]?.summary?.modificationsCost);
    console.log('Item modifications:', raw[0]?.items[0]?.modifications);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
