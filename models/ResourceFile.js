const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ResourceFile = sequelize.define('resource_file', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  original_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  file_path: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  file_size: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  file_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  mime_type: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.STRING(32),
    allowNull: false,
    defaultValue: 'active',
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  thumbnail_url: {
    type: DataTypes.STRING(512),
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
  tags: {
    type: DataTypes.JSON,
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
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  file_category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  visible_to_group_types: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: ['admin'],
  },
  visible_to_group_ids: {
    type: DataTypes.JSON,
    allowNull: true,
  }
}, {
  timestamps: true,
  tableName: 'resource_files',
  underscored: true,
});

module.exports = ResourceFile;