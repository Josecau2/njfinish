const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Proposal = sequelize.define('proposal', {
    customerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    designer: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    measurementDone: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    designDone: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    measurementDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    designDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    location: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    salesRep: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    leadSource: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    type: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    assembled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    status: {
        type: DataTypes.ENUM(
            'Draft',
            'Follow up 1',
            'Follow up 2',
            'Follow up 3',
            'Measurement Scheduled',
            'Measurement done',
            'Design done',
            'Proposal done',
            'Proposal accepted',
            'Proposal rejected'
        ),
        allowNull: true,
    },      
    followUp1Date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    followUp2Date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    followUp3Date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    manufacturersData: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    
}, {
    timestamps: true,
    tableName: 'proposals',
});

module.exports = Proposal;
