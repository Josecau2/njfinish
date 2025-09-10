const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const GlobalModificationTemplate = sequelize.define('GlobalModificationTemplate', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    category_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'global_modification_categories',
            key: 'id'
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    sample_image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fields_config: {
        type: DataTypes.TEXT('long'),
        allowNull: false
    },
    is_ready: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    is_blueprint: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
    },
    manufacturer_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    price_cents: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'global_modification_templates',
    timestamps: true,
    underscored: true
});

module.exports = GlobalModificationTemplate;