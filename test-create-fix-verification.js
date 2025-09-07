// Test Create Proposal with Modifications - Updated Frontend Fix
const axios = require('axios');

const createTestProposalWithMods = async () => {
    try {
        const response = await axios.post('http://localhost:8001/api/create-proposals', {
            action: "0", // Save action
            proposalData: {
                name: "Test Fix Create with Mods " + Date.now(),
                description: "Testing frontend fix for modifications in Create flow",
                type: "estimate",
                customerData: {
                    company: "Test Company",
                    firstName: "John",
                    lastName: "Doe",
                    email: "test@example.com",
                    phone: "555-1234"
                },
                manufacturersData: [
                    {
                        versionName: "V1",
                        manufacturerName: "Test Manufacturer",
                        manufacturerId: 1,
                        selectedStyle: "Test Style",
                        items: [
                            {
                                id: 1,
                                itemName: "Base Cabinet",
                                qty: 2,
                                unitPrice: 100.00,
                                totalPrice: 200.00,
                                selectVersion: "V1",
                                modifications: [
                                    {
                                        type: "existing",
                                        modificationId: 1,
                                        qty: 1,
                                        price: 25.00,
                                        description: "Test Mod 1",
                                        taxable: true
                                    },
                                    {
                                        type: "custom",
                                        price: 15.50,
                                        description: "Custom Test Mod",
                                        taxable: false,
                                        qty: 1
                                    }
                                ]
                            },
                            {
                                id: 2,
                                itemName: "Wall Cabinet",
                                qty: 1,
                                unitPrice: 150.00,
                                totalPrice: 150.00,
                                selectVersion: "V1",
                                modifications: [
                                    {
                                        type: "existing",
                                        modificationId: 2,
                                        qty: 2,
                                        price: 10.00,
                                        description: "Test Mod 2",
                                        taxable: true
                                    }
                                ]
                            }
                        ],
                        customItems: [],
                        summary: {
                            cabinets: "350.00",
                            assemblyFee: "0.00",
                            modificationsCost: "60.50",
                            deliveryFee: "0.00",
                            styleTotal: "410.50",
                            discountPercent: 0,
                            discountAmount: "0.00",
                            total: "410.50",
                            taxRate: 8.5,
                            taxAmount: "31.79",
                            grandTotal: "442.29"
                        }
                    }
                ]
            }
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('SUCCESS! Proposal created with ID:', response.data.proposalId);

        // Now verify the modifications were saved
        const checkResponse = await axios.get(`http://localhost:8001/api/proposals/${response.data.proposalId}`);
        const proposal = checkResponse.data;

        console.log('\n=== VERIFICATION ===');
        console.log('Proposal ID:', proposal.id);

        if (proposal.manufacturersData && proposal.manufacturersData.length > 0) {
            const manufacturer = proposal.manufacturersData[0];
            console.log('Items count:', manufacturer.items?.length || 0);

            if (manufacturer.items) {
                manufacturer.items.forEach((item, index) => {
                    console.log(`Item ${index + 1}: ${item.itemName}`);
                    console.log(`  Modifications count: ${item.modifications?.length || 0}`);
                    if (item.modifications && item.modifications.length > 0) {
                        item.modifications.forEach((mod, modIndex) => {
                            console.log(`    Mod ${modIndex + 1}: ${mod.description} - $${mod.price} (qty: ${mod.qty})`);
                        });
                    } else {
                        console.log('    ❌ NO MODIFICATIONS FOUND');
                    }
                });

                // Calculate expected vs actual totals
                const expectedModsCost = 25.00 + 15.50 + (10.00 * 2); // 60.50
                const actualModsCost = parseFloat(manufacturer.summary?.modificationsCost || 0);

                console.log(`\nExpected modifications cost: $${expectedModsCost}`);
                console.log(`Actual modifications cost: $${actualModsCost}`);

                if (Math.abs(expectedModsCost - actualModsCost) < 0.01) {
                    console.log('✅ MODIFICATIONS COST MATCHES!');
                } else {
                    console.log('❌ MODIFICATIONS COST MISMATCH!');
                }
            }
        } else {
            console.log('❌ NO MANUFACTURERS DATA FOUND');
        }

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
};

createTestProposalWithMods();
