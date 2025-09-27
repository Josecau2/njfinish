'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const qi = queryInterface;
    const table = await qi.describeTable('payment_configurations').catch(() => ({}));

    if (!table.stripePublishableKey) {
      await qi.addColumn('payment_configurations', 'stripePublishableKey', {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Stripe publishable key exposed to frontend'
      });
    }

    if (!table.cardPaymentsEnabled) {
      await qi.addColumn('payment_configurations', 'cardPaymentsEnabled', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Feature flag to enable Stripe card payments'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const qi = queryInterface;
    const table = await qi.describeTable('payment_configurations').catch(() => ({}));

    if (table.stripePublishableKey) {
      await qi.removeColumn('payment_configurations', 'stripePublishableKey');
    }

    if (table.cardPaymentsEnabled) {
      await qi.removeColumn('payment_configurations', 'cardPaymentsEnabled');
    }
  }
};

