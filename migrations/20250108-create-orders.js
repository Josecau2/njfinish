'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('orders', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      proposal_id: { type: Sequelize.INTEGER, allowNull: false },
      owner_group_id: { type: Sequelize.INTEGER, allowNull: true },
      customer_id: { type: Sequelize.INTEGER, allowNull: true },
      manufacturer_id: { type: Sequelize.INTEGER, allowNull: true },
      style_id: { type: Sequelize.INTEGER, allowNull: true },
      style_name: { type: Sequelize.STRING, allowNull: true },
      status: { type: Sequelize.ENUM('new', 'processing', 'completed', 'canceled'), allowNull: false, defaultValue: 'new' },
      accepted_at: { type: Sequelize.DATE, allowNull: true },
      accepted_by_user_id: { type: Sequelize.INTEGER, allowNull: true },
      accepted_by_label: { type: Sequelize.STRING, allowNull: true },
      grand_total_cents: { type: Sequelize.INTEGER, allowNull: true },
      snapshot: { type: Sequelize.JSON, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('orders');
  }
};
