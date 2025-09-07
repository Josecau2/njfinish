const { Proposals } = require('./models');

(async () => {
  try {
    const drafts = await Proposals.findAll({
      where: { status: 'draft' },
      order: [['id', 'DESC']],
      limit: 5,
      attributes: ['id', 'status', 'description']
    });

    console.log('📝 Available draft proposals:');
    drafts.forEach(p => console.log(`  - ID: ${p.id}, Status: ${p.status}, Description: ${p.description}`));

    if (drafts.length === 0) {
      console.log('No draft proposals found');
    }
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
