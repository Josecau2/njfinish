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
}, {
  timestamps: true,
  tableName: 'resource_links',
});

module.exports = ResourceLink;
