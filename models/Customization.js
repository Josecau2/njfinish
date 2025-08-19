// models/Customization.js
const { Sequelize, DataTypes } = require('sequelize')
const sequelize = require('../config/db')

const Customization = sequelize.define('customization', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    headerBg: {
        type: DataTypes.STRING,
        defaultValue: '#ffffff',
        allowNull: true,
    },
    headerFontColor: {
        type: DataTypes.STRING,
        defaultValue: '#333333',
        allowNull: true,
    },
    sidebarBg: {
        type: DataTypes.STRING,
        defaultValue: '#212631',
        allowNull: true,
    },
    sidebarFontColor: {
        type: DataTypes.STRING,
        defaultValue: '#ffffff',
        allowNull: true,
    },
    logoText: {
        type: DataTypes.STRING,
        defaultValue: 'NJ Cabinets',
        allowNull: true,
    },
    logoBg: {
        type: DataTypes.STRING,
        defaultValue: '#0dcaf0',
        allowNull: true,
    },
    logoImage: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    timestamps: true,
    tableName: 'customizations',
})

module.exports = Customization
