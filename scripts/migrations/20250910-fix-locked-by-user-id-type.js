'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Fix locked_by_user_id column type from varchar to integer
    await queryInterface.changeColumn('proposals', 'locked_by_user_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'User who locked the pricing'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert back to varchar if needed
    await queryInterface.changeColumn('proposals', 'locked_by_user_id', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'User who locked the pricing'
    });
  }
};
