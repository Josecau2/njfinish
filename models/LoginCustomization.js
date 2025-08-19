const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const LoginCustomization = sequelize.define('LoginCustomization', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  logo: {
    type: DataTypes.TEXT, // base64 or URL
    allowNull: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  subtitle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  backgroundColor: {
    type: DataTypes.STRING,
    allowNull: true
  },
  showForgotPassword: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  showKeepLoggedIn: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  rightTitle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  rightSubtitle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  rightTagline: {
    type: DataTypes.STRING,
    allowNull: true
  },
  rightDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'login_customizations'
});

module.exports = LoginCustomization;
