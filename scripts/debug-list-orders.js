/**
 * Debug: List latest orders directly from the DB via Sequelize
 * Usage:
 *   node scripts/debug-list-orders.js --limit 20
 *   node scripts/debug-list-orders.js --mine (scopes by group if you pass GROUP_ID)
 */
/* eslint-disable no-console */
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .option('limit', { type: 'number', default: 20 })
  .option('mine', { type: 'boolean', default: false })
  .option('proposal', { type: 'number', describe: 'Filter by proposal_id' })
  .option('id', { type: 'number', describe: 'Filter by order id' })
  .parse();

async function main() {
  // Lazy require models after env is loaded
  const { Order, Proposals, Customer, UserGroup, Manufacturer } = require('../models');
  const sequelize = require('../config/db');

  try {
  const where = {};
  if (argv.proposal) where.proposal_id = argv.proposal;
  if (argv.id) where.id = argv.id;
    if (argv.mine) {
      const groupId = process.env.GROUP_ID ? Number(process.env.GROUP_ID) : null;
      if (groupId) where.owner_group_id = groupId;
    }

    const rows = await Order.findAll({
      where,
      include: [
        { model: Proposals, as: 'proposal', attributes: ['id', 'description', 'customerId'] },
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'email'] },
        { model: UserGroup, as: 'ownerGroup', attributes: ['id', 'name'] },
        { model: Manufacturer, as: 'manufacturer', attributes: ['id', 'name'], required: false },
      ],
  order: [['accepted_at', 'DESC'], ['createdAt', 'DESC'], ['id', 'DESC']],
      limit: argv.limit,
    });

    const out = rows.map((o) => {
      let manuName = o.manufacturer?.name || null;
      if (!manuName) {
        try {
          const snap = typeof o.snapshot === 'string' ? JSON.parse(o.snapshot) : o.snapshot;
          manuName = snap?.manufacturers?.[0]?.manufacturerName || manuName;
        } catch (_) {
          // ignore
        }
      }
      return {
        id: o.id,
        proposal_id: o.proposal_id,
        customer_id: o.customer_id,
        customer: o.customer?.name || null,
        owner_group_id: o.owner_group_id,
        group: o.ownerGroup?.name || null,
        manufacturer_id: o.manufacturer_id,
        manufacturer: manuName,
        status: o.status,
        accepted_at: o.accepted_at,
        createdAt: o.createdAt,
        description: o.proposal?.description || null,
        hasSnapshot: !!o.snapshot,
      };
    });

    console.log(`\n🔎 Latest ${out.length} order(s):`);
    console.table(out);
  } catch (e) {
    console.error('❌ Error listing orders:', e?.message || e);
    if (e?.stack) console.error(e.stack);
    process.exitCode = 1;
  } finally {
    try { await sequelize.close(); } catch (_) {}
  }
}

main();
