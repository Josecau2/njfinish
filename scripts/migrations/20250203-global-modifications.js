// Placeholder migration: previously implemented via direct SQL scripts.
// Added to satisfy chronological ordering; does nothing if tables already exist.

'use strict';

module.exports = {
	async up({ context: qi }) {
		// Intentionally no-op; real global modifications schema created in later dated migrations.
		return Promise.resolve();
	},
	async down() {
		// Non-destructive rollback
		return Promise.resolve();
	}
};
