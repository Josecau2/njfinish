const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PaymentConfiguration = sequelize.define('PaymentConfiguration', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  gatewayProvider: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'stripe',
  },
  gatewayUrl: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  embedCode: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  apiKey: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  webhookSecret: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  supportedCurrencies: {
    type: DataTypes.JSON,
    defaultValue: ['USD'],
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'payment_configurations',
  timestamps: true,
});

module.exports = PaymentConfiguration;
