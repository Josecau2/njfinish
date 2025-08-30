const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TermsAcceptance = sequelize.define(
  'TermsAcceptance',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    terms_version: { type: DataTypes.INTEGER, allowNull: false },
    accepted_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'terms_acceptances',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['user_id', 'terms_version'] },
      { fields: ['user_id'] },
    ],
  }
);

module.exports = TermsAcceptance;
