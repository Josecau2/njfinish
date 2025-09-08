// Placeholder migration: previously implemented via direct SQL scripts.
// Added to satisfy chronological ordering; does nothing if tables already exist.

'use strict';

module.exports = {
	async up(qi) {
		return Promise.resolve();
	},
	async down(qi) {
		return Promise.resolve();
	}
};
