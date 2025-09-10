const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProposalSection = sequelize.define('ProposalSection', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    proposal_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    section_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    section_order: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    manufacturer_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    style_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    style_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    style_color: {
        type: DataTypes.STRING,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    section_summary: {
        type: DataTypes.TEXT('long'),
        allowNull: true
    },
    legacy_version_name: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'proposal_sections',
    timestamps: true
});

module.exports = ProposalSection;
