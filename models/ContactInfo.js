const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Single-row table for company contact details
const ContactInfo = sequelize.define('ContactInfo', {
	id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
	companyName: { type: DataTypes.STRING, allowNull: true },
	email: { type: DataTypes.STRING, allowNull: true },
	phone: { type: DataTypes.STRING, allowNull: true },
	address: { type: DataTypes.TEXT, allowNull: true },
	website: { type: DataTypes.STRING, allowNull: true },
	hours: { type: DataTypes.STRING, allowNull: true },
	socials: { type: DataTypes.JSON, allowNull: true, comment: 'e.g., { facebook, instagram, twitter }' },
	notes: { type: DataTypes.TEXT, allowNull: true },
	updated_by: { type: DataTypes.INTEGER, allowNull: true, comment: 'User ID of last editor' },
	
	// Visibility controls for each field
	showCompanyName: { type: DataTypes.BOOLEAN, defaultValue: true },
	showEmail: { type: DataTypes.BOOLEAN, defaultValue: true },
	showPhone: { type: DataTypes.BOOLEAN, defaultValue: true },
	showAddress: { type: DataTypes.BOOLEAN, defaultValue: true },
	showWebsite: { type: DataTypes.BOOLEAN, defaultValue: true },
	showHours: { type: DataTypes.BOOLEAN, defaultValue: true },
	showNotes: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
	timestamps: true,
	tableName: 'contact_info',
});

module.exports = ContactInfo;

