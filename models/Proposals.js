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
            // New standardized statuses
            'draft',
            'sent',
            'accepted',
            'rejected',
            'expired',
            // Legacy statuses (for backward compatibility)
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
        comment: 'Extended status enum with new values while preserving existing ones'
    },
    // followUp1Date: {
    //     type: DataTypes.DATE,
    //     allowNull: true,
    // },
    // followUp2Date: {
    //     type: DataTypes.DATE,
    //     allowNull: true,
    // },
    // followUp3Date: {
    //     type: DataTypes.DATE,
    //     allowNull: true,
    // },
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
    owner_group_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'user_groups',
            key: 'id'
        },
        comment: 'Owning contractor group or admin group'
    },
    created_by_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'User who created this proposal for individual user data isolation'
    },
    accepted_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Timestamp when proposal was accepted'
    },
    accepted_by: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'User ID or external signer name who accepted proposal'
    },
    sent_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Timestamp when proposal was sent to customer'
    },
    is_locked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Locks prices after acceptance'
    },
    order_snapshot: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Snapshot of order data when proposal is accepted'
    },
    locked_pricing: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Locked pricing information'
    },
    locked_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Timestamp when pricing was locked'
    },
    locked_by_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'User who locked the pricing'
    },
    migrated_to_sections: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Flag indicating if proposal has been migrated to sections structure'
    },
    // Normalized numbering fields (NJ-xxx-mmddyy)
    proposal_number: {
        type: DataTypes.STRING(32),
        allowNull: true,
        comment: 'Normalized human-readable proposal number (e.g., NJ-001-092525)'
    },
    proposal_number_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Date portion for daily sequence (YYYY-MM-DD)'
    },
    proposal_number_seq: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Daily sequence integer for uniqueness enforcement'
    },

}, {
    timestamps: true,
    tableName: 'proposals',
    indexes: [
        {
            name: 'idx_proposals_owner_group',
            fields: ['owner_group_id']
        },
        {
            name: 'idx_proposals_owner_status',
            fields: ['owner_group_id', 'status']
        },
        {
            name: 'idx_proposals_created_by_user',
            fields: ['created_by_user_id']
        }
    ]
});

module.exports = Proposal;
