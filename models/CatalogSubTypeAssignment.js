const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CatalogSubTypeAssignment = sequelize.define('CatalogSubTypeAssignment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  catalog_data_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'manufacturer_catalog_data',
      key: 'id'
    }
  },
  sub_type_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'manufacturer_sub_types',
      key: 'id'
    }
  },
  assigned_by_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'catalog_sub_type_assignments',
  timestamps: true,
  indexes: [
    {
      name: 'idx_catalog_sub_type_unique',
      fields: ['catalog_data_id', 'sub_type_id'],
      unique: true
    },
    {
      name: 'idx_assignments_catalog',
      fields: ['catalog_data_id']
    },
    {
      name: 'idx_assignments_sub_type',
      fields: ['sub_type_id']
    }
  ]
});

module.exports = CatalogSubTypeAssignment;
