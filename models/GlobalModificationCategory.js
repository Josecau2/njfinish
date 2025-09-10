const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const GlobalModificationCategory = sequelize.define('GlobalModificationCategory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    scope: {
        type: DataTypes.ENUM('gallery', 'manufacturer'),
        allowNull: false,
        defaultValue: 'gallery'
    },
    manufacturer_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    order_index: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'global_modification_categories',
    timestamps: true,
    underscored: true
});

module.exports = GlobalModificationCategory;