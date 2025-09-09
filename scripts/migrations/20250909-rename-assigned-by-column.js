// Renames legacy column assigned_by -> assigned_by_user_id and normalizes timestamps
'use strict';

module.exports = {
	async up(qi){
		const sequelize = qi.sequelize;
		async function hasColumn(table,col){
			const [r] = await sequelize.query("SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?", { replacements: [table,col] });
			return Number((Array.isArray(r)?r[0]?.c:r?.c)||0) > 0;
		}
		const table = 'catalog_sub_type_assignments';
		const legacy = await hasColumn(table,'assigned_by');
		const desired = await hasColumn(table,'assigned_by_user_id');
		if (legacy && !desired){
			try { await qi.renameColumn(table,'assigned_by','assigned_by_user_id'); } catch(e){ if(!/Duplicate column|Unknown column/.test(e.message)) throw e; }
		}
		// Normalize timestamp casing if model expects camelCase
		const hasCreatedAt = await hasColumn(table,'createdAt');
		const hasCreated_at = await hasColumn(table,'created_at');
		if (!hasCreatedAt && hasCreated_at){ try { await qi.renameColumn(table,'created_at','createdAt'); } catch(_){} }
		const hasUpdatedAt = await hasColumn(table,'updatedAt');
		const hasUpdated_at = await hasColumn(table,'updated_at');
		if (!hasUpdatedAt && hasUpdated_at){ try { await qi.renameColumn(table,'updated_at','updatedAt'); } catch(_){} }
	},
	async down(){ /* no destructive rollback */ return Promise.resolve(); }
};

