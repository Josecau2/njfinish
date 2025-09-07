const { Proposals } = require('./models');

(async () => {
  try {
    // Get the latest proposals and check their manufacturersData structure
    const proposals = await Proposals.findAll({
      order: [['id', 'DESC']],
      limit: 3,
      attributes: ['id', 'description', 'manufacturersData']
    });

    console.log('📋 Latest 3 proposals manufacturersData structure:');
    for (const proposal of proposals) {
      console.log(`\n=== Proposal ${proposal.id}: ${proposal.description} ===`);
      if (!proposal.manufacturersData) {
        console.log('❌ No manufacturersData');
        continue;
      }

      try {
        const raw = typeof proposal.manufacturersData === 'string' ? JSON.parse(proposal.manufacturersData) : proposal.manufacturersData;
        console.log('✅ Type:', typeof proposal.manufacturersData);
        console.log('✅ Is Array:', Array.isArray(raw));

        if (Array.isArray(raw) && raw[0]) {
          const firstManufacturer = raw[0];
          console.log('📦 First manufacturer structure:', {
            manufacturer: firstManufacturer.manufacturer,
            selectedStyle: firstManufacturer.selectedStyle,
            hasItems: Array.isArray(firstManufacturer.items) ? firstManufacturer.items.length : 'not array',
            hasSummary: !!firstManufacturer.summary,
            summaryModifications: firstManufacturer.summary?.modificationsCost || firstManufacturer.summary?.modifications || 'none'
          });

          if (firstManufacturer.items && Array.isArray(firstManufacturer.items)) {
            console.log('🔧 Items with modifications:');
            firstManufacturer.items.forEach((item, i) => {
              if (item.modifications || item.modificationsCost) {
                console.log(`  Item ${i}: ${item.name || item.description} - mods: ${item.modifications || item.modificationsCost}`);
              }
              // Check if item has assembly fee or total differs from price
              if (item.assemblyFee || (item.total && item.price && Math.abs(item.total - item.price) > 0.01)) {
                console.log(`  Item ${i}: ${item.name || item.description} - price: ${item.price}, total: ${item.total}, assembly: ${item.assemblyFee || 0}`);
              }
            });
          }
        }
      } catch (e) {
        console.log('❌ Parse error:', e.message);
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
