const { Proposals } = require('./models');

(async () => {
  try {
    // Find a recent proposal with modifications
    const proposals = await Proposals.findAll({
      where: { status: 'draft' },
      order: [['id', 'DESC']],
      limit: 5,
      attributes: ['id', 'description', 'manufacturersData']
    });

    for (const proposal of proposals) {
      try {
        const raw = typeof proposal.manufacturersData === 'string' ? JSON.parse(proposal.manufacturersData) : proposal.manufacturersData;
        if (raw && Array.isArray(raw) && raw[0] && raw[0].summary) {
          const summary = raw[0].summary;
          const modifications = Number(summary.modificationsCost || summary.modifications || 0);
          if (modifications > 0) {
            console.log(`📋 Proposal ${proposal.id} (${proposal.description}) has modifications: $${modifications}`);
            console.log('Items with potential modifications:');
            if (raw[0].items) {
              raw[0].items.forEach((item, i) => {
                console.log(`  Item ${i + 1}:`, {
                  name: item.name || item.description || item.code,
                  price: item.price,
                  modifications: item.modifications || item.modificationsCost || 'none',
                  assemblyFee: item.assemblyFee,
                  total: item.total
                });
              });
            }
            console.log('Raw summary:', summary);
            break;
          }
        }
      } catch (e) {
        console.log(`⚠️ Failed to parse proposal ${proposal.id}: ${e.message}`);
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
