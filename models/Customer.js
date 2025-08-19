const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Customer = sequelize.define('Customer', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: true },
  address: { type: DataTypes.STRING, allowNull: true },
  aptOrSuite: { type: DataTypes.STRING, allowNull: true },
  city: { type: DataTypes.STRING, allowNull: true },
  state: { type: DataTypes.STRING, allowNull: true },
  zipCode: { type: DataTypes.STRING, allowNull: true },
  homePhone: { type: DataTypes.STRING, allowNull: true },
  mobile: { type: DataTypes.STRING, allowNull: true },
  leadSource: { type: DataTypes.STRING, allowNull: true },
  customerType: { type: DataTypes.STRING, allowNull: true },
  defaultDiscount: { type: DataTypes.INTEGER, defaultValue: 0 },
  companyName: { type: DataTypes.STRING, allowNull: true },
  note: { type: DataTypes.TEXT, allowNull: true },
   status: { type: DataTypes.INTEGER, defaultValue: 1 },
}, { timestamps: true, tableName: 'customers' });

module.exports = Customer;
