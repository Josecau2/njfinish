const yargs = require('yargs');
const { Proposals, Orders } = require('../models');
const { acceptProposal, updateProposal } = require('../controllers/proposalsController');

const argv = yargs
  .option('proposal', {
    alias: 'p',
    description: 'Proposal ID to test',
    type: 'number',
    demandOption: true
  })
  .option('flow', {
    alias: 'f',
    description: 'Test flow: direct or edit',
    type: 'string',
    choices: ['direct', 'edit'],
    default: 'direct'
  })
  .help()
  .argv;

async function testModificationCapture() {
  try {
    console.log(`🧪 Testing modification capture for proposal ${argv.proposal} using ${argv.flow} flow...`);

    // Get the proposal first
    const proposal = await Proposals.findByPk(argv.proposal);
    if (!proposal) {
      console.log('❌ Proposal not found');
      process.exit(1);
    }

    console.log(`📋 Found proposal: ${proposal.id} - ${proposal.description}`);

    // Parse and check modifications in proposal
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
      process.exit(1);
    }

    // Check for modifications in proposal
    console.log('\n🔍 Checking proposal modifications...');
    let proposalModifications = [];
    if (Array.isArray(manufacturersData)) {
      // Check summary
      if (manufacturersData[0] && manufacturersData[0].summary) {
        console.log('Summary modificationsCost:', manufacturersData[0].summary.modificationsCost);
      }

      // Check items
      manufacturersData.forEach((manufacturer, mIndex) => {
        if (manufacturer.items && Array.isArray(manufacturer.items)) {
          manufacturer.items.forEach((item, iIndex) => {
            if (item.modifications && Array.isArray(item.modifications) && item.modifications.length > 0) {
              proposalModifications.push({
                manufacturer: manufacturer.manufacturerName,
                item: item.sku || item.name || `Item ${iIndex}`,
                modifications: item.modifications
              });
            }
          });
        }
      });
    }

    if (proposalModifications.length > 0) {
      console.log('✅ Found modifications in proposal:');
      proposalModifications.forEach(mod => {
        console.log(`  ${mod.manufacturer} - ${mod.item}:`);
        mod.modifications.forEach(m => {
          console.log(`    - ${m.description}: $${m.cost}`);
        });
      });
    } else {
      console.log('❌ No modifications found in proposal');
    }

    // Test acceptance based on flow
    console.log(`\n🚀 Testing ${argv.flow} acceptance flow...`);

    let mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log(`Response ${code}:`, data);
          return { statusCode: code, data };
        }
      }),
      json: (data) => {
        console.log('Response:', data);
        return { data };
      }
    };

    if (argv.flow === 'direct') {
      // Test direct acceptance
      const mockReq = {
        params: { id: argv.proposal.toString() },
        body: {},
        user: { id: 1, name: 'Test Admin', email: 'admin@njcabinets.com', group_id: 1, group: { type: 'admin' } }
      };

      await acceptProposal(mockReq, mockRes);

    } else {
      // Test edit acceptance
      const mockReq = {
        body: {
          action: 'accept',
          formData: { id: argv.proposal }
        },
        user: { id: 1, name: 'Test Admin', email: 'admin@njcabinets.com' }
      };

      await updateProposal(mockReq, mockRes);
    }

    // Find the created order
    console.log('\n🔍 Checking for created order...');
    const order = await Orders.findOne({
      where: { proposal_id: argv.proposal },
      order: [['createdAt', 'DESC']]
    });

    if (!order) {
      console.log('❌ No order found for this proposal');
      process.exit(1);
    }

    console.log(`✅ Found order: ${order.id}`);

    // Check modifications in order snapshot
    let orderSnapshot;
    try {
      orderSnapshot = typeof order.snapshot === 'string' ? JSON.parse(order.snapshot) : order.snapshot;
    } catch (error) {
      console.log('❌ Failed to parse order snapshot:', error.message);
      process.exit(1);
    }

    console.log('\n🔍 Checking order snapshot modifications...');
    let orderModifications = [];

    if (Array.isArray(orderSnapshot.manufacturersData)) {
      // Check summary
      if (orderSnapshot.manufacturersData[0] && orderSnapshot.manufacturersData[0].summary) {
        console.log('Summary modificationsCost in order:', orderSnapshot.manufacturersData[0].summary.modificationsCost);
      }

      // Check items
      orderSnapshot.manufacturersData.forEach((manufacturer, mIndex) => {
        if (manufacturer.items && Array.isArray(manufacturer.items)) {
          manufacturer.items.forEach((item, iIndex) => {
            if (item.modifications && Array.isArray(item.modifications) && item.modifications.length > 0) {
              orderModifications.push({
                manufacturer: manufacturer.manufacturerName,
                item: item.sku || item.name || `Item ${iIndex}`,
                modifications: item.modifications
              });
            }
          });
        }
      });
    }

    if (orderModifications.length > 0) {
      console.log('✅ Found modifications in order snapshot:');
      orderModifications.forEach(mod => {
        console.log(`  ${mod.manufacturer} - ${mod.item}:`);
        mod.modifications.forEach(m => {
          console.log(`    - ${m.description}: $${m.cost}`);
        });
      });

      // Compare proposal vs order modifications
      if (JSON.stringify(proposalModifications) === JSON.stringify(orderModifications)) {
        console.log('\n🎉 SUCCESS: Modifications perfectly captured in order snapshot!');
      } else {
        console.log('\n⚠️ WARNING: Modifications differ between proposal and order');
      }
    } else {
      console.log('❌ No modifications found in order snapshot');
      console.log('\n💥 ISSUE: Modifications are missing from order snapshot');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

testModificationCapture();
