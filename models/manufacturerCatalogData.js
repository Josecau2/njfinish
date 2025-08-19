const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ManufacturerCatalogData = sequelize.define('ManufacturerCatalogData', {
    manufacturerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'manufacturer_id',
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    style: { type: DataTypes.STRING, allowNull: true },
    color: { type: DataTypes.STRING, allowNull: true },
    type: { type: DataTypes.STRING, allowNull: true },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    discontinued: { type: DataTypes.BOOLEAN, allowNull: true },
}, {
    timestamps: true,
    tableName: 'manufacturer_catalog_data'
});


module.exports = ManufacturerCatalogData;
