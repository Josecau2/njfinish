const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ManufacturerSubType = sequelize.define('ManufacturerSubType', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  manufacturer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'manufacturers',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  requires_hinge_side: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether items in this sub-type require hinge side selection'
  },
  requires_exposed_side: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether items in this sub-type require exposed side selection'
  },
  created_by_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'manufacturer_sub_types',
  timestamps: true,
  indexes: [
    {
      name: 'idx_sub_types_manufacturer',
      fields: ['manufacturer_id']
    },
    {
      name: 'idx_sub_types_name_manufacturer',
      fields: ['manufacturer_id', 'name'],
      unique: true
    }
  ]
});

module.exports = ManufacturerSubType;
