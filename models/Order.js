const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const env = require('../config/env');

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
  },
  // Normalized numbering fields (NJ-xxx-mmddyy)
  order_number: {
    type: DataTypes.STRING(32),
    allowNull: true,
    comment: 'Normalized human-readable order number (e.g., NJ-001-092525)'
  },
  order_number_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Date portion for daily sequence (YYYY-MM-DD)'
  },
  order_number_seq: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Daily sequence integer for uniqueness enforcement'
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

// Auto-create payment when order is created
Order.addHook('afterCreate', async (order, options) => {
  try {
    // Only create payment if order has a valid total
    if (order.grand_total_cents && order.grand_total_cents > 0) {
      const { Payment } = require('./index');

      // Check if payment already exists
      const existingPayment = await Payment.findOne({
        where: { orderId: order.id }
      });

      if (!existingPayment) {
        const amount = order.grand_total_cents / 100; // Convert cents to dollars

        const amountCents = Number.isFinite(order.grand_total_cents) ? order.grand_total_cents : Math.round((amount || 0) * 100);
        await Payment.create({
          orderId: order.id,
          amount_cents: amountCents,
          amount: amountCents / 100,
          currency: order.currency || 'USD',
          status: 'pending',
          gateway: 'manual',
          createdBy: order.accepted_by_user_id || order.created_by_user_id
        });

        console.log('✅ Auto-created payment for order:', {
          orderId: order.id,
          amount: amount,
          currency: order.currency || 'USD'
        });
      }
    }
  } catch (error) {
    // Don't fail order creation if payment creation fails
    console.error('❌ Failed to auto-create payment for order:', order.id, error.message);
  }
});

module.exports = Order;



