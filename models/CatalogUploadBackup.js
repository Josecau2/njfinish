const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CatalogUploadBackup = sequelize.define('CatalogUploadBackup', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    manufacturerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'manufacturer_id'
    },
    uploadSessionId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'upload_session_id'
    },
    filename: {
        type: DataTypes.STRING,
        allowNull: false
    },
    originalName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'original_name'
    },
    backupData: {
        type: DataTypes.JSON,
        allowNull: false,
        field: 'backup_data'
    },
    itemsCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'items_count'
    },
    uploadedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'uploaded_at'
    },
    rolledBackAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'rolled_back_at'
    },
    isRolledBack: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_rolled_back'
    },
    uploadedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'uploaded_by'
    }
}, {
    tableName: 'catalog_upload_backups',
    timestamps: true
});

module.exports = CatalogUploadBackup;
