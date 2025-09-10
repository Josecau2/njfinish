const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Customizations = sequelize.define('Customizations', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    value: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    }
}, {
    timestamps: true,
    tableName: 'customizations',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Customizations;
