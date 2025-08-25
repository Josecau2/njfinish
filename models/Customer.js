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
  phone: { type: DataTypes.STRING, allowNull: true, comment: 'Primary phone number' },
  leadSource: { type: DataTypes.STRING, allowNull: true },
  customerType: { type: DataTypes.STRING, allowNull: true },
  defaultDiscount: { type: DataTypes.INTEGER, defaultValue: 0 },
  companyName: { type: DataTypes.STRING, allowNull: true },
  note: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.INTEGER, defaultValue: 1 },
  group_id: { 
    type: DataTypes.INTEGER, 
    allowNull: true,
    references: {
      model: 'user_groups',
      key: 'id'
    },
    comment: 'Owning contractor group'
  },
  created_by_user_id: { 
    type: DataTypes.INTEGER, 
    allowNull: true,
    references: {
      model: 'users', 
      key: 'id'
    },
    comment: 'User who created this customer'
  },
  deleted_at: { 
    type: DataTypes.DATE, 
    allowNull: true,
    comment: 'Soft delete timestamp'
  },
}, { 
  timestamps: true, 
  tableName: 'customers',
  paranoid: true, // Enable soft deletes
  deletedAt: 'deleted_at',
  indexes: [
    {
      name: 'idx_customers_group_id',
      fields: ['group_id']
    },
    {
      name: 'idx_customers_created_by',
      fields: ['created_by_user_id']
    },
    {
      name: 'idx_customers_group_name',
      fields: ['group_id', 'name']
    }
  ]
});

module.exports = Customer;
