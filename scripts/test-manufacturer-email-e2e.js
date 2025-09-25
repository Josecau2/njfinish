#!/usr/bin/env node
// E2E test: generate manufacturer no-price PDF via resend endpoint (noSend) and optionally send real email.
/* eslint-disable no-console */
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { Manufacturer, Order, Proposals } = require('../models');
const eventManager = require('../utils/eventManager');

async function main() {
  const noSend = !process.argv.includes('--send');
  const nameArgIdx = process.argv.indexOf('--manufacturer');
  const manufacturerName = nameArgIdx > -1 ? process.argv[nameArgIdx + 1] : 'Precision Woodworks';

  // Find a recent order for this manufacturer (fallback to any)
  const manufacturer = await Manufacturer.findOne({ where: { name: manufacturerName } });
  if (!manufacturer) {
    console.error('Manufacturer not found:', manufacturerName);
    process.exit(1);
  }

  const order = await Order.findOne({ where: { manufacturer_id: manufacturer.id }, order: [['id', 'DESC']] });
  if (!order) {
    console.error('No order found for manufacturer:', manufacturerName);
    process.exit(2);
  }

  const snapshot = typeof order.snapshot === 'string' ? (() => { try { return JSON.parse(order.snapshot); } catch (_) { return null; } })() : order.snapshot;
  if (!snapshot) {
    console.error('Order snapshot missing/invalid');
    process.exit(3);
  }

  if (noSend) {
    const pdf = await eventManager.generateNoPricePdf(snapshot);
    const bytes = pdf?.length || 0;
    console.log('PDF bytes:', bytes);
    if (bytes < 3000) {
      console.error('PDF too small; likely empty.');
      process.exit(4);
    }
    console.log('✓ Manufacturer PDF generation (noSend) passed for', manufacturerName, 'order', order.id);
  } else {
    await eventManager.autoEmailManufacturerOnAccept({ proposalId: order.proposal_id });
    console.log('✓ Manufacturer email send initiated for', manufacturerName, 'order', order.id);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error('Test failed:', e?.stack || e);
  process.exit(1);
});
