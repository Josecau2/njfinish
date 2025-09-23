const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const LoginCustomizations = sequelize.define('LoginCustomizations', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  logo: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  backgroundColor: {
    type: DataTypes.STRING(7),
    allowNull: true,
    field: 'background_color',
  },
  textColor: {
    type: DataTypes.STRING(7),
    allowNull: true,
    field: 'text_color',
  },
  welcomeMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'welcome_message',
  },
  requestAccessTitle: {
    type: DataTypes.STRING(191),
    allowNull: true,
    field: 'request_access_title',
  },
  requestAccessSubtitle: {
    type: DataTypes.STRING(191),
    allowNull: true,
    field: 'request_access_subtitle',
  },
  requestAccessDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'request_access_description',
  },
  requestAccessBenefits: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'request_access_benefits',
  },
  requestAccessSuccessMessage: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'request_access_success_message',
  },
  requestAccessAdminSubject: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'request_access_admin_subject',
  },
  requestAccessAdminBody: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'request_access_admin_body',
  },
  requestAccessLeadSubject: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'request_access_lead_subject',
  },
  requestAccessLeadBody: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'request_access_lead_body',
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
  },
}, {
  timestamps: true,
  tableName: 'login_customizations',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = LoginCustomizations;

