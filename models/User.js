const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const   User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM('User', 'Admin', 'Manufacturers', 'Contractor'),
    defaultValue: 'User',
  },
  resetToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resetTokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Personal address fields
  street_address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  zip_code: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Company information
  company_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  company_street_address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  company_city: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  company_state: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  company_zip_code: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  company_country: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isSalesRep: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  role_id: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  group_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'user_groups',
      key: 'id'
    },
    comment: 'User group membership'
  },
}, {
  timestamps: true,
  tableName: 'users',
});

module.exports = User;
