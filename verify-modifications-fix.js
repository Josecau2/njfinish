require('dotenv').config();
const { Proposals, Orders } = require('./models');
const axios = require('axios');

async function testModificationCapture() {
    try {
        console.log('🧪 Testing modification capture in order snapshots...\n');

        // Find the test proposal we created
        const proposal = await Proposals.findOne({
            where: { id: 213 },
            order: [['id', 'DESC']]
        });

        if (!proposal) {
            console.log('❌ Test proposal 213 not found');
            return;
        }

        console.log('📋 Found test proposal:', proposal.id);

        // Parse manufacturersData to check modifications
        let manufacturersData;
        try {
            let raw = proposal.manufacturersData;
            if (typeof raw === 'string') {
                raw = JSON.parse(raw);
                // Handle double-encoded JSON
                if (typeof raw === 'string') {
                    raw = JSON.parse(raw);
                }
            }
            manufacturersData = raw;
        } catch (error) {
            console.log('❌ Failed to parse manufacturersData:', error.message);
            return;
        }

        console.log('🔍 Checking proposal data structure...');

        // Check for modifications in the structure
        if (Array.isArray(manufacturersData) && manufacturersData[0] && manufacturersData[0].summary) {
            console.log('Summary modificationsCost:', manufacturersData[0].summary.modificationsCost);
        } else {
            console.log('Summary modificationsCost: undefined (no summary in array structure)');
        }

        // Check for modifications in items
        let foundModifications = [];
        if (Array.isArray(manufacturersData)) {
            manufacturersData.forEach((manufacturer, mIndex) => {
                if (manufacturer.items && Array.isArray(manufacturer.items)) {
                    manufacturer.items.forEach((item, iIndex) => {
                        if (item.modifications && Array.isArray(item.modifications) && item.modifications.length > 0) {
                            foundModifications.push({
                                manufacturer: manufacturer.manufacturerName,
                                item: item.sku || `Item ${iIndex}`,
                                modifications: item.modifications
                            });
                        }
                    });
                }
            });
        }

        console.log('🔍 Found modifications in proposal:');
        if (foundModifications.length > 0) {
            foundModifications.forEach(mod => {
                console.log(`  ✅ ${mod.manufacturer} - ${mod.item}:`);
                mod.modifications.forEach(m => {
                    console.log(`    - ${m.description}: $${m.cost}`);
                });
            });
        } else {
            console.log('  ❌ No modifications found in proposal data');
        }

        // Now test acceptance via direct API call
        console.log('\n🚀 Testing direct acceptance...');

        try {
            const response = await axios.post(`http://localhost:5000/api/quotes/${proposal.id}/accept`, {
                proposalId: proposal.id
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                console.log('✅ Direct acceptance successful, Order ID:', response.data.orderId);

                // Check the created order for modifications
                const order = await Orders.findByPk(response.data.orderId);
                if (order) {
                    console.log('\n🔍 Checking order snapshot for modifications...');

                    let orderSnapshot;
                    try {
                        orderSnapshot = typeof order.snapshot === 'string' ? JSON.parse(order.snapshot) : order.snapshot;
                    } catch (error) {
                        console.log('❌ Failed to parse order snapshot:', error.message);
                        return;
                    }

                    // Check for modifications in the order snapshot
                    if (Array.isArray(orderSnapshot.manufacturersData) && orderSnapshot.manufacturersData[0] && orderSnapshot.manufacturersData[0].summary) {
                        console.log('Summary modificationsCost in order:', orderSnapshot.manufacturersData[0].summary.modificationsCost);
                    } else {
                        console.log('Summary modificationsCost in order: undefined (no summary structure)');
                    }

                    // Check for modifications in order snapshot
                    let orderModifications = [];
                    if (Array.isArray(orderSnapshot.manufacturersData)) {
                        orderSnapshot.manufacturersData.forEach((manufacturer, mIndex) => {
                            if (manufacturer.items && Array.isArray(manufacturer.items)) {
                                manufacturer.items.forEach((item, iIndex) => {
                                    if (item.modifications && Array.isArray(item.modifications) && item.modifications.length > 0) {
                                        orderModifications.push({
                                            manufacturer: manufacturer.manufacturerName,
                                            item: item.sku || `Item ${iIndex}`,
                                            modifications: item.modifications
                                        });
                                    }
                                });
                            }
                        });
                    }

                    console.log('🔍 Found modifications in order snapshot:');
                    if (orderModifications.length > 0) {
                        orderModifications.forEach(mod => {
                            console.log(`  ✅ ${mod.manufacturer} - ${mod.item}:`);
                            mod.modifications.forEach(m => {
                                console.log(`    - ${m.description}: $${m.cost}`);
                            });
                        });
                        console.log('\n🎉 SUCCESS: Modifications are properly captured in order snapshot!');
                    } else {
                        console.log('  ❌ No modifications found in order snapshot');
                        console.log('\n💥 ISSUE: Modifications are missing from order snapshot');
                    }
                } else {
                    console.log('❌ Order not found with ID:', response.data.orderId);
                }
            } else {
                console.log('❌ Direct acceptance failed:', response.data.message);
            }
        } catch (axiosError) {
            console.log('❌ API call failed:', axiosError.message);
            if (axiosError.code === 'ECONNREFUSED') {
                console.log('🔧 Server appears to be down. Please start the server first.');
            } else if (axiosError.response) {
                console.log('Response status:', axiosError.response.status);
                console.log('Response data:', axiosError.response.data);
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testModificationCapture();
