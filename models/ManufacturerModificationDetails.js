const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ManufacturerModificationDetails = sequelize.define('ManufacturerModificationDetails', {
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
    modificationName: {  
        type: DataTypes.STRING,
        allowNull: false,
        field: 'modification_name',
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    notes: {  
        type: DataTypes.TEXT,
        allowNull: true,
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    }
}, {
    timestamps: true,
    tableName: 'manufacturer_modification_details',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = ManufacturerModificationDetails;
