'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const qi = queryInterface;
    const table = await qi.describeTable('payments').catch(() => ({}));

    const addColumnIfMissing = async (name, definition) => {
      if (!table[name]) {
        await qi.addColumn('payments', name, definition);
      }
    };

    await addColumnIfMissing('amount_cents', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Exact amount in minor units (cents) used for Stripe charges'
    });

    if (!table.gateway) {
      await qi.addColumn('payments', 'gateway', {
        type: Sequelize.ENUM('stripe', 'manual'),
        allowNull: false,
        defaultValue: 'manual',
        comment: 'Payment gateway source'
      });
    }

    await addColumnIfMissing('receipt_url', {
      type: Sequelize.STRING(2048),
      allowNull: true,
      comment: 'Receipt link returned by Stripe'
    });

    await qi.sequelize.query(`UPDATE payments SET amount_cents = ROUND(amount * 100) WHERE amount IS NOT NULL AND (amount_cents IS NULL OR amount_cents = 0)`);
    await qi.sequelize.query(`UPDATE payments SET amount = amount_cents / 100.0 WHERE amount_cents IS NOT NULL`);

    const ensureIndex = async (indexName, fields) => {
      const [existing] = await qi.sequelize.query(`SHOW INDEX FROM payments WHERE Key_name = :name`, {
        replacements: { name: indexName }
      });
      if (!existing || existing.length === 0) {
        await qi.addIndex('payments', fields, { name: indexName });
      }
    };

    await ensureIndex('idx_payments_gateway_status', ['gateway', 'status']);
    await ensureIndex('idx_payments_amount_cents', ['amount_cents']);
  },

  async down(queryInterface, Sequelize) {
    const qi = queryInterface;

    const removeIndexIfExists = async (name) => {
      try {
        await qi.removeIndex('payments', name);
      } catch (err) {
        const message = err && err.message ? err.message : '';
        if (!/Unknown index|does not exist/i.test(message)) {
          throw err;
        }
      }
    };

    await removeIndexIfExists('idx_payments_gateway_status');
    await removeIndexIfExists('idx_payments_amount_cents');

    const table = await qi.describeTable('payments').catch(() => ({}));

    const removeColumnIfExists = async (name) => {
      if (table[name]) {
        await qi.removeColumn('payments', name);
      }
    };

    await removeColumnIfExists('receipt_url');
    await removeColumnIfExists('amount_cents');

    if (table.gateway) {
      await qi.removeColumn('payments', 'gateway');
      if (qi.sequelize.getDialect() === 'postgres') {
        await qi.sequelize.query('DROP TYPE IF EXISTS "enum_payments_gateway";');
      }
    }
  }
};


