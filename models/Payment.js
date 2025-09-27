const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      // Align with actual table naming convention (lowercase plural)
      model: 'orders',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  amount_cents: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Exact amount in minor units (cents) for Stripe charges',
    set(value) {
      const normalized = Number.isFinite(value) ? Math.round(value) : 0;
      this.setDataValue('amount_cents', normalized);
      this.setDataValue('amount', normalized / 100);
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    set(value) {
      if (value === null || value === undefined || value === '') {
        this.setDataValue('amount', 0);
        this.setDataValue('amount_cents', 0);
        return;
      }
      const decimal = Number.parseFloat(value);
      const cents = Math.round(decimal * 100);
      this.setDataValue('amount', decimal);
      this.setDataValue('amount_cents', cents);
    },
    get() {
      const stored = this.getDataValue('amount');
      if (stored !== null && stored !== undefined) {
        return Number(stored);
      }
      const cents = this.getDataValue('amount_cents');
      return cents !== null && cents !== undefined ? cents / 100 : null;
    }
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD',
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled'),
    defaultValue: 'pending',
  },
  gateway: {
    type: DataTypes.ENUM('stripe', 'manual'),
    allowNull: false,
    defaultValue: 'manual',
  },
  paymentMethod: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  transactionId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
  },
  receipt_url: {
    type: DataTypes.STRING(2048),
    allowNull: true,
  },
  gatewayResponse: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'payments',
  timestamps: true,
  hooks: {
    beforeValidate(payment) {
      const cents = payment.getDataValue('amount_cents');
      if ((cents === null || cents === undefined) && payment.amount !== null && payment.amount !== undefined) {
        const decimal = Number.parseFloat(payment.amount);
        if (Number.isFinite(decimal)) {
          payment.setDataValue('amount_cents', Math.round(decimal * 100));
        }
      }
      if (payment.amount_cents !== null && payment.amount_cents !== undefined && !payment.amount) {
        payment.setDataValue('amount', payment.amount_cents / 100);
      }
    }
  }
});

module.exports = Payment;

