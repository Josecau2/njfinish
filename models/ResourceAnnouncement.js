const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ResourceAnnouncement = sequelize.define('resource_announcement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(180),
    allowNull: false,
  },
  summary: {
    type: DataTypes.STRING(280),
    allowNull: true,
  },
  body: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
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
  publish_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  expire_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  cta_label: {
    type: DataTypes.STRING(120),
    allowNull: true,
  },
  cta_url: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(32),
    allowNull: false,
    defaultValue: 'published',
  },
  visible_to_group_types: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  visible_to_group_ids: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'resource_announcements',
  underscored: true,
});

module.exports = ResourceAnnouncement;