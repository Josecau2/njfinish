'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes, literal } = Sequelize;

    const tables = [
      'resource_links',
      'resource_files',
      'resource_categories',
      'resource_announcements',
    ];

    for (const table of tables) {
      const definition = await queryInterface.describeTable(table).catch(() => null);
      if (!definition) continue;

      if (!definition.created_at) {
        await queryInterface.addColumn(table, 'created_at', {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: literal('CURRENT_TIMESTAMP'),
        });
      }

      if (!definition.updated_at) {
        await queryInterface.addColumn(table, 'updated_at', {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: literal('CURRENT_TIMESTAMP'),
        });
      }
    }
  },

  down: async (queryInterface) => {
    const tables = [
      'resource_links',
      'resource_files',
      'resource_categories',
      'resource_announcements',
    ];

    for (const table of tables) {
      const definition = await queryInterface.describeTable(table).catch(() => null);
      if (!definition) continue;

      if (definition.updated_at) {
        await queryInterface.removeColumn(table, 'updated_at');
      }
      if (definition.created_at) {
        await queryInterface.removeColumn(table, 'created_at');
      }
    }
  },
};

