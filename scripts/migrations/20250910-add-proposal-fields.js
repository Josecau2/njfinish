'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('proposals');

    // Add order_snapshot column if it doesn't exist
    if (!tableInfo.order_snapshot) {
      await queryInterface.addColumn('proposals', 'order_snapshot', {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Snapshot of order data when proposal is accepted'
      });
    }

    // Add locked_pricing column if it doesn't exist
    if (!tableInfo.locked_pricing) {
      await queryInterface.addColumn('proposals', 'locked_pricing', {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Locked pricing information'
      });
    }

    // Add locked_at column if it doesn't exist
    if (!tableInfo.locked_at) {
      await queryInterface.addColumn('proposals', 'locked_at', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when pricing was locked'
      });
    }

    // Add locked_by_user_id column if it doesn't exist
    if (!tableInfo.locked_by_user_id) {
      await queryInterface.addColumn('proposals', 'locked_by_user_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'User who locked the pricing'
      });
    }

    // Add migrated_to_sections column if it doesn't exist
    if (!tableInfo.migrated_to_sections) {
      await queryInterface.addColumn('proposals', 'migrated_to_sections', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Flag indicating if proposal has been migrated to sections structure'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the columns in reverse order
    await queryInterface.removeColumn('proposals', 'migrated_to_sections');
    await queryInterface.removeColumn('proposals', 'locked_by_user_id');
    await queryInterface.removeColumn('proposals', 'locked_at');
    await queryInterface.removeColumn('proposals', 'locked_pricing');
    await queryInterface.removeColumn('proposals', 'order_snapshot');
  }
};
