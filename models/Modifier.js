const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Modifier = sequelize.define('Modifier', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    modifierId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    presentAtAllLocations: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'modifiers',
    timestamps: true
});

module.exports = Modifier;
