/**
 * Test: Direct acceptance via /api/quotes/:id/accept
 * Usage:
 *   node scripts/test-direct-acceptance.js --proposal 176
 */
/* eslint-disable no-console */
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .option('proposal', { type: 'number', required: true, describe: 'Proposal ID to accept' })
  .parse();

async function main() {
  // Lazy require models after env is loaded
  const { Order, Proposals } = require('../models');
  const proposalsController = require('../controllers/proposalsController');

  try {
    console.log(`🧪 Testing direct acceptance for proposal ${argv.proposal}...`);

    // First check if proposal exists and its current state
    const proposal = await Proposals.findByPk(argv.proposal);
    if (!proposal) {
      console.log(`❌ Proposal ${argv.proposal} not found`);
      return;
    }

    console.log(`📋 Proposal ${argv.proposal} current state:`, {
      status: proposal.status,
      accepted_at: proposal.accepted_at,
      is_locked: proposal.is_locked
    });

    // Check if order already exists
    const existingOrder = await Order.findOne({ where: { proposal_id: argv.proposal } });
    if (existingOrder) {
      console.log(`✅ Order already exists: ${existingOrder.id}`);
      return;
    }

    if (proposal.status === 'accepted' || proposal.is_locked) {
      console.log(`❌ Proposal is already accepted/locked - cannot test direct acceptance`);
      return;
    }

    // Mock request and response objects for direct acceptance
    const mockReq = {
      params: {
        id: argv.proposal.toString()
      },
      body: {
        // No additional body data needed for direct acceptance
      },
      user: {
        id: 1,
        name: 'Test Admin',
        email: 'admin@njcabinets.com',
        group_id: 1,
        group: { type: 'admin' }
      }
    };

    let responseData = null;
    let responseError = null;

    const mockRes = {
      json: (data) => {
        responseData = data;
      },
      status: (code) => ({
        json: (data) => {
          responseError = { code, data };
        }
      })
    };

    console.log(`🔄 Calling acceptProposal directly...`);

    // Test the acceptProposal function
    await proposalsController.acceptProposal(mockReq, mockRes);

    if (responseError) {
      console.log(`❌ Error (${responseError.code}):`, responseError.data);
      return;
    }

    console.log('✅ acceptProposal completed successfully');

    // Wait a moment for any async operations
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if order was created
    const newOrder = await Order.findOne({ where: { proposal_id: argv.proposal } });

    if (newOrder) {
      console.log(`🎉 SUCCESS: Order ${newOrder.id} was created!`);
      console.log(`📋 Order details:`, {
        id: newOrder.id,
        proposal_id: newOrder.proposal_id,
        status: newOrder.status,
        accepted_at: newOrder.accepted_at,
        grand_total_cents: newOrder.grand_total_cents
      });
    } else {
      console.log(`❌ FAILED: No order was created for proposal ${argv.proposal}`);
    }

    // Check updated proposal state
    const updatedProposal = await Proposals.findByPk(argv.proposal);
    console.log(`📋 Updated proposal state:`, {
      status: updatedProposal.status,
      accepted_at: updatedProposal.accepted_at,
      is_locked: updatedProposal.is_locked
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

main();
