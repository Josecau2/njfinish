// Ensures expected columns and indexes exist on orders table (idempotent)
'use strict';

module.exports = {
	async up(qi){
		const sequelize = qi.sequelize;
		async function hasTable(name){
			const [r] = await sequelize.query("SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?", { replacements: [name] });
			return Number((Array.isArray(r)?r[0]?.c:r?.c)||0) > 0;
		}
		async function hasColumn(table,col){
			const [r] = await sequelize.query("SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?", { replacements: [table, col] });
			return Number((Array.isArray(r)?r[0]?.c:r?.c)||0) > 0;
		}
		async function hasIndex(table, idx){
			const [r] = await sequelize.query("SHOW INDEX FROM `"+table+"` WHERE Key_name = ?", { replacements: [idx] });
			return Array.isArray(r) && r.length > 0;
		}
		if (!(await hasTable('orders'))) return; // create migration handles it
		const adds = [
			['proposal_id','INT NOT NULL'],
			['owner_group_id','INT NULL'],
			['customer_id','INT NULL'],
			['manufacturer_id','INT NULL'],
			['style_id','INT NULL'],
			['style_name','VARCHAR(255) NULL'],
			["status","ENUM('new','processing','completed','canceled') NOT NULL DEFAULT 'new'"],
			['accepted_at','DATETIME NULL'],
			['accepted_by_user_id','INT NULL'],
			['accepted_by_label','VARCHAR(255) NULL'],
			['grand_total_cents','INT NULL'],
			['snapshot','JSON NULL']
		];
		for (const [col, def] of adds){
			if (!(await hasColumn('orders', col))){
				try { await sequelize.query(`ALTER TABLE orders ADD COLUMN ${col} ${def}`); } catch(e){ if(!/Duplicate column/.test(e.message)) throw e; }
			}
		}
		// indexes
		const idxs = [ ['idx_orders_proposal','proposal_id'], ['idx_orders_owner_group','owner_group_id'], ['idx_orders_customer','customer_id'] ];
		for (const [idx, field] of idxs){
			if (!(await hasIndex('orders', idx))){
				try { await sequelize.query(`CREATE INDEX ${idx} ON orders (${field})`); } catch(e){ /* ignore duplicates */ }
			}
		}
	},
	async down(){ return Promise.resolve(); }
};

