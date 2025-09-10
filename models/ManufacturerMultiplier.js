const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ManufacturerMultiplier = sequelize.define('ManufacturerMultiplier', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    multiplier: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    },
    enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'manufacturer_multipliers',
    timestamps: true
});

module.exports = ManufacturerMultiplier;
