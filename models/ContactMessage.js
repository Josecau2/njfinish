const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ContactMessage = sequelize.define('ContactMessage', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  thread_id: { type: DataTypes.INTEGER, allowNull: false },
  author_user_id: { type: DataTypes.INTEGER, allowNull: true },
  is_admin: { type: DataTypes.BOOLEAN, defaultValue: false },
  body: { type: DataTypes.TEXT, allowNull: false },
  read_by_recipient: { type: DataTypes.BOOLEAN, defaultValue: false },
  read_at: { type: DataTypes.DATE, allowNull: true },
}, {
  timestamps: true,
  tableName: 'contact_messages',
  indexes: [
    { fields: ['thread_id'] },
    { fields: ['createdAt'] },
  ],
});

module.exports = ContactMessage;
