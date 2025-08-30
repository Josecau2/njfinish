const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ContactThread = sequelize.define('ContactThread', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: true, comment: 'Owner user (customer); null for admin-initiated' },
  subject: { type: DataTypes.STRING(255), allowNull: false },
  status: { type: DataTypes.ENUM('open', 'closed'), defaultValue: 'open' },
  last_message_at: { type: DataTypes.DATE, allowNull: true },
}, {
  timestamps: true,
  tableName: 'contact_threads',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['status'] },
    { fields: ['last_message_at'] },
  ],
});

module.exports = ContactThread;
