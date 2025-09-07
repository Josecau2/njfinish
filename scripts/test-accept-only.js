/**
 * Test acceptance of an existing proposal
 * Usage: node scripts/test-accept-only.js PROPOSAL_ID
 */

const axios = require('axios');

async function main() {
  const proposalId = process.argv[2] || '201';
  const base = process.env.BASE_URL || 'http://localhost:8080';
  const token = process.env.JWT || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJqb3NlY2FAc3ltbWV0cmljYWx3b2xmLmNvbSIsIm5hbWUiOiJKb3NlIEZsZWl0YXMiLCJyb2xlIjoiQWRtaW4iLCJyb2xlX2lkIjoyLCJncm91cF9pZCI6MSwiaWF0IjoxNzU3MjExMDUwLCJleHAiOjE3NTcyMzk4NTB9.kSWkd_GfsrSPGdGnrj7wgvLmwTxj0oiJSbcZD1hZyFc';

  console.log(`🧪 Testing acceptance of proposal ${proposalId}`);

  try {
    // First check if proposal exists and its status
    console.log('🔍 Step 1: Checking proposal status...');
    const { Proposals } = require('../models');
    const proposal = await Proposals.findByPk(proposalId);
    if (proposal) {
      console.log('✅ Proposal found:', {
        id: proposal.id,
        status: proposal.status,
        is_locked: proposal.is_locked,
        customerId: proposal.customerId,
        description: proposal.description
      });
    } else {
      console.log('❌ Proposal not found');
      return;
    }

    if (proposal.status === 'accepted' || proposal.is_locked) {
      console.log('⚠️ Proposal already accepted/locked. Creating a new proposal for testing...');

      // Create a fresh proposal for testing
      const createRes = await axios.post(`${base}/api/create-proposals`, {
        action: "0",
        formData: {
          customerName: "Fresh Test Customer",
          customerEmail: "freshtest@example.com",
          description: "Fresh Test Design",
          date: new Date().toISOString(),
          status: "Draft",
          designer: 1,
          manufacturersData: [
            {
              manufacturer: 1,
              manufacturerName: "Jose Fleitas",
              selectedStyle: 1,
              styleName: "Artisan Moss",
              items: [{ id: 1, name: "Test Cabinet", price: 100, quantity: 1 }],
              summary: { cabinets: 100, grandTotal: 100 }
            }
          ]
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newProposalId = createRes.data?.data?.id;
      console.log('✅ Fresh proposal created:', newProposalId);

      if (newProposalId) {
        // Accept the fresh proposal
        console.log('📝 Step 2: Accepting fresh proposal...');
        const acceptRes = await axios.post(`${base}/api/proposals/${newProposalId}/accept`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Accept response:', {
          status: acceptRes.status,
          success: acceptRes.data?.success,
          message: acceptRes.data?.message,
          order: acceptRes.data?.order
        });

        // Check if order was created
        const { Order } = require('../models');
        const order = await Order.findOne({ where: { proposal_id: newProposalId } });

        if (order) {
          console.log('✅ Order created successfully:', {
            id: order.id,
            proposal_id: order.proposal_id,
            style_name: order.style_name,
            snapshotPresent: !!order.snapshot
          });

          if (order.snapshot) {
            const snapshot = typeof order.snapshot === 'string' ? JSON.parse(order.snapshot) : order.snapshot;
            console.log('📋 Snapshot info:', snapshot.info);
          }
        } else {
          console.log('❌ No order created for proposal', newProposalId);
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack?.split('\n').slice(0, 5)
    });
  } finally {
    try {
      const sequelize = require('../config/db');
      await sequelize.close();
    } catch (_) {}
  }
}

main();
