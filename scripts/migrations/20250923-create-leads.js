// Migration to create leads table for request access submissions
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const qi = queryInterface;
    const sequelize = qi.sequelize;
    const table = 'leads';

    const tableExists = async () => {
      const [rows] = await sequelize.query(
        "SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
        { replacements: [table] }
      );
      const payload = Array.isArray(rows) ? rows[0] : rows;
      return Number(payload?.c || 0) > 0;
    };

    if (!(await tableExists())) {
      await qi.createTable(table, {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        name: {
          type: Sequelize.STRING(191),
          allowNull: false,
        },
        email: {
          type: Sequelize.STRING(191),
          allowNull: false,
        },
        company: {
          type: Sequelize.STRING(191),
          allowNull: true,
        },
        message: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        status: {
          type: Sequelize.ENUM('new', 'reviewing', 'contacted', 'closed'),
          allowNull: false,
          defaultValue: 'new',
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });
    }

    // Ensure updatedAt column auto-updates if supported
    try {
      await sequelize.query(
        "ALTER TABLE `leads` MODIFY `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
      );
    } catch (err) {
      console.warn('[leads migration] Skipping updatedAt ON UPDATE clause:', err?.message || err);
    }

    // Ensure email index exists
    try {
      const indexes = await qi.showIndex(table).catch(() => []);
      const hasEmailIndex = Array.isArray(indexes)
        && indexes.some((idx) => idx.name === 'idx_leads_email' || idx.columnName === 'email' || (Array.isArray(idx.fields) && idx.fields.some((f) => f.attribute === 'email')));
      if (!hasEmailIndex) {
        await qi.addIndex(table, ['email'], { name: 'idx_leads_email' });
      }
    } catch (err) {
      console.warn('[leads migration] Unable to verify/add email index:', err?.message || err);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const qi = queryInterface;
    const sequelize = qi.sequelize;
    const table = 'leads';

    try {
      await qi.dropTable(table);
    } catch (err) {
      console.warn('[leads migration] dropTable failed:', err?.message || err);
    }

    // Clean up enum type if MySQL created it (noop on MySQL but kept for parity with postgres deployments)
    if (typeof qi.sequelize?.getQueryInterface?.() === 'function') {
      try {
        await sequelize.query("DROP TYPE IF EXISTS \"enum_leads_status\"");
      } catch (_) {
        // noop - MySQL doesn't create a separate enum type
      }
    }
  },
};
