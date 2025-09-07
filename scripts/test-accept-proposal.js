/**
 * Quick test to reproduce acceptance and verify order creation
 * Usage: node scripts/test-accept-proposal.js PROPOSAL_ID
 */

const axios = require('axios');

async function main() {
  const proposalId = process.argv[2] || '199';
  const base = process.env.BASE_URL || 'http://localhost:8080';
  const token = process.env.JWT || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJqb3NlY2FAc3ltbWV0cmljYWx3b2xmLmNvbSIsIm5hbWUiOiJKb3NlIEZsZWl0YXMiLCJyb2xlIjoiQWRtaW4iLCJyb2xlX2lkIjoyLCJncm91cF9pZCI6MSwiaWF0IjoxNzU3MjExMDUwLCJleHAiOjE3NTcyMzk4NTB9.kSWkd_GfsrSPGdGnrj7wgvLmwTxj0oiJSbcZD1hZyFc';

  console.log(`🧪 Testing acceptance of proposal ${proposalId}`);

  try {
    // Step 1: Accept the proposal
    console.log('📝 Step 1: Accepting proposal...');
    const acceptRes = await axios.post(`${base}/api/proposals/${proposalId}/accept`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Accept response:', {
      status: acceptRes.status,
      success: acceptRes.data?.success,
      message: acceptRes.data?.message,
      orderId: acceptRes.data?.order?.id
    });

    // Step 2: Check if order was created
    console.log('🔍 Step 2: Checking for created order...');
    const { Order } = require('../models');
    const order = await Order.findOne({ where: { proposal_id: proposalId } });

    if (order) {
      console.log('✅ Order found:', {
        id: order.id,
        proposal_id: order.proposal_id,
        status: order.status,
        accepted_at: order.accepted_at,
        manufacturer_id: order.manufacturer_id,
        style_name: order.style_name
      });
    } else {
      console.log('❌ No order found for proposal', proposalId);
    }

    // Step 3: Fetch orders via API
    console.log('📡 Step 3: Fetching orders via API...');
    const ordersRes = await axios.get(`${base}/api/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const orders = ordersRes.data?.data || [];
    const newOrder = orders.find(o => o.proposal_id == proposalId);

    if (newOrder) {
      console.log('✅ Order found in API response:', {
        id: newOrder.id,
        proposal_id: newOrder.proposal_id,
        customer: newOrder.customer?.name,
        manufacturer: newOrder.manufacturer?.name
      });
    } else {
      console.log('❌ Order not found in API response. Total orders:', orders.length);
      console.log('Order IDs in response:', orders.map(o => ({ id: o.id, proposal_id: o.proposal_id })));
    }

  } catch (error) {
    console.error('❌ Test failed:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
  } finally {
    try {
      const sequelize = require('../config/db');
      await sequelize.close();
    } catch (_) {}
  }
}

main();
