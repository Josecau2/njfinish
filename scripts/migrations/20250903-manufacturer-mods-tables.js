// Placeholder migration: 20250903-manufacturer-mods-tables
// This file was previously empty, causing Umzug to throw "migration.up is not a function".
// We retain the file (instead of deleting) so that ordering and executed history remain consistent.
// If manufacturer-specific modification tables are needed later, create a NEW migration with a later timestamp.

'use strict';

module.exports = {
	/**
	 * @param {import('sequelize').QueryInterface} qi
	 */
	up: async (qi) => {
		// No-op. Intentionally left blank.
		return Promise.resolve();
	},
	/**
	 * Down migration intentionally a no-op to preserve stability.
	 * @param {import('sequelize').QueryInterface} qi
	 */
	down: async (qi) => {
		return Promise.resolve();
	}
};

