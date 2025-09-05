'use strict';

// Fix global_modification_categories uniqueness: drop legacy unique(name) and ensure
// composite unique (scope, manufacturer_id, name). Leave helpful non-unique index for lookups.

module.exports = {
  async up({ context: qi }) {
    const sequelize = qi ? qi.sequelize : require('../../config/db');

    // Helper to find indexes by table/column
    async function getIndexes(table) {
      const [rows] = await sequelize.query(
        `SELECT INDEX_NAME, NON_UNIQUE, COLUMN_NAME, SEQ_IN_INDEX
         FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
         ORDER BY INDEX_NAME, SEQ_IN_INDEX`,
        { replacements: [table] }
      );
      return rows;
    }

    const table = 'global_modification_categories';
    const idx = await getIndexes(table);

    // Detect and drop any single-column unique index on (name)
    const uniqueNameIdx = idx.find(i => i.COLUMN_NAME === 'name' && i.NON_UNIQUE === 0 && i.SEQ_IN_INDEX === 1 &&
      // ensure it's single-column by checking no subsequent rows with same INDEX_NAME and seq 2
      !idx.some(j => j.INDEX_NAME === i.INDEX_NAME && j.SEQ_IN_INDEX === 2)
    );
    if (uniqueNameIdx) {
      const indexName = uniqueNameIdx.INDEX_NAME;
      try {
        await sequelize.query(`ALTER TABLE ${table} DROP INDEX \`${indexName}\``);
        console.log(`Dropped legacy unique index ${indexName} on ${table}(name)`);
      } catch (e) {
        console.warn('Could not drop legacy unique index:', uniqueNameIdx.INDEX_NAME, e.message);
      }
    }

    // Ensure a non-unique helper index on (scope, manufacturer_id) exists
    const hasHelperIdx = idx.some(i => i.INDEX_NAME === 'idx_gmcat_scope' && i.SEQ_IN_INDEX === 1 && i.COLUMN_NAME === 'scope');
    if (!hasHelperIdx) {
      try {
        await sequelize.query(`CREATE INDEX idx_gmcat_scope ON ${table} (scope, manufacturer_id)`);
      } catch (e) {
        // ignore if exists or cannot create
      }
    }

    // Ensure composite unique index (scope, manufacturer_id, name)
    const hasCompositeUnique = idx.some(i => i.INDEX_NAME === 'idx_gmcat_unique_scope_name' && i.NON_UNIQUE === 0);
    if (!hasCompositeUnique) {
      try {
        await sequelize.query(`CREATE UNIQUE INDEX idx_gmcat_unique_scope_name ON ${table} (scope, manufacturer_id, name)`);
        console.log('Created composite unique index on (scope, manufacturer_id, name)');
      } catch (e) {
        // index may already exist with a different name; try to detect any unique index covering the same columns
        const composite = idx.filter(i => i.NON_UNIQUE === 0 && ['scope','manufacturer_id','name'].includes(i.COLUMN_NAME))
          .reduce((acc, i) => { acc[i.INDEX_NAME] = (acc[i.INDEX_NAME]||0) + 1; return acc; }, {});
        const anyHasAll3 = Object.values(composite).some(c => c === 3);
        if (!anyHasAll3) {
          throw e;
        }
      }
    }
  },

  async down() {
    // Non-destructive: do not remove the composite unique index automatically
    return Promise.resolve();
  }
};
