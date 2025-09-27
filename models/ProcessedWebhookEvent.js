const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProcessedWebhookEvent = sequelize.define('ProcessedWebhookEvent', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  stripe_event_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  type: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  payment_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'payments',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  payload: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  received_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  processed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'processed_webhook_events',
  timestamps: true,
});

module.exports = ProcessedWebhookEvent;

