const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ManufacturerHingesDetails = sequelize.define('ManufacturerHingesDetails', {
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
    leftHingePrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: 'left_hinge_price',
    },
    rightHingePrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: 'right_hinge_price',
    },
    bothHingesPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: 'both_hinges_price',
    },
    exposedSidePrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        field: 'exposed_side_price',
    }
}, {
    timestamps: true,
    tableName: 'manufacturer_hinges_details',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = ManufacturerHingesDetails;
