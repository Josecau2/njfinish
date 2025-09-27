'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const qi = queryInterface;
    const hasTable = await qi.sequelize.query(`SELECT COUNT(*) as c FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'processed_webhook_events'`)
      .then(([rows]) => Number(rows && rows[0] && rows[0].c) > 0);

    if (!hasTable) {
      await qi.createTable('processed_webhook_events', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        stripe_event_id: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true
        },
        type: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        payment_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'payments',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        payload: {
          type: Sequelize.JSON,
          allowNull: true
        },
        received_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        processed_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
    }

    const [existing] = await qi.sequelize.query(`SHOW INDEX FROM processed_webhook_events WHERE Key_name = 'uniq_processed_webhook_events_stripe_event_id'`);
    if (!existing || existing.length === 0) {
      await qi.addIndex('processed_webhook_events', ['stripe_event_id'], {
        name: 'uniq_processed_webhook_events_stripe_event_id',
        unique: true
      });
    }
  },

  async down(queryInterface) {
    const qi = queryInterface;
    await qi.dropTable('processed_webhook_events').catch(() => {});
  }
};

