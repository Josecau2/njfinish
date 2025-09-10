const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const GlobalModificationAssignment = sequelize.define('GlobalModificationAssignment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    template_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'global_modification_templates',
            key: 'id'
        }
    },
    manufacturer_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    scope: {
        type: DataTypes.ENUM('all', 'style', 'type', 'item'),
        allowNull: false,
        defaultValue: 'all'
    },
    target_style: {
        type: DataTypes.STRING,
        allowNull: true
    },
    target_type: {
        type: DataTypes.STRING,
        allowNull: true
    },
    catalog_data_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'manufacturer_catalog_data',
            key: 'id'
        }
    },
    override_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'global_modification_assignments',
    timestamps: true,
    underscored: true
});

module.exports = GlobalModificationAssignment;