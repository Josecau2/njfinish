const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Order model stores a static snapshot when a proposal is accepted
const Order = sequelize.define('order', {
  proposal_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'FK to proposals.id'
  },
  owner_group_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Owning contractor group or admin group'
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  manufacturer_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  style_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  style_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('new', 'processing', 'completed', 'canceled'),
    allowNull: false,
    defaultValue: 'new'
  },
  accepted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  accepted_by_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'If acceptance was performed by an internal user'
  },
  accepted_by_label: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'If acceptance was external, keep a label (name/email)'
  },
  grand_total_cents: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Final grand total in cents'
  },
  snapshot: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Static snapshot of pricing, items, and computed totals at accept time'
  }
}, {
  timestamps: true,
  tableName: 'orders',
  indexes: [
    { name: 'idx_orders_proposal', fields: ['proposal_id'] },
    { name: 'idx_orders_owner_group', fields: ['owner_group_id'] },
    { name: 'idx_orders_customer', fields: ['customer_id'] }
  ]
});

module.exports = Order;
