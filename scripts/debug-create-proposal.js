// Run: node scripts/debug-create-proposal.js
// Purpose: Reproduce /api/create-proposals logic via direct controller call and print detailed errors

const path = require('path');


(async () => {
  const proposalsController = require('../controllers/proposalsController');
  const { User, UserGroup } = require('../models');

  // Resolve a real user from DB to satisfy FK constraints
  let dbUser = await User.findOne({ include: [{ model: UserGroup, as: 'group', required: false }] });
  if (!dbUser) {
    console.error('No users found in DB; cannot run debug-create-proposal test.');
    process.exit(1);
  }

  // Minimal mock req/res
  const req = {
    body: {
      action: '0',
      formData: {
        customerName: 'Debug Customer',
        customerEmail: `debug_${Date.now()}@example.com`,
        description: 'Debug create via script',
        status: '',
        date: new Date().toISOString(),
        // designer intentionally omitted (optional)
        manufacturersData: [
          {
            manufacturer: 1,
            manufacturerName: 'Debug Manufacturer',
            selectedStyle: 1,
            styleName: 'Debug Style',
            items: [
              {
                id: 'DBG-1',
                name: 'Debug Cabinet',
                price: 100,
                quantity: 1,
                total: 100,
                modifications: [
                  { name: 'Debug Mod', price: 10, qty: 1 }
                ]
              }
            ],
            customItems: [],
            summary: {
              cabinets: 100,
              assemblyFee: 0,
              modificationsCost: 10,
              total: 110,
              deliveryFee: 0,
              taxRate: 0,
              taxAmount: 0,
              grandTotal: 110
            }
          }
        ]
      }
    },
    // Use real DB user
    user: { id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role, group_id: dbUser.group_id, group: dbUser.group ? { type: dbUser.group.group_type, group_type: dbUser.group.group_type } : null }
  };

  const res = {
    _status: 200,
    _json: null,
    status(code) { this._status = code; return this; },
    json(obj) { this._json = obj; console.log('Response:', { status: this._status, body: obj }); return this; }
  };

  try {
    console.log('▶ Calling saveProposal...');
    await proposalsController.saveProposal(req, res);
  } catch (e) {
    console.error('❌ saveProposal threw:', e && e.stack || e);
  }

  // Exit explicitly to close DB pool
  setTimeout(() => process.exit(0), 1000);
})();
