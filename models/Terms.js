const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Terms = sequelize.define(
  'Terms',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    version: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    content: { type: DataTypes.TEXT('long'), allowNull: false },
    created_by_user_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: 'terms', timestamps: true }
);

module.exports = Terms;
