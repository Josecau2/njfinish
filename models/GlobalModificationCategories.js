const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const GlobalModificationCategories = sequelize.define('GlobalModificationCategories', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    image: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        field: 'sort_order'
    }
}, {
    timestamps: true,
    tableName: 'global_modification_categories',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = GlobalModificationCategories;
