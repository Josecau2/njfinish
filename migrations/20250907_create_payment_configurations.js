// Migration to create payment_configurations table
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payment_configurations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      gatewayProvider: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'stripe',
      },
      gatewayUrl: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      embedCode: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      apiKey: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      webhookSecret: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      supportedCurrencies: {
        type: Sequelize.JSON,
        defaultValue: '["USD"]',
      },
      settings: {
        type: Sequelize.JSON,
        defaultValue: '{}',
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Add indexes
    await queryInterface.addIndex('payment_configurations', ['isActive'], { name: 'idx_payment_config_active' });
    await queryInterface.addIndex('payment_configurations', ['gatewayProvider'], { name: 'idx_payment_config_provider' });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('payment_configurations');
  },
};
