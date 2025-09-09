// Creates orders table if missing based on models/Order.js definition (idempotent)
'use strict';

module.exports = {
	async up(qi){
		const sequelize = qi.sequelize;
		async function hasTable(name){
			const [rows] = await sequelize.query("SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?", { replacements: [name] });
			return Number((Array.isArray(rows)?rows[0]?.c:rows?.c)||0) > 0;
		}
		if (!(await hasTable('orders'))){
			await sequelize.query(`
				CREATE TABLE orders (
					id INT AUTO_INCREMENT PRIMARY KEY,
					proposal_id INT NOT NULL,
					owner_group_id INT NULL,
						customer_id INT NULL,
						manufacturer_id INT NULL,
						style_id INT NULL,
						style_name VARCHAR(255) NULL,
						status ENUM('new','processing','completed','canceled') NOT NULL DEFAULT 'new',
						accepted_at DATETIME NULL,
						accepted_by_user_id INT NULL,
						accepted_by_label VARCHAR(255) NULL,
						grand_total_cents INT NULL,
						snapshot JSON NULL,
						createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
						updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
						INDEX idx_orders_proposal (proposal_id),
						INDEX idx_orders_owner_group (owner_group_id),
						INDEX idx_orders_customer (customer_id)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
			`);
		}
	},
	async down(){ return Promise.resolve(); }
};

