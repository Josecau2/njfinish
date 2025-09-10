const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProposalItem = sequelize.define('ProposalItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    proposal_section_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    item_type: {
        type: DataTypes.ENUM('product', 'accessory', 'labor', 'custom'),
        defaultValue: 'product'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    sku: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    manufacturer_item_id: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    category: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    subcategory: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    width: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    height: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    depth: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    unit_price: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    order_index: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    is_custom: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    custom_options: {
        type: DataTypes.TEXT('long'),
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'proposal_items',
    timestamps: true,
    underscored: true
});

module.exports = ProposalItem;
