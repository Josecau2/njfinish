/* eslint-disable no-console */
'use strict';

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .option('id', { type: 'number', demandOption: true })
  .parse();

(async () => {
  const sequelize = require('../config/db');
  const { Order } = require('../models');
  try {
    const o = await Order.findByPk(argv.id);
    if (!o) {
      console.log('Order not found');
      return;
    }
    let snap = null;
    try { snap = typeof o.snapshot === 'string' ? JSON.parse(o.snapshot) : o.snapshot; } catch (_) {}
    console.log(JSON.stringify({
      id: o.id,
      status: o.status,
      accepted_at: o.accepted_at,
      createdAt: o.createdAt,
      order_number: o.order_number,
      order_number_date: o.order_number_date,
      order_number_seq: o.order_number_seq,
      snapshot_info_orderNumber: snap?.info?.orderNumber || null
    }, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    try { await sequelize.close(); } catch (_) {}
  }
})();
