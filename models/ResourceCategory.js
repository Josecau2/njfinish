const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ResourceCategory = sequelize.define('resource_category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING(160),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  color: {
    type: DataTypes.STRING(32),
    allowNull: true,
  },
  icon: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  is_pinned: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  pinned_order: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  thumbnail_url: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'resource_categories',
  underscored: true,
});

module.exports = ResourceCategory;