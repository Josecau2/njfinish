const { Sequelize, DataTypes } = require('sequelize');
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
  file_path: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  file_size: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  file_type: {
    type: DataTypes.STRING, // or ENUM if you want fixed values
    allowNull: true,
  },
  mime_type: {
    type: DataTypes.STRING,
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  file_category: {
    type: DataTypes.STRING, // or ENUM if you want fixed values
    allowNull: true,
  },
  visible_to_group_types: {
    type: DataTypes.JSON, // Array of group types: ['admin', 'contractor'] 
    allowNull: true,
    defaultValue: ['admin'] // Default to admin only
  },
  visible_to_group_ids: {
    type: DataTypes.JSON, // Array of specific group IDs, optional
    allowNull: true,
  }
}, {
  timestamps: true,
  tableName: 'resource_files',
  underscored: true,
});

module.exports = ResourceFile;
