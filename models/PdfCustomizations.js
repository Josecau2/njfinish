const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PdfCustomizations = sequelize.define('PdfCustomizations', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    logo: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    headerText: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'header_text'
    },
    footerText: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'footer_text'
    },
    primaryColor: {
        type: DataTypes.STRING(7),
        allowNull: true,
        field: 'primary_color'
    },
    secondaryColor: {
        type: DataTypes.STRING(7),
        allowNull: true,
        field: 'secondary_color'
    }
}, {
    timestamps: true,
    tableName: 'pdf_customizations',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = PdfCustomizations;
