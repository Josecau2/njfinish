const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Manufacturer = sequelize.define('Manufacturer', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  website: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isPriceMSRP: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_price_msrp'
  },
  costMultiplier: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'cost_multiplier'
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  assembledEtaDays: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'assembled_eta_days',
    comment: 'Estimated delivery time for assembled items'
  },
  unassembledEtaDays: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'unassembled_eta_days',
    comment: 'Estimated delivery time for unassembled items'
  },
  deliveryFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00,
    field: 'delivery_fee',
    comment: 'Delivery fee charged by manufacturer'
  },
  status: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  timestamps: true,
  tableName: 'manufacturers'
});

module.exports = { Manufacturer };