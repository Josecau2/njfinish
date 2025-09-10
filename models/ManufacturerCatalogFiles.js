const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ManufacturerCatalogFiles = sequelize.define('ManufacturerCatalogFiles', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    manufacturerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'manufacturers',
            key: 'id',
        },
        field: 'manufacturer_id',
        onDelete: 'CASCADE'
    },
    fileName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'file_name'
    },
    originalName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'original_name'
    },
    fileSize: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'file_size'
    },
    uploadedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
        field: 'uploaded_by'
    }
}, {
    timestamps: true,
    tableName: 'manufacturer_catalog_files',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = ManufacturerCatalogFiles;
