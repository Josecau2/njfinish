const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserGroup = sequelize.define('user_groups', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  group_type: {
    type: DataTypes.ENUM('standard', 'contractor'),
    defaultValue: 'standard',
    allowNull: false,
  },
  modules: {
    type: DataTypes.JSON,
    defaultValue: {
      dashboard: false,
      proposals: false,
      customers: false,
      resources: false
    },
    allowNull: true,
  },
  contractor_settings: {
    type: DataTypes.JSON,
    defaultValue: null,
    allowNull: true,
    comment: 'Store defaults like price_multiplier, allowed manufacturers'
  },
}, {
  timestamps: true,
  tableName: 'user_groups'
});

module.exports = UserGroup;
