const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserGroupMultiplier = sequelize.define('user_group_multipliers', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_group_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  multiplier: {
    type: DataTypes.STRING, // Allows 'N/A'
    allowNull: false,
    defaultValue: 'N/A',
  },
  enabled: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
  },
}, {
  timestamps: true, // adds createdAt and updatedA
});

module.exports = UserGroupMultiplier;
