const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Minimal activity/audit log table
// Columns: actor (string), action (string), target_type (string), target_id (int), diff (json), createdAt (timestamp)
const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  actor: {
    type: DataTypes.STRING(128),
    allowNull: true,
    comment: 'Actor identifier: user:<id> or external:<label>'
  },
  action: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  target_type: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  target_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  diff: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Minimal before/after payload or contextual data'
  }
}, {
  tableName: 'activity_logs',
  timestamps: true,
  updatedAt: false,
  indexes: [
    { fields: ['target_type', 'target_id'] },
    { fields: ['action'] },
    { fields: ['createdAt'] },
  ]
});

module.exports = ActivityLog;
