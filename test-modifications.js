const { Proposals } = require('./models');

(async () => {
  try {
    // Create a test proposal with modifications in the correct structure
    const testData = {
      customerId: 1,
      description: "Test with Modifications",
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
          modifications: 130.00, // LELCO modification
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

    console.log('🧪 Creating test proposal with modifications...');
    const proposal = await Proposals.create(testData);
    console.log(`✅ Created proposal ${proposal.id}`);

    // Now test accepting it
    console.log('🧪 Testing acceptance with modifications...');

  } catch (e) {
    console.error('❌ Error:', e);
  } finally {
    process.exit(0);
  }
})();
