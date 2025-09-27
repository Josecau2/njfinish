'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    // Defensive: describeTable may throw if table missing in some envs
    const table = await queryInterface.describeTable('global_modification_categories').catch(() => null);
    if (!table) return; // nothing to do if table doesn't exist

    if (!table.scope) {
      await queryInterface.addColumn('global_modification_categories', 'scope', {
        type: DataTypes.ENUM('gallery', 'manufacturer'),
        allowNull: false,
        defaultValue: 'gallery',
      });
    }

    if (!table.manufacturer_id) {
      await queryInterface.addColumn('global_modification_categories', 'manufacturer_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
      });
    }

    if (!table.order_index) {
      await queryInterface.addColumn('global_modification_categories', 'order_index', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('global_modification_categories').catch(() => null);
    if (!table) return;

    if (table.order_index) {
      await queryInterface.removeColumn('global_modification_categories', 'order_index');
    }

    if (table.manufacturer_id) {
      await queryInterface.removeColumn('global_modification_categories', 'manufacturer_id');
    }

    if (table.scope) {
      // Drop enum column last to avoid dependency issues
      await queryInterface.removeColumn('global_modification_categories', 'scope');
    }
  }
};
