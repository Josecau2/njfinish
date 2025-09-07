const yargs = require('yargs');

const argv = yargs
  .option('order', {
    alias: 'o',
    description: 'Order ID to check',
    type: 'number',
    demandOption: true
  })
  .help()
  .argv;

async function checkOrderSnapshot() {
  // Lazy require models after env is loaded
  const { Order } = require('../models');

  try {
    console.log(`🔍 Checking order ${argv.order} snapshot for modifications...`);

    const order = await Order.findByPk(argv.order);
    if (!order) {
      console.log('❌ Order not found');
      process.exit(1);
    }

    console.log(`📋 Order ${order.id} - Proposal ${order.proposal_id}`);
    console.log(`💰 Grand Total: $${(order.grand_total_cents / 100).toFixed(2)}`);

    // Parse snapshot
    let snapshot;
    try {
      snapshot = typeof order.snapshot === 'string' ? JSON.parse(order.snapshot) : order.snapshot;
    } catch (error) {
      console.log('❌ Failed to parse snapshot:', error.message);
      process.exit(1);
    }

    // Check summary modifications
    console.log('\n🔍 Checking summary modifications...');
    if (snapshot.summary && snapshot.summary.modificationsCost) {
      console.log('✅ Summary modificationsCost:', snapshot.summary.modificationsCost);
    } else {
      console.log('❌ No modificationsCost in summary');
    }

    // Check manufacturer-level modifications
    if (snapshot.manufacturers && Array.isArray(snapshot.manufacturers)) {
      console.log('\n🔍 Checking manufacturer-level modifications...');
      snapshot.manufacturers.forEach((manufacturer, index) => {
        console.log(`Manufacturer ${index}: ${manufacturer.manufacturerName}`);
        if (manufacturer.summary && manufacturer.summary.modificationsCost) {
          console.log(`  ✅ Modifications: $${manufacturer.summary.modificationsCost}`);
        } else {
          console.log(`  ❌ No modifications found`);
        }
      });
    }

    // Check item-level modifications
    console.log('\n🔍 Checking item-level modifications...');
    let foundItemModifications = false;

    if (snapshot.items && Array.isArray(snapshot.items)) {
      snapshot.items.forEach((item, index) => {
        if (item.modifications && Array.isArray(item.modifications) && item.modifications.length > 0) {
          console.log(`✅ Item ${index} (${item.name || item.sku}) modifications:`);
          item.modifications.forEach(mod => {
            console.log(`    - ${mod.description}: $${mod.cost}`);
          });
          foundItemModifications = true;
        }
      });
    }

    // Also check in manufacturersData
    if (snapshot.manufacturersData && Array.isArray(snapshot.manufacturersData)) {
      snapshot.manufacturersData.forEach((manufacturer, mIndex) => {
        if (manufacturer.items && Array.isArray(manufacturer.items)) {
          manufacturer.items.forEach((item, iIndex) => {
            if (item.modifications && Array.isArray(item.modifications) && item.modifications.length > 0) {
              console.log(`✅ ${manufacturer.manufacturerName} - Item ${iIndex} (${item.name || item.sku}) modifications:`);
              item.modifications.forEach(mod => {
                console.log(`    - ${mod.description}: $${mod.cost}`);
              });
              foundItemModifications = true;
            }
          });
        }
      });
    }

    if (!foundItemModifications) {
      console.log('❌ No item-level modifications found');
    }

    // Summary
    console.log('\n📊 MODIFICATION CAPTURE SUMMARY:');
    const summaryMods = snapshot.summary?.modificationsCost;
    const mfgMods = snapshot.manufacturers?.[0]?.summary?.modificationsCost;

    if (summaryMods && parseFloat(summaryMods) > 0) {
      console.log(`🎉 SUCCESS: Modifications captured in order snapshot!`);
      console.log(`   Total modifications: $${summaryMods}`);
      console.log(`   Item-level details: ${foundItemModifications ? 'Found' : 'Missing'}`);
    } else {
      console.log(`💥 ISSUE: Modifications missing from order snapshot`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkOrderSnapshot();
