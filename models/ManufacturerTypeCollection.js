const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ManufacturerTypeCollection = sequelize.define('ManufacturerTypeCollection', {
    catalogId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'manufacturer_catalog_data',
            key: 'id',
        },
        field: 'catalog_id'
    },
    manufacturerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'manufacturer_id'
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    shortName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'short_name'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    code: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    image: {
        type: DataTypes.STRING, // URL or path
        allowNull: true
    },
}, {
    timestamps: true,
    tableName: 'manufacturer_type_collection'
});

module.exports = ManufacturerTypeCollection;
