const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ManufacturerAssemblyCost = sequelize.define('ManufacturerAssemblyCost', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    catalogDataId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'manufacturer_catalog_data',
            key: 'id',
        },
        field: 'catalog_data_id',
        onDelete: 'CASCADE'
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM('percentage', 'fixed'),
        allowNull: false,
        comment: 'percentage or fixed rate per cabinet'
    }
}, {
    timestamps: true,
    tableName: 'manufacturer_assembly_costs',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = ManufacturerAssemblyCost;
