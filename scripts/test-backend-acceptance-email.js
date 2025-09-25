#!/usr/bin/env node
/*
 Background test: Accept a proposal via controller path and assert that manufacturer email send is attempted.
 - Creates a minimal proposal if needed (or uses latest non-accepted proposal with manufacturersData)
 - Calls acceptProposal(req,res) directly with noSend=1 to avoid actual email
 - Prints and exits non-zero if send was not attempted or serious error occurred
*/
/* eslint-disable no-console */
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const sequelize = require('../config/db');
  const { Proposals, Customer, Manufacturer } = require('../models');
  const proposalsController = require('../controllers/proposalsController');
  const argv = process.argv.slice(2);
  const doSend = argv.includes('--send');
  const manuIdx = argv.indexOf('--manufacturer');
  const manuName = manuIdx > -1 ? argv[manuIdx + 1] : null;

  // Find a candidate proposal (not accepted)
  let proposal = await Proposals.findOne({ where: { status: 'Draft', is_locked: false }, order: [['id', 'DESC']] });
  // Always ensure we have manufacturersData with at least one manufacturer and item
  async function ensureProposalHasManufacturerData(p) {
    let md = p?.manufacturersData;
    try { if (typeof md === 'string') md = JSON.parse(md); } catch(_) { md = []; }
    if (!Array.isArray(md) || md.length === 0 || !md[0]?.manufacturer) {
      const cust = p?.customerId ? null : await Customer.create({ name: 'Backend Test Customer', email: 'backend-test@example.com', mobile: '000', address: 'N/A' });
      let manu = null;
      if (manuName) {
        manu = await Manufacturer.findOne({ where: { name: manuName } });
        if (!manu) console.warn('⚠️ Manufacturer not found by name, falling back to first active:', manuName);
      }
      if (!manu) manu = await Manufacturer.findOne({ where: { status: true }, order: [['id', 'ASC']] });
      if (!manu) {
        console.error('❌ No manufacturers found in DB. Seed a manufacturer first.');
        process.exit(10);
      }
      if (!p) {
        return await Proposals.create({
          customerId: cust?.id || null,
          description: 'Backend accept test',
          status: 'Draft',
          manufacturersData: JSON.stringify([
            {
              manufacturer: manu.id,
              manufacturerName: manu.name,
              selectedStyle: 1,
              styleName: 'Test Style',
              items: [{ id: 1, name: 'B12', price: 100, quantity: 1 }],
              summary: { total: 100, grandTotal: 100 }
            }
          ])
        });
      } else {
        p.manufacturersData = JSON.stringify([
          {
            manufacturer: manu.id,
            manufacturerName: manu.name,
            selectedStyle: 1,
            styleName: 'Test Style',
            items: [{ id: 1, name: 'B12', price: 100, quantity: 1 }],
            summary: { total: 100, grandTotal: 100 }
          }
        ]);
        await p.save();
        return p;
      }
    }
    return p;
  }

  proposal = await ensureProposalHasManufacturerData(proposal);

  // Mock req/res
  const req = {
    params: { id: String(proposal.id) },
    // Use external acceptance to avoid foreign key constraints on accepted_by_user_id
    body: {
      ...(doSend ? {} : { noSend: '1' }),
      external_signer_name: 'Backend Test Runner',
      external_signer_email: 'backend-test@example.com'
    },
    query: { ...(doSend ? {} : { noSend: '1' }) }
  };
  const res = {
    statusCode: 200,
    locals: {},
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; console.log('Response:', JSON.stringify(payload, null, 2)); return this; }
  };

  console.log(`🔄 Accepting proposal ${proposal.id} (${doSend ? 'REAL SEND' : 'noSend=1 simulation'})...`);
  await proposalsController.acceptProposal(req, res);

  const result = res.payload;
  if (!result?.success) {
    console.error('❌ acceptProposal failed', result?.message || result);
    process.exit(2);
  }

  const m = result.manufacturerEmail;
  if (!m) {
    console.error('❌ No manufacturerEmail field in response');
    process.exit(3);
  }

  if (m.error) {
    console.error('❌ Manufacturer email reported error:', m.error);
    process.exit(4);
  }

  if (m.attempted !== false && m.simulated) {
    console.log('✅ Manufacturer email attempted (simulated). Details:', m);
    process.exit(0);
  }

  if (m.attempted && m.sent) {
    console.log('✅ Manufacturer email sent (real send).');
    process.exit(0);
  }

  console.error('⚠️ Manufacturer email not attempted or nothing to send. Details:', m);
  process.exit(5);
}

main().catch(async (e) => {
  console.error('Test crashed:', e?.stack || e);
  try { const sequelize = require('../config/db'); await sequelize.close(); } catch(_){}
  process.exit(1);
});
