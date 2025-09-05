'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('proposals', 'order_snapshot', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Static snapshot of all calculated values when order was accepted - includes final prices, totals, user group data, multipliers, etc.'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('proposals', 'order_snapshot');
  }
};
