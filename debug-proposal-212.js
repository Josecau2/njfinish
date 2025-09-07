require('dotenv').config();
const { Proposals } = require('./models');

async function debugProposalData() {
    try {
        const proposal = await Proposals.findByPk(212);
        if (!proposal) {
            console.log('❌ Proposal 212 not found');
            return;
        }

        console.log('🔍 Raw manufacturersData:');
        console.log('Type:', typeof proposal.manufacturersData);
        console.log('Length:', proposal.manufacturersData?.length);
        console.log('First 200 chars:', proposal.manufacturersData?.substring(0, 200));

        // Try parsing
        try {
            let raw = proposal.manufacturersData;
            if (typeof raw === 'string') {
                console.log('\n🔍 First JSON.parse attempt...');
                raw = JSON.parse(raw);
                console.log('After first parse - Type:', typeof raw);

                if (typeof raw === 'string') {
                    console.log('\n🔍 Second JSON.parse attempt (double-encoded)...');
                    raw = JSON.parse(raw);
                    console.log('After second parse - Type:', typeof raw);
                }
            }

            console.log('\n🔍 Final parsed data structure:');
            if (Array.isArray(raw)) {
                console.log('✅ Successfully parsed as array with', raw.length, 'manufacturers');
                raw.forEach((manufacturer, index) => {
                    console.log(`Manufacturer ${index}:`, manufacturer.manufacturerName);
                    if (manufacturer.items && Array.isArray(manufacturer.items)) {
                        manufacturer.items.forEach((item, itemIndex) => {
                            if (item.modifications && Array.isArray(item.modifications)) {
                                console.log(`  Item ${itemIndex} modifications:`, item.modifications.length);
                                item.modifications.forEach(mod => {
                                    console.log(`    - ${mod.description}: $${mod.cost}`);
                                });
                            }
                        });
                    }
                });

                // Check for summary
                if (raw.summary) {
                    console.log('Summary modificationsCost:', raw.summary.modificationsCost);
                } else {
                    console.log('❌ No summary found in parsed data');
                }
            } else {
                console.log('❌ Parsed data is not an array:', typeof raw);
                if (raw && typeof raw === 'object') {
                    console.log('Object keys:', Object.keys(raw));
                    if (raw.summary) {
                        console.log('Summary modificationsCost:', raw.summary.modificationsCost);
                    }
                }
            }

        } catch (error) {
            console.log('❌ Parse error:', error.message);
        }

    } catch (error) {
        console.error('❌ Database error:', error.message);
    }
}

debugProposalData();
