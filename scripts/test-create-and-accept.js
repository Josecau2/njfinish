/**
 * Test creating a new proposal with complete data and accepting it
 * Usage: node scripts/test-create-and-accept.js
 */

const axios = require('axios');

async function main() {
  const base = process.env.BASE_URL || 'http://localhost:8080';
  const token = process.env.JWT || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJqb3NlY2FAc3ltbWV0cmljYWx3b2xmLmNvbSIsIm5hbWUiOiJKb3NlIEZsZWl0YXMiLCJyb2xlIjoiQWRtaW4iLCJyb2xlX2lkIjoyLCJncm91cF9pZCI6MSwiaWF0IjoxNzU3MjExMDUwLCJleHAiOjE3NTcyMzk4NTB9.kSWkd_GfsrSPGdGnrj7wgvLmwTxj0oiJSbcZD1hZyFc';

  console.log('🧪 Testing create and accept with complete snapshot data');

  try {
    // Step 1: Create a proposal with realistic data
    console.log('📝 Step 1: Creating proposal...');
    const proposalData = {
      action: "0",
      formData: {
        customerName: "Test Customer",
        customerEmail: "testcustomer@example.com",
        description: "Test Kitchen Design",
        date: new Date().toISOString(),
        status: "Draft",
        designer: 1, // Assuming user ID 1 exists
        manufacturersData: [
          {
            manufacturer: 1,
            manufacturerName: "Jose Fleitas",
            selectedStyle: 1,
            styleName: "Artisan Moss",
            styleColor: "Green",
            items: [
              {
                id: 1,
                name: "B12 - 12\" Base Cabinet",
                price: 171,
                quantity: 1,
                taxable: true,
                category: "Base Cabinet"
              },
              {
                id: 2,
                name: "W15 - 15\" Wall Cabinet",
                price: 130,
                quantity: 2,
                taxable: true,
                category: "Wall Cabinet"
              }
            ],
            customItems: [
              {
                name: "Custom Crown Molding",
                price: 150,
                taxable: true,
                quantity: 1
              }
            ],
            summary: {
              cabinets: 342,
              assemblyFee: 200,
              modifications: 130,
              styleTotal: 672,
              discountPercent: 0,
              discountAmount: 0,
              total: 672,
              deliveryFee: 200,
              taxRate: 6.67,
              tax: 58.16,
              grandTotal: 930.16
            }
          }
        ]
      }
    };

    const createRes = await axios.post(`${base}/api/create-proposals`, proposalData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const proposalId = createRes.data?.data?.id || createRes.data?.dataId || createRes.data?.id;
    console.log('✅ Proposal created:', {
      status: createRes.status,
      success: createRes.data?.success,
      proposalId: proposalId,
      fullResponse: createRes.data
    });

    if (!proposalId) {
      throw new Error('Failed to create proposal');
    }

    // Step 2: Accept the proposal
    console.log('📝 Step 2: Accepting proposal...');
    const acceptRes = await axios.post(`${base}/api/proposals/${proposalId}/accept`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Accept response:', {
      status: acceptRes.status,
      success: acceptRes.data?.success,
      message: acceptRes.data?.message,
      orderId: acceptRes.data?.order?.id
    });

    // Step 3: Check the created order and snapshot
    console.log('🔍 Step 3: Checking created order...');
    const { Order } = require('../models');
    const order = await Order.findOne({
      where: { proposal_id: proposalId },
      include: [
        { model: require('../models').Proposals, as: 'proposal' },
        { model: require('../models').Customer, as: 'customer' }
      ]
    });

    if (order) {
      console.log('✅ Order found:', {
        id: order.id,
        proposal_id: order.proposal_id,
        status: order.status,
        style_name: order.style_name,
        manufacturer_id: order.manufacturer_id,
        grand_total_cents: order.grand_total_cents
      });

      if (order.snapshot) {
        const snapshot = typeof order.snapshot === 'string' ? JSON.parse(order.snapshot) : order.snapshot;
        console.log('📋 Snapshot info:', {
          customerName: snapshot.info?.customerName,
          description: snapshot.info?.description,
          dateAccepted: snapshot.info?.dateAccepted,
          designerName: snapshot.info?.designerName,
          createdByName: snapshot.info?.createdByName,
          manufacturerName: snapshot.info?.manufacturerName,
          selectedStyle: snapshot.info?.selectedStyle,
          itemsCount: snapshot.items?.length,
          customItemsCount: snapshot.customItems?.length
        });

        console.log('💰 Pricing summary:', snapshot.pricingSummary);
      }
    } else {
      console.log('❌ No order found for proposal', proposalId);
    }

    // Step 4: Verify in orders API
    console.log('📡 Step 4: Checking orders API...');
    const ordersRes = await axios.get(`${base}/api/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const orders = ordersRes.data?.data || [];
    const newOrder = orders.find(o => o.proposal_id == proposalId);

    if (newOrder) {
      console.log('✅ Order appears in API:', {
        id: newOrder.id,
        proposal_id: newOrder.proposal_id,
        customer: newOrder.customer?.name,
        manufacturer: newOrder.manufacturer?.name
      });
    } else {
      console.log('❌ Order not found in API response');
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
