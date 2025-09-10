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
  },
  parts_cents: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Parts cost in cents'
  },
  assembly_cents: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Assembly cost in cents'
  },
  mods_cents: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Modifications cost in cents'
  },
  subtotal_before_discount_cents: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Subtotal before discount in cents'
  },
  discount_cents: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Discount amount in cents'
  },
  delivery_cents: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Delivery cost in cents'
  },
  tax_cents: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Tax amount in cents'
  },
  tax_rate_pct: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Tax rate percentage'
  },
  discount_pct: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Discount percentage'
  },
  m_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Manufacturing cost'
  },
  m_markup: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Manufacturing markup percentage'
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: true,
    defaultValue: 'USD',
    comment: 'Currency code'
  },
  created_by_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'User who created the order'
  },
  locked_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when order was locked'
  },
  locked_by_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'User who locked the order'
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
