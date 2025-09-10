const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProposalSectionItem = sequelize.define('ProposalSectionItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    proposal_section_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    code: {
        type: DataTypes.STRING,
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    qty: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    total: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    type: {
        type: DataTypes.STRING,
        allowNull: true
    },
    assembled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    taxable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    exposed_side: {
        type: DataTypes.STRING,
        allowNull: true
    },
    hinge_side: {
        type: DataTypes.STRING,
        allowNull: true
    },
    modifications: {
        type: DataTypes.TEXT('long'),
        allowNull: true
    },
    modifications_total: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    item_order: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    is_custom: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'proposal_section_items',
    timestamps: true
});

module.exports = ProposalSectionItem;
