const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserRole = sequelize.define('UserRole', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('User', 'Admin', 'Manufacturers'),
        allowNull: false
    }
}, {
    timestamps: true,
    tableName: 'user_roles',
});

module.exports = UserRole;
