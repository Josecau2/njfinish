const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ResourceLink = sequelize.define('resource_link', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  visible_to_group_types: {
    type: DataTypes.JSON, // Array of group types: ['admin', 'contractor'] 
    allowNull: true,
    defaultValue: ['admin'] // Default to admin only
  },
  visible_to_group_ids: {
    type: DataTypes.JSON, // Array of specific group IDs, optional
    allowNull: true,
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Soft delete flag'
  },
}, {
  timestamps: true,
  tableName: 'resource_links',
  underscored: true,
});

module.exports = ResourceLink;
