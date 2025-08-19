const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Tax = sequelize.define('taxes', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    label: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    value: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
    },
    isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    timestamps: true,
    tableName: 'taxes',
});

module.exports = Tax;
