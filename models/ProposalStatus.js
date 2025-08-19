const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProposalStatus = sequelize.define('ProposalStatus', {
    label: { type: DataTypes.STRING, allowNull: false },
    value: { type: DataTypes.STRING, allowNull: false, unique: true },
}, {
    timestamps: false,
    tableName: 'proposal_statuses',
});

module.exports = ProposalStatus;
