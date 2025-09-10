const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Categories = sequelize.define('Categories', {
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
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
    }
}, {
    timestamps: true,
    tableName: 'categories',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Categories;
