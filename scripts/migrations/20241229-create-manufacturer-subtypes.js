'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create manufacturer_sub_types table
    await queryInterface.createTable('manufacturer_sub_types', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      manufacturer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'manufacturers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      requires_hinge_side: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      requires_exposed_side: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'SET NULL',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Create catalog_sub_type_assignments table
    await queryInterface.createTable('catalog_sub_type_assignments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      catalog_data_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        // Correct parent table name (was mistakenly 'catalog_data')
        references: {
          model: 'manufacturer_catalog_data',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      sub_type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'manufacturer_sub_types',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      assigned_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'SET NULL',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('manufacturer_sub_types', ['manufacturer_id'], {
      name: 'idx_manufacturer_sub_types_manufacturer_id'
    });

    await queryInterface.addIndex('manufacturer_sub_types', ['manufacturer_id', 'name'], {
      name: 'idx_manufacturer_sub_types_manufacturer_name',
      unique: true
    });

    await queryInterface.addIndex('catalog_sub_type_assignments', ['catalog_data_id'], {
      name: 'idx_catalog_sub_type_assignments_catalog_data_id'
    });

    await queryInterface.addIndex('catalog_sub_type_assignments', ['sub_type_id'], {
      name: 'idx_catalog_sub_type_assignments_sub_type_id'
    });

    await queryInterface.addIndex('catalog_sub_type_assignments', ['catalog_data_id', 'sub_type_id'], {
      name: 'idx_catalog_sub_type_assignments_unique',
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop indexes first
    await queryInterface.removeIndex('catalog_sub_type_assignments', 'idx_catalog_sub_type_assignments_unique');
    await queryInterface.removeIndex('catalog_sub_type_assignments', 'idx_catalog_sub_type_assignments_sub_type_id');
    await queryInterface.removeIndex('catalog_sub_type_assignments', 'idx_catalog_sub_type_assignments_catalog_data_id');
    await queryInterface.removeIndex('manufacturer_sub_types', 'idx_manufacturer_sub_types_manufacturer_name');
    await queryInterface.removeIndex('manufacturer_sub_types', 'idx_manufacturer_sub_types_manufacturer_id');

    // Drop tables in reverse order (due to foreign key constraints)
    await queryInterface.dropTable('catalog_sub_type_assignments');
    await queryInterface.dropTable('manufacturer_sub_types');
  }
};
