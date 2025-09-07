const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { Proposals, Order, Customer } = require('../models');
const { proposalsController } = require('../controllers');

const argv = yargs(hideBin(process.argv))
    .option('proposal', {
        alias: 'p',
        type: 'number',
        description: 'Proposal ID to test',
        demandOption: true
    })
    .help()
    .argv;

async function testHingeExposedSideSnapshot() {
    try {
        console.log('🧪 [TEST] Testing hinge side and exposed side data in order snapshots');
        console.log('🔍 [TEST] Proposal ID:', argv.proposal);

        // 1. Find the proposal
        const proposal = await Proposals.findByPk(argv.proposal, {
            include: [{ model: Customer, as: 'customer' }]
        });

        if (!proposal) {
            console.error('❌ [TEST] Proposal not found:', argv.proposal);
            process.exit(1);
        }

        console.log('📋 [TEST] Found proposal:', {
            id: proposal.id,
            status: proposal.status,
            customerName: proposal.customer?.name,
            description: proposal.description,
            hasManufacturersData: !!proposal.manufacturersData,
            isLocked: proposal.is_locked
        });

        // 2. Check if proposal has items with hinge/exposed side data
        let manufacturersData;
        try {
            manufacturersData = typeof proposal.manufacturersData === 'string'
                ? JSON.parse(proposal.manufacturersData)
                : proposal.manufacturersData;
        } catch (e) {
            console.error('❌ [TEST] Failed to parse manufacturersData:', e.message);
            process.exit(1);
        }

        if (!Array.isArray(manufacturersData) || manufacturersData.length === 0) {
            console.error('❌ [TEST] No manufacturers data found in proposal');
            process.exit(1);
        }

        // Check for items with hinge/exposed side data
        let itemsWithHingeSide = 0;
        let itemsWithExposedSide = 0;
        let totalItems = 0;

        manufacturersData.forEach((manufacturer, mIndex) => {
            if (Array.isArray(manufacturer.items)) {
                manufacturer.items.forEach((item, iIndex) => {
                    totalItems++;
                    console.log(`📦 [TEST] Item ${mIndex}.${iIndex}:`, {
                        id: item.id,
                        code: item.code,
                        description: item.description?.substring(0, 50) + '...',
                        qty: item.qty,
                        hingeSide: item.hingeSide,
                        exposedSide: item.exposedSide,
                        includeAssemblyFee: item.includeAssemblyFee,
                        isRowAssembled: item.isRowAssembled
                    });

                    if (item.hingeSide && item.hingeSide !== 'N/A') {
                        itemsWithHingeSide++;
                    }
                    if (item.exposedSide && item.exposedSide !== 'N/A') {
                        itemsWithExposedSide++;
                    }
                });
            }
        });

        console.log('📊 [TEST] Proposal items analysis:', {
            totalItems,
            itemsWithHingeSide,
            itemsWithExposedSide,
            hasTestableData: itemsWithHingeSide > 0 || itemsWithExposedSide > 0
        });

        if (itemsWithHingeSide === 0 && itemsWithExposedSide === 0) {
            console.warn('⚠️ [TEST] No items with hinge/exposed side data found. Consider testing with a proposal that has these fields set.');
        }

        // 3. Check if proposal is already accepted/locked
        if (proposal.status === 'accepted' && proposal.is_locked) {
            console.log('🔐 [TEST] Proposal is already accepted and locked');

            // Check existing order
            const existingOrder = await Order.findOne({ where: { proposal_id: proposal.id } });
            if (existingOrder) {
                console.log('📋 [TEST] Found existing order:', existingOrder.id);

                // Check snapshot for hinge/exposed side data
                if (existingOrder.snapshot) {
                    console.log('📸 [TEST] Analyzing existing order snapshot...');
                    analyzeSnapshot(existingOrder.snapshot, itemsWithHingeSide, itemsWithExposedSide);
                } else {
                    console.log('❌ [TEST] Existing order has no snapshot data');
                }

                console.log('✅ [TEST] Test completed with existing order');
                process.exit(0);
            }
        }

        if (proposal.is_locked) {
            console.error('❌ [TEST] Proposal is locked but not accepted. Cannot test acceptance flow.');
            process.exit(1);
        }

        // 4. Test acceptance flow using acceptProposal controller
        console.log('🎯 [TEST] Testing proposal acceptance with hinge/exposed side data preservation...');

        const mockReq = {
            params: { id: proposal.id.toString() },
            body: {},
            user: {
                id: 1,
                name: 'Test Admin',
                email: 'admin@test.com',
                group_id: 1,
                group: { type: 'admin' }
            }
        };

        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    console.log(`📤 [TEST] Response ${code}:`, JSON.stringify(data, null, 2));
                    return data;
                }
            }),
            json: (data) => {
                console.log('📤 [TEST] Response:', JSON.stringify(data, null, 2));
                return data;
            }
        };

        // Call acceptProposal controller function
        console.log('🔄 [TEST] Calling acceptProposal controller...');
        await proposalsController.acceptProposal(mockReq, mockRes);

        // 5. Verify the order was created and check snapshot
        const createdOrder = await Order.findOne({
            where: { proposal_id: proposal.id },
            order: [['createdAt', 'DESC']]
        });

        if (!createdOrder) {
            console.error('❌ [TEST] No order found after acceptance');
            process.exit(1);
        }

        console.log('✅ [TEST] Order created successfully:', {
            orderId: createdOrder.id,
            status: createdOrder.status,
            grandTotalCents: createdOrder.grand_total_cents,
            hasSnapshot: !!createdOrder.snapshot
        });

        // 6. Analyze the snapshot for hinge/exposed side data
        if (createdOrder.snapshot) {
            console.log('📸 [TEST] Analyzing order snapshot for hinge/exposed side data...');
            analyzeSnapshot(createdOrder.snapshot, itemsWithHingeSide, itemsWithExposedSide);
        } else {
            console.error('❌ [TEST] Order created but no snapshot data found');
        }

        console.log('🎉 [TEST] Test completed successfully!');

    } catch (error) {
        console.error('💥 [TEST] Test failed:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

function analyzeSnapshot(snapshot, expectedHingeSide, expectedExposedSide) {
    try {
        let foundHingeSide = 0;
        let foundExposedSide = 0;
        let totalSnapshotItems = 0;

        // Check manufacturers array
        if (Array.isArray(snapshot.manufacturers)) {
            snapshot.manufacturers.forEach((manufacturer, mIndex) => {
                if (Array.isArray(manufacturer.items)) {
                    manufacturer.items.forEach((item, iIndex) => {
                        totalSnapshotItems++;
                        console.log(`🔍 [TEST] Snapshot item ${mIndex}.${iIndex}:`, {
                            id: item.id,
                            name: item.name,
                            sku: item.sku,
                            quantity: item.quantity,
                            hingeSide: item.hingeSide,
                            exposedSide: item.exposedSide,
                            includeAssemblyFee: item.includeAssemblyFee,
                            isRowAssembled: item.isRowAssembled
                        });

                        if (item.hingeSide && item.hingeSide !== 'N/A') {
                            foundHingeSide++;
                        }
                        if (item.exposedSide && item.exposedSide !== 'N/A') {
                            foundExposedSide++;
                        }
                    });
                }
            });
        }

        // Check direct items array (fallback format)
        if (Array.isArray(snapshot.items)) {
            snapshot.items.forEach((item, iIndex) => {
                totalSnapshotItems++;
                console.log(`🔍 [TEST] Direct snapshot item ${iIndex}:`, {
                    id: item.id,
                    name: item.name,
                    sku: item.sku || item.code,
                    quantity: item.quantity || item.qty,
                    hingeSide: item.hingeSide,
                    exposedSide: item.exposedSide,
                    includeAssemblyFee: item.includeAssemblyFee,
                    isRowAssembled: item.isRowAssembled
                });

                if (item.hingeSide && item.hingeSide !== 'N/A') {
                    foundHingeSide++;
                }
                if (item.exposedSide && item.exposedSide !== 'N/A') {
                    foundExposedSide++;
                }
            });
        }

        console.log('📊 [TEST] Snapshot analysis results:', {
            totalSnapshotItems,
            foundHingeSide,
            foundExposedSide,
            expectedHingeSide,
            expectedExposedSide,
            hingeSideMatch: foundHingeSide === expectedHingeSide,
            exposedSideMatch: foundExposedSide === expectedExposedSide
        });

        if (foundHingeSide === expectedHingeSide && foundExposedSide === expectedExposedSide) {
            console.log('✅ [TEST] Hinge side and exposed side data preserved correctly in snapshot!');
        } else {
            console.log('⚠️ [TEST] Mismatch in hinge/exposed side data preservation');
            if (foundHingeSide !== expectedHingeSide) {
                console.log(`   - Hinge side: expected ${expectedHingeSide}, found ${foundHingeSide}`);
            }
            if (foundExposedSide !== expectedExposedSide) {
                console.log(`   - Exposed side: expected ${expectedExposedSide}, found ${foundExposedSide}`);
            }
        }

    } catch (error) {
        console.error('❌ [TEST] Error analyzing snapshot:', error.message);
    }
}

// Run the test
testHingeExposedSideSnapshot()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('💥 [TEST] Unhandled error:', error);
        process.exit(1);
    });
