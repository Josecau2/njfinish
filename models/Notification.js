const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  recipient_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who will receive this notification'
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Type of notification for categorization'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Notification title/subject'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Notification message content'
  },
  payload: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional data related to the notification (proposalId, contractorGroupId, etc.)'
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether the notification has been read'
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when notification was read'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium',
    comment: 'Notification priority level'
  },
  action_url: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Optional URL for action button/link'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who triggered this notification (optional)'
  }
}, {
  timestamps: true,
  tableName: 'notifications',
  underscored: true,
  indexes: [
    {
      name: 'idx_notifications_user_read',
      fields: ['recipient_user_id', 'is_read']
    },
    {
      name: 'idx_notifications_user_read_at',
      fields: ['recipient_user_id', 'read_at']
    },
    {
      name: 'idx_notifications_type',
      fields: ['type']
    },
    {
      name: 'idx_notifications_created',
      fields: ['created_at']
    }
  ]
});

module.exports = Notification;
