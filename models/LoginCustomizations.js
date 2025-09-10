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
        field: 'background_color'
    },
    textColor: {
        type: DataTypes.STRING(7),
        allowNull: true,
        field: 'text_color'
    },
    welcomeMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'welcome_message'
    }
}, {
    timestamps: true,
    tableName: 'login_customizations',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = LoginCustomizations;
