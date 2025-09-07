const { saveProposal } = require('../controllers/proposalsController');
const { Order, Proposals } = require('../models');

async function run() {
  // Build sample payload with item modifications and zero/absent summary mods to trigger fallback
  const manufacturersData = [
    {
      manufacturer: 1,
      manufacturerName: 'Test MFG',
      selectedStyle: 1,
      styleName: 'Modern',
      items: [
        {
          id: 'SKU-1',
          name: 'Base Cabinet',
          price: 200,
          quantity: 1,
          total: 200,
          modifications: [
            { name: 'Drill Holes', price: 25, qty: 2 },
            { name: 'Trim', price: 40, qty: 1 }
          ]
        }
      ],
      customItems: [],
      summary: {
        cabinets: 200,
        assemblyFee: 0,
        modificationsCost: 0, // Intentionally 0 to force fallback from items
        total: 200,
        deliveryFee: 0,
        taxRate: 0,
        taxAmount: 0,
        grandTotal: 200
      }
    }
  ];

  // Mock req/res
  const req = {
    body: {
      action: 'accept',
      formData: {
        description: 'Test Accept-on-Create',
        status: 'Draft',
        customerId: null,
        customerName: 'Test Customer',
        customerEmail: `test_${Date.now()}@example.com`,
        manufacturersData
      }
    },
    params: {},
    user: { id: 1, name: 'Automation', role: 'admin', group_id: null, group: { group_type: 'admin', type: 'admin' } }
  };

  const res = {
    status(code) { this.statusCode = code; return this; },
    json(payload) {
      this.payload = payload; console.log('HTTP', this.statusCode || 200, JSON.stringify(payload, null, 2));
    }
  };

  try {
    await saveProposal(req, res);

    const proposalId = res.payload?.proposalId || res.payload?.data?.id;
    const pid = proposalId || (await Proposals.findOne({ order: [['createdAt','DESC']] })).id;

    const order = await Order.findOne({ where: { proposal_id: pid }, order: [['createdAt','DESC']] });
    if (!order) {
      console.error('No order created for proposal', pid);
      process.exit(1);
    }
    // Snapshot may be stored as a JSON string; parse if needed
    let snap = order.snapshot || {};
    try {
      if (typeof snap === 'string') {
        snap = JSON.parse(snap);
      }
    } catch (_) {}
    const mods = snap?.summary?.modificationsCost ?? null;
    const itemMods = Array.isArray(snap?.items) ? snap.items.reduce((s, it) => s + (it.modificationsTotal || 0), 0) : null;
    console.log('Order snapshot mods summary:', mods);
    console.log('Order items modifications sum:', itemMods);
    console.log('Manufacturers[0].summary.modificationsCost:', snap?.manufacturers?.[0]?.summary?.modificationsCost);
  } catch (e) {
    console.error('Test failed:', e);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

run();
