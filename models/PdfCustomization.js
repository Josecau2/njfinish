const { Sequelize, DataTypes } = require('sequelize')
const sequelize = require('../config/db')

const PdfCustomization = sequelize.define('pdf_customizations', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  vendor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  pdfHeader: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  pdfFooter: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  headerLogo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  companyPhone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  companyEmail: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  companyWebsite: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  companyAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  headerBgColor: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  headerTxtColor: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'pdf_customizations',
  timestamps: true,
})

module.exports = PdfCustomization
