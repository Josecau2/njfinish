const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Tokenized access session for a proposal (public viewing/acceptance)
// Fields: id, proposal_id, token, expires_at, created_by_user_id, customer_email, createdAt
const ProposalSession = sequelize.define('proposal_session', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  proposal_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'proposals', key: 'id' },
  },
  token: {
    type: DataTypes.STRING(128),
    allowNull: false,
    unique: true,
    comment: 'Random, unguessable token for session access',
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Session expiration timestamp',
  },
  created_by_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'User who created this session (usually contractor/admin)',
  },
  customer_email: {
    type: DataTypes.STRING(191),
    allowNull: true,
  },
}, {
  timestamps: true,
  updatedAt: false,
  tableName: 'proposal_sessions',
  indexes: [
    { fields: ['proposal_id'] },
    { unique: true, fields: ['token'] },
    { fields: ['expires_at'] },
  ],
});

module.exports = ProposalSession;
