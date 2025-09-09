// Adds locked_pricing_snapshot column to proposals if missing (idempotent)
'use strict';

module.exports = {
	async up(qi) {
		const sequelize = qi.sequelize;
		// MySQL JSON support; fallback to LONGTEXT if JSON not available
		async function hasColumn(table, col){
			const [rows] = await sequelize.query("SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?", { replacements: [table, col] });
			return Number((Array.isArray(rows)?rows[0]?.c:rows?.c)||0) > 0;
		}
		const table = 'proposals';
		const col = 'locked_pricing_snapshot';
		if (!(await hasColumn(table, col))){
			// Try JSON first
			try {
				await sequelize.query(`ALTER TABLE ${table} ADD COLUMN ${col} JSON NULL AFTER updated_at`);
			} catch (e) {
				// Fallback to LONGTEXT if JSON unsupported or position invalid
				if (!/Duplicate column/.test(e.message)) {
					await sequelize.query(`ALTER TABLE ${table} ADD COLUMN ${col} LONGTEXT NULL`);
				}
			}
		}
	},
	async down(){ return Promise.resolve(); }
};

