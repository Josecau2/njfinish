const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Collection = sequelize.define('collection', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    vendor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    short_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    discontinued_at: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    }
}, {
    timestamps: true,
    tableName: 'collections',
});

module.exports = Collection;
