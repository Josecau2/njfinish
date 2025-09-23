const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const LoginCustomization = sequelize.define('LoginCustomization', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  logo: {
    type: DataTypes.TEXT,
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
  },
  requestAccessTitle: {
    type: DataTypes.STRING(191),
    allowNull: true,
    field: 'request_access_title'
  },
  requestAccessSubtitle: {
    type: DataTypes.STRING(191),
    allowNull: true,
    field: 'request_access_subtitle'
  },
  requestAccessDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'request_access_description'
  },
  requestAccessBenefits: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'request_access_benefits'
  },
  requestAccessSuccessMessage: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'request_access_success_message'
  },
  requestAccessAdminSubject: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'request_access_admin_subject'
  },
  requestAccessAdminBody: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'request_access_admin_body'
  },
  requestAccessLeadSubject: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'request_access_lead_subject'
  },
  requestAccessLeadBody: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'request_access_lead_body'
  },
  smtpHost: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'smtp_host'
  },
  smtpPort: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'smtp_port'
  },
  smtpSecure: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    field: 'smtp_secure'
  },
  smtpUser: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'smtp_user'
  },
  smtpPass: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'smtp_pass'
  },
  emailFrom: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'email_from'
  }
}, {
  timestamps: true,
  tableName: 'login_customizations'
});

module.exports = LoginCustomization;

