const sequelize = require('../config/db');

// Utility: check if a column exists in the current database schema
async function hasColumn(tableName, columnName) {
	try {
		const [rows] = await sequelize.query(
			'SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
			{ replacements: [tableName, columnName] }
		);
		const cnt = Array.isArray(rows) ? rows[0]?.cnt : rows?.cnt;
		return !!Number(cnt || 0);
	} catch (_) {
		return false;
	}
}

// Helpers
function mapTemplateRow(r) {
	let fieldsConfig = null;
	try { fieldsConfig = r.fields_config ? JSON.parse(r.fields_config) : null; } catch (_) {}
	return {
		id: r.t_id ?? r.id,
		categoryId: r.category_id ?? r.c_id ?? null,
		name: r.t_name ?? r.name,
		defaultPrice: r.default_price != null ? Number(r.default_price) : null,
		fieldsConfig,
		sampleImage: r.sample_image || null,
		isReady: r.is_ready ? !!Number(r.is_ready) : false,
		createdAt: r.created_at,
		updatedAt: r.updated_at,
	};
}

exports.getGallery = async (req, res) => {
	try {
		// Try to ensure image column exists (best-effort), otherwise gracefully fallback
		let imageColExists = await hasColumn('global_modification_categories', 'image');
		try {
			const env = require('../config/env');
			if (!imageColExists && env.DB_RUNTIME_ALTER) {
				// Use plain ADD COLUMN for broader MySQL/MariaDB compatibility
				await sequelize.query('ALTER TABLE global_modification_categories ADD COLUMN image VARCHAR(255) NULL AFTER order_index');
				imageColExists = true;
			}
		} catch (_) { /* ignore alter failures */ }

		// Build SELECT with or without the image column
		const imageSelect = imageColExists ? 'c.image' : 'NULL';

		const [rows] = await sequelize.query(`
			SELECT c.id AS c_id, c.name AS c_name, c.order_index, c.created_at, c.updated_at,
					 ${imageSelect} AS c_image,
					 t.id AS t_id, t.category_id, t.name AS t_name, t.default_price, t.fields_config, t.sample_image, t.is_ready, t.created_at, t.updated_at
			FROM global_modification_categories c
			LEFT JOIN global_modification_templates t ON t.category_id = c.id
			ORDER BY c.order_index ASC, c.name ASC, t.name ASC
		`);

		const byCat = new Map();
		for (const r of rows) {
			if (!byCat.has(r.c_id)) {
				byCat.set(r.c_id, {
					id: r.c_id,
					name: r.c_name,
					orderIndex: r.order_index || 0,
					image: r.c_image || null,
					templates: [],
				});
			}
			if (r.t_id) {
				byCat.get(r.c_id).templates.push(mapTemplateRow(r));
			}
		}
		const gallery = Array.from(byCat.values());
		return res.json({ gallery });
	} catch (e) {
		console.error('getGallery error:', e);
		return res.status(500).json({ message: 'Failed to load gallery' });
	}
};

exports.createCategory = async (req, res) => {
	try {
		const { name, orderIndex = 0, image = null } = req.body || {};
		if (!name || !String(name).trim()) return res.status(400).json({ message: 'Name is required' });
		let fieldsJson = null;
		try { fieldsJson = fieldsConfig ? JSON.stringify(fieldsConfig) : null; } catch (_) { fieldsJson = null; }
		let id;
		if (imageColExists) {
		const insertResult = await sequelize.query(
			'INSERT INTO global_modification_templates (category_id, name, default_price, fields_config, sample_image, is_ready, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
			{ replacements: [categoryId || null, String(name).trim(), defaultPrice != null ? Number(defaultPrice) : null, fieldsJson, sampleImage || null, isReadyVal] }
		);
			// sequelize.query returns [rows, metadata] on mysql2; insertId can be on metadata or rows depending on dialect
			const meta = Array.isArray(insertResult) ? insertResult[1] : insertResult;
			id = meta?.insertId;
		} else {
			const insertResult = await sequelize.query(
				'INSERT INTO global_modification_categories (name, order_index, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
				{ replacements: [String(name).trim(), Number(orderIndex) || 0] }
			);
			const meta = Array.isArray(insertResult) ? insertResult[1] : insertResult;
		console.error('createTemplate error:', e);
		}
		if (!id) {
			// Fallback: fetch using max id by name/order in rare case insertId not exposed
			const [[rowTmp]] = await sequelize.query('SELECT id FROM global_modification_categories WHERE name = ? ORDER BY id DESC LIMIT 1', { replacements: [String(name).trim()] });
			id = rowTmp?.id;
		}
		const [[row]] = await sequelize.query('SELECT * FROM global_modification_categories WHERE id = ?', { replacements: [id] });
		return res.json({ category: row });
	} catch (e) {
		console.error('createCategory error:', e);
		return res.status(500).json({ message: 'Failed to create category' });
	}
};

exports.updateCategory = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, orderIndex = 0, image = null } = req.body || {};
		if (!name || !String(name).trim()) return res.status(400).json({ message: 'Name is required' });
		const imageColExists = await hasColumn('global_modification_categories', 'image');
		if (imageColExists) {
			await sequelize.query(
				'UPDATE global_modification_categories SET name = ?, order_index = ?, image = ?, updated_at = NOW() WHERE id = ?',
				{ replacements: [String(name).trim(), Number(orderIndex) || 0, image || null, Number(id)] }
			);
		} else {
			await sequelize.query(
				'UPDATE global_modification_categories SET name = ?, order_index = ?, updated_at = NOW() WHERE id = ?',
				{ replacements: [String(name).trim(), Number(orderIndex) || 0, Number(id)] }
			);
		}
		const [[row]] = await sequelize.query('SELECT * FROM global_modification_categories WHERE id = ?', { replacements: [Number(id)] });
		return res.json({ category: row });
	} catch (e) {
		console.error('updateCategory error:', e);
		return res.status(500).json({ message: 'Failed to update category' });
	}
};

exports.createTemplate = async (req, res) => {
	try {
	const { categoryId = null, name, defaultPrice = null, isReady = false, fieldsConfig = null, sampleImage = null } = req.body || {};
		if (!name || !String(name).trim()) return res.status(400).json({ message: 'Name is required' });
	const fieldsJson = fieldsConfig ? JSON.stringify(fieldsConfig) : '{}';
		const isReadyVal = isReady ? 1 : 0;

		const insertResult = await sequelize.query(
			'INSERT INTO global_modification_templates (category_id, name, default_price, fields_config, sample_image, is_ready, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
			{ replacements: [categoryId || null, String(name).trim(), defaultPrice != null ? Number(defaultPrice) : null, fieldsJson, sampleImage || null, isReadyVal] }
		);
		const meta = Array.isArray(insertResult) ? insertResult[1] : insertResult;
		let id = meta?.insertId;
		if (!id) {
			const [[rowTmp]] = await sequelize.query('SELECT id FROM global_modification_templates WHERE name = ? ORDER BY id DESC LIMIT 1', { replacements: [String(name).trim()] });
			id = rowTmp?.id;
		}
		const [[row]] = await sequelize.query('SELECT * FROM global_modification_templates WHERE id = ?', { replacements: [id] });
		return res.json({ template: row });
	} catch (e) {
			console.error('createTemplate error:', e);
			const isProd = String(process.env.NODE_ENV).toLowerCase() === 'production';
			return res.status(500).json({
				message: 'Failed to create template',
				...(isProd ? {} : { error: e?.message, details: e?.original?.sqlMessage || e?.original?.message || null })
			});
	}
};

exports.updateTemplate = async (req, res) => {
	try {
	const { id } = req.params;
	const { categoryId = null, name, defaultPrice = null, isReady = false, fieldsConfig = null, sampleImage = null } = req.body || {};
		if (!name || !String(name).trim()) return res.status(400).json({ message: 'Name is required' });
	const fieldsJson = fieldsConfig ? JSON.stringify(fieldsConfig) : '{}';
		const isReadyVal = isReady ? 1 : 0;
		await sequelize.query(
			'UPDATE global_modification_templates SET category_id = ?, name = ?, default_price = ?, fields_config = ?, sample_image = ?, is_ready = ?, updated_at = NOW() WHERE id = ?',
			{ replacements: [categoryId || null, String(name).trim(), defaultPrice != null ? Number(defaultPrice) : null, fieldsJson, sampleImage || null, isReadyVal, Number(id)] }
		);
		const [[row]] = await sequelize.query('SELECT * FROM global_modification_templates WHERE id = ?', { replacements: [Number(id)] });
		return res.json({ template: row });
	} catch (e) {
		console.error('updateTemplate error:', e);
		return res.status(500).json({ message: 'Failed to update template' });
	}
};

exports.getAssignments = async (req, res) => {
	try {
		const manufacturerId = Number(req.query.manufacturerId);
		if (!manufacturerId) return res.status(400).json({ message: 'manufacturerId is required' });
		const [rows] = await sequelize.query(`
			SELECT a.*, t.id AS t_id, t.name AS t_name, t.default_price, t.fields_config, t.sample_image, t.is_ready,
						 c.id AS c_id, c.name AS c_name
			FROM global_modification_assignments a
			JOIN global_modification_templates t ON a.template_id = t.id
			LEFT JOIN global_modification_categories c ON t.category_id = c.id
			WHERE a.manufacturer_id = ?
			ORDER BY a.updated_at DESC
		`, { replacements: [manufacturerId] });
		const assignments = rows.map(r => ({
			id: r.id,
			templateId: r.template_id,
			manufacturerId: r.manufacturer_id,
			scope: r.scope,
			targetStyle: r.target_style,
			targetType: r.target_type,
			catalogDataId: r.catalog_data_id,
			overridePrice: r.override_price != null ? Number(r.override_price) : null,
			isActive: r.is_active == null ? true : !!Number(r.is_active),
			createdAt: r.created_at,
			updatedAt: r.updated_at,
			template: mapTemplateRow(r),
			category: r.c_id ? { id: r.c_id, name: r.c_name } : null,
		}));
		return res.json({ assignments });
	} catch (e) {
		console.error('getAssignments error:', e);
		return res.status(500).json({ message: 'Failed to load assignments' });
	}
};

exports.createAssignment = async (req, res) => {
	try {
		const {
			templateId,
			manufacturerId,
			scope = 'all',
			targetStyle = null,
			targetType = null,
			catalogDataId = null,
			overridePrice = null,
			isActive = true,
		} = req.body || {};

		if (!templateId || !manufacturerId) return res.status(400).json({ message: 'templateId and manufacturerId are required' });
		const isActiveVal = isActive ? 1 : 0;

		// Insert the assignment
		await sequelize.query(
			'INSERT INTO global_modification_assignments (template_id, manufacturer_id, scope, target_style, target_type, catalog_data_id, override_price, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
			{ replacements: [Number(templateId), Number(manufacturerId), String(scope), targetStyle || null, targetType || null, catalogDataId || null, overridePrice != null ? Number(overridePrice) : null, isActiveVal] }
		);

		// Get the inserted ID
		const [[idResult]] = await sequelize.query('SELECT LAST_INSERT_ID() AS id');
		const id = idResult.id;

		// Fetch the complete record
		const [[row]] = await sequelize.query('SELECT * FROM global_modification_assignments WHERE id = ?', { replacements: [id] });
		return res.json({ assignment: row });
	} catch (e) {
		console.error('createAssignment error:', e);
		return res.status(500).json({ message: 'Failed to create assignment' });
	}
};

exports.deleteAssignment = async (req, res) => {
	try {
		const { id } = req.params;
		await sequelize.query('DELETE FROM global_modification_assignments WHERE id = ?', { replacements: [Number(id)] });
		return res.json({ success: true });
	} catch (e) {
		console.error('deleteAssignment error:', e);
		return res.status(500).json({ message: 'Failed to delete assignment' });
	}
};

exports.deleteTemplate = async (req, res) => {
	try {
		const { id } = req.params;
		if (!id) return res.status(400).json({ message: 'Template ID is required' });

		// First, delete any assignments that reference this template
		await sequelize.query('DELETE FROM global_modification_assignments WHERE template_id = ?', { replacements: [Number(id)] });

		// Then delete the template itself
		await sequelize.query('DELETE FROM global_modification_templates WHERE id = ?', { replacements: [Number(id)] });

		return res.json({ success: true });
	} catch (e) {
		console.error('deleteTemplate error:', e);
		return res.status(500).json({ message: 'Failed to delete template' });
	}
};

exports.getItemAssignments = async (req, res) => {
	try {
		const catalogDataId = Number(req.params.catalogDataId);
		if (!catalogDataId) return res.status(400).json({ message: 'catalogDataId is required' });

		const [[item]] = await sequelize.query('SELECT id, manufacturer_id, style, type FROM manufacturer_catalog_data WHERE id = ?', { replacements: [catalogDataId] });
		if (!item) return res.status(404).json({ message: 'Catalog item not found' });

		const manufacturerId = item.manufacturer_id;
		const [rows] = await sequelize.query(`
			SELECT a.*, t.id AS t_id, t.name AS t_name, t.default_price, t.fields_config, t.sample_image, t.is_ready,
						 c.id AS c_id, c.name AS c_name
			FROM global_modification_assignments a
			JOIN global_modification_templates t ON a.template_id = t.id
			LEFT JOIN global_modification_categories c ON t.category_id = c.id
			WHERE a.manufacturer_id = ?
		`, { replacements: [manufacturerId] });

		// Compute applicable and apply item-level suppressions
		const suppressSet = new Set(rows.filter(r => r.scope === 'item' && Number(r.catalog_data_id) === catalogDataId && (r.is_active == null ? false : Number(r.is_active) === 0)).map(r => r.template_id));
		const applicable = rows.filter(r => {
			if (suppressSet.has(r.template_id)) return false;
			if (r.scope === 'all') return true;
			if (r.scope === 'style') return (r.target_style || '') === (item.style || '');
			if (r.scope === 'type') return (r.target_type || '') === (item.type || '');
			if (r.scope === 'item') return Number(r.catalog_data_id) === catalogDataId && (r.is_active == null ? true : Number(r.is_active) === 1);
			return false;
		});

		const assignments = applicable.map(r => ({
			id: r.id,
			templateId: r.template_id,
			manufacturerId: r.manufacturer_id,
			scope: r.scope,
			targetStyle: r.target_style,
			targetType: r.target_type,
			catalogDataId: r.catalog_data_id,
			overridePrice: r.override_price != null ? Number(r.override_price) : null,
			isActive: r.is_active == null ? true : !!Number(r.is_active),
			createdAt: r.created_at,
			updatedAt: r.updated_at,
			template: mapTemplateRow(r),
			category: r.c_id ? { id: r.c_id, name: r.c_name } : null,
		}));
		return res.json({ assignments, item: { id: item.id, manufacturerId, style: item.style, type: item.type } });
	} catch (e) {
		console.error('getItemAssignments error:', e);
		return res.status(500).json({ message: 'Failed to load item assignments' });
	}
};

