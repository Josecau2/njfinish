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

// Template row mapper with new schema
function mapTemplateRow(r) {
	let fieldsConfig = null;
	try { fieldsConfig = r.fields_config ? JSON.parse(r.fields_config) : null; } catch (_) {}
	return {
		id: r.t_id ?? r.id,
		categoryId: r.category_id ?? r.c_id ?? null,
		name: r.t_name ?? r.name,
		priceCents: r.price_cents != null ? Number(r.price_cents) : null,
		fieldsConfig,
		sampleImage: r.sample_image || null,
		isReady: r.is_ready ? !!Number(r.is_ready) : false,
		isBlueprint: r.is_blueprint ? !!Number(r.is_blueprint) : false,
		manufacturerId: r.manufacturer_id != null ? Number(r.manufacturer_id) : null,
		createdAt: r.created_at,
		updatedAt: r.updated_at,
	};
}

// Category row mapper with new schema
function mapCategoryRow(r) {
	return {
		id: r.c_id ?? r.id,
		name: r.c_name ?? r.name,
		scope: r.scope || 'gallery',
		manufacturerId: r.manufacturer_id != null ? Number(r.manufacturer_id) : null,
		orderIndex: r.order_index || 0,
		image: (r.c_image ?? r.image) || null,
		description: r.description || null,
		createdAt: r.created_at,
		updatedAt: r.updated_at,
	};
}

// GALLERY ENDPOINTS (Blueprints only)

exports.getGallery = async (req, res) => {
	try {
		const [rows] = await sequelize.query(`
			SELECT c.id AS c_id, c.name AS c_name, c.scope, c.manufacturer_id, c.order_index, c.image AS c_image, c.description, c.created_at, c.updated_at,
					 t.id AS t_id, t.category_id, t.name AS t_name, t.price_cents, t.fields_config, t.sample_image, t.is_ready, t.is_blueprint, t.manufacturer_id AS t_manufacturer_id, t.created_at AS t_created_at, t.updated_at AS t_updated_at
			FROM global_modification_categories c
			LEFT JOIN global_modification_templates t ON t.category_id = c.id AND t.is_blueprint = 1 AND t.manufacturer_id IS NULL
			WHERE c.scope = 'gallery' AND c.manufacturer_id IS NULL
			ORDER BY c.order_index ASC, c.name ASC, t.name ASC
		`);

		const byCat = new Map();
		for (const r of rows) {
			if (!byCat.has(r.c_id)) {
				byCat.set(r.c_id, {
					...mapCategoryRow(r),
					templates: [],
				});
			}
			if (r.t_id) {
				byCat.get(r.c_id).templates.push(mapTemplateRow(r));
			}
		}

		// Get usage counts for blueprints (how many manufacturers have copies)
		const [usageCounts] = await sequelize.query(`
			SELECT t.id, COUNT(DISTINCT copies.manufacturer_id) AS usage_count
			FROM global_modification_templates t
			LEFT JOIN global_modification_templates copies ON copies.is_blueprint = 0 AND copies.manufacturer_id IS NOT NULL
			WHERE t.is_blueprint = 1 AND t.manufacturer_id IS NULL
			GROUP BY t.id
		`);

		const usageMap = new Map();
		usageCounts.forEach(u => usageMap.set(u.id, u.usage_count));

		// Add usage counts to templates
		for (const category of byCat.values()) {
			category.templates.forEach(template => {
				template.usageCount = usageMap.get(template.id) || 0;
			});
		}

		const gallery = Array.from(byCat.values());
		return res.json({ gallery });
	} catch (e) {
		console.error('getGallery error:', e);
		return res.status(500).json({ message: 'Failed to load gallery' });
	}
};

exports.useBlueprint = async (req, res) => {
	try {
		const { blueprintId } = req.params;
		const { manufacturerId, targetCategoryId = null, allowDuplicate = false } = req.body || {};

		if (!blueprintId || !manufacturerId) {
			return res.status(400).json({ message: 'blueprintId and manufacturerId are required' });
		}

		// Verify blueprint exists and is actually a blueprint
		const [[blueprint]] = await sequelize.query(
			'SELECT * FROM global_modification_templates WHERE id = ? AND is_blueprint = 1 AND manufacturer_id IS NULL',
			{ replacements: [Number(blueprintId)] }
		);

		if (!blueprint) {
			return res.status(404).json({ message: 'Blueprint not found' });
		}

		// Check for duplicate name in target manufacturer
		if (!allowDuplicate) {
			const [[existing]] = await sequelize.query(
				'SELECT id FROM global_modification_templates WHERE name = ? AND manufacturer_id = ? AND is_blueprint = 0',
				{ replacements: [blueprint.name, Number(manufacturerId)] }
			);

			if (existing) {
				return res.status(409).json({
					duplicate: true,
					message: 'This will create a duplicate with the same name.',
					existingId: existing.id
				});
			}
		}

		// Handle category mapping
		let finalCategoryId = targetCategoryId;
		if (!finalCategoryId) {
			// Create new manufacturer category with same name as blueprint's category
			const [[blueprintCategory]] = await sequelize.query(
				'SELECT name FROM global_modification_categories WHERE id = ?',
				{ replacements: [blueprint.category_id] }
			);

			if (blueprintCategory) {
				const insertResult = await sequelize.query(
					'INSERT INTO global_modification_categories (name, scope, manufacturer_id, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
					{ replacements: [blueprintCategory.name, 'manufacturer', Number(manufacturerId), 0] }
				);
				const meta = Array.isArray(insertResult) ? insertResult[1] : insertResult;
				finalCategoryId = meta?.insertId;
			}
		}

		// Create manufacturer mod as copy of blueprint
		const fieldsJson = blueprint.fields_config || '{}';
		const insertResult = await sequelize.query(
			'INSERT INTO global_modification_templates (category_id, name, is_blueprint, manufacturer_id, price_cents, fields_config, sample_image, is_ready, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
			{ replacements: [
				finalCategoryId || null,
				blueprint.name,
				0, // is_blueprint = false
				Number(manufacturerId),
				0, // default price in cents
				fieldsJson,
				blueprint.sample_image || null,
				0 // is_ready = false initially
			] }
		);

		const meta = Array.isArray(insertResult) ? insertResult[1] : insertResult;
		const newId = meta?.insertId;

		if (!newId) {
			return res.status(500).json({ message: 'Failed to create manufacturer modification' });
		}

		// Return the new manufacturer mod
		const [[newTemplate]] = await sequelize.query(
			'SELECT * FROM global_modification_templates WHERE id = ?',
			{ replacements: [newId] }
		);

		return res.json({ template: newTemplate, success: true });
	} catch (e) {
		console.error('useBlueprint error:', e);
		return res.status(500).json({ message: 'Failed to copy blueprint' });
	}
};

// MANUFACTURER ENDPOINTS (Manufacturer Mods only)

exports.getManufacturerMods = async (req, res) => {
	try {
		const { manufacturerId } = req.params;
		if (!manufacturerId) {
			return res.status(400).json({ message: 'manufacturerId is required' });
		}

		const [rows] = await sequelize.query(`
			SELECT c.id AS c_id, c.name AS c_name, c.scope, c.manufacturer_id AS c_manufacturer_id, c.order_index, c.image AS c_image, c.description, c.created_at, c.updated_at,
					 t.id AS t_id, t.category_id, t.name AS t_name, t.price_cents, t.fields_config, t.sample_image, t.is_ready, t.is_blueprint, t.manufacturer_id AS t_manufacturer_id, t.created_at AS t_created_at, t.updated_at AS t_updated_at
			FROM global_modification_categories c
			LEFT JOIN global_modification_templates t ON t.category_id = c.id AND t.is_blueprint = 0 AND t.manufacturer_id = ?
			WHERE c.scope = 'manufacturer' AND c.manufacturer_id = ?
			ORDER BY c.order_index ASC, c.name ASC, t.name ASC
		`, { replacements: [Number(manufacturerId), Number(manufacturerId)] });

		const byCat = new Map();
		for (const r of rows) {
			if (!byCat.has(r.c_id)) {
				byCat.set(r.c_id, {
					...mapCategoryRow(r),
					templates: [],
				});
			}
			if (r.t_id) {
				byCat.get(r.c_id).templates.push(mapTemplateRow(r));
			}
		}

		const categories = Array.from(byCat.values());
		return res.json({ categories });
	} catch (e) {
		console.error('getManufacturerMods error:', e);
		return res.status(500).json({ message: 'Failed to load manufacturer modifications' });
	}
};

// TEMPLATE CRUD (handles both blueprints and manufacturer mods)

exports.createTemplate = async (req, res) => {
	try {
		const {
			categoryId = null,
			name,
			priceCents = null,
			isReady = false,
			fieldsConfig = null,
			sampleImage = null,
			isBlueprint = false,
			manufacturerId = null
		} = req.body || {};

		if (!name || !String(name).trim()) {
			return res.status(400).json({ message: 'Name is required' });
		}

		// Validate invariants
		if (isBlueprint) {
			if (manufacturerId !== null) {
				return res.status(400).json({ message: 'Blueprints cannot have a manufacturer_id' });
			}
			if (priceCents !== null) {
				return res.status(400).json({ message: 'Blueprints cannot have a price' });
			}
		} else {
			if (!manufacturerId) {
				return res.status(400).json({ message: 'Manufacturer modifications must have a manufacturer_id' });
			}
			if (priceCents === null) {
				// Default to 0 cents for manufacturer mods
				priceCents = 0;
			}
		}

		const fieldsJson = fieldsConfig ? JSON.stringify(fieldsConfig) : '{}';
		const isReadyVal = isReady ? 1 : 0;
		const isBlueprintVal = isBlueprint ? 1 : 0;

		const insertResult = await sequelize.query(
			'INSERT INTO global_modification_templates (category_id, name, is_blueprint, manufacturer_id, price_cents, fields_config, sample_image, is_ready, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
			{ replacements: [
				categoryId || null,
				String(name).trim(),
				isBlueprintVal,
				manufacturerId || null,
				priceCents != null ? Number(priceCents) : null,
				fieldsJson,
				sampleImage || null,
				isReadyVal
			] }
		);

		const meta = Array.isArray(insertResult) ? insertResult[1] : insertResult;
		let id = meta?.insertId;

		if (!id) {
			const [[rowTmp]] = await sequelize.query(
				'SELECT id FROM global_modification_templates WHERE name = ? ORDER BY id DESC LIMIT 1',
				{ replacements: [String(name).trim()] }
			);
			id = rowTmp?.id;
		}

		const [[row]] = await sequelize.query(
			'SELECT * FROM global_modification_templates WHERE id = ?',
			{ replacements: [id] }
		);

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
		const {
			categoryId = null,
			name,
			priceCents = null,
			isReady = false,
			fieldsConfig = null,
			sampleImage = null
		} = req.body || {};

		if (!name || !String(name).trim()) {
			return res.status(400).json({ message: 'Name is required' });
		}

		// Get existing template to preserve blueprint/manufacturer constraints
		const [[existing]] = await sequelize.query(
			'SELECT is_blueprint, manufacturer_id FROM global_modification_templates WHERE id = ?',
			{ replacements: [Number(id)] }
		);

		if (!existing) {
			return res.status(404).json({ message: 'Template not found' });
		}

		// Validate invariants - cannot change blueprint/manufacturer status via edit
		if (existing.is_blueprint) {
			if (priceCents !== null) {
				return res.status(400).json({ message: 'Blueprints cannot have a price' });
			}
		}

		const fieldsJson = fieldsConfig ? JSON.stringify(fieldsConfig) : '{}';
		const isReadyVal = isReady ? 1 : 0;

		await sequelize.query(
			'UPDATE global_modification_templates SET category_id = ?, name = ?, price_cents = ?, fields_config = ?, sample_image = ?, is_ready = ?, updated_at = NOW() WHERE id = ?',
			{ replacements: [
				categoryId || null,
				String(name).trim(),
				existing.is_blueprint ? null : (priceCents != null ? Number(priceCents) : null),
				fieldsJson,
				sampleImage || null,
				isReadyVal,
				Number(id)
			] }
		);

		const [[row]] = await sequelize.query(
			'SELECT * FROM global_modification_templates WHERE id = ?',
			{ replacements: [Number(id)] }
		);

		return res.json({ template: row });
	} catch (e) {
		console.error('updateTemplate error:', e);
		return res.status(500).json({ message: 'Failed to update template' });
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

// CATEGORY CRUD

exports.getCategories = async (req, res) => {
	try {
		const { scope = 'gallery', manufacturerId = null } = req.query;

		let whereClause = 'WHERE scope = ?';
		let replacements = [scope];

		if (scope === 'manufacturer') {
			if (!manufacturerId) {
				return res.status(400).json({ message: 'manufacturerId is required for manufacturer scope' });
			}
			whereClause += ' AND manufacturer_id = ?';
			replacements.push(Number(manufacturerId));
		} else {
			whereClause += ' AND manufacturer_id IS NULL';
		}

		const [rows] = await sequelize.query(`
			SELECT * FROM global_modification_categories
			${whereClause}
			ORDER BY order_index ASC, name ASC
		`, { replacements });

		const categories = rows.map(mapCategoryRow);
		return res.json({ categories });
	} catch (e) {
		console.error('getCategories error:', e);
		return res.status(500).json({ message: 'Failed to load categories' });
	}
};

exports.createCategory = async (req, res) => {
	try {
		const { name, scope = 'gallery', manufacturerId = null, orderIndex = 0, image = null, description = null } = req.body || {};

		if (!name || !String(name).trim()) {
			return res.status(400).json({ message: 'Name is required' });
		}

		// Validate scope rules
		if (scope === 'manufacturer' && !manufacturerId) {
			return res.status(400).json({ message: 'manufacturerId is required for manufacturer scope' });
		}
		if (scope === 'gallery' && manufacturerId) {
			return res.status(400).json({ message: 'manufacturerId must be null for gallery scope' });
		}

		const insertResult = await sequelize.query(
			'INSERT INTO global_modification_categories (name, scope, manufacturer_id, order_index, image, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
			{ replacements: [
				String(name).trim(),
				scope,
				manufacturerId || null,
				Number(orderIndex) || 0,
				image || null,
				description || null
			] }
		);

		const meta = Array.isArray(insertResult) ? insertResult[1] : insertResult;
		let id = meta?.insertId;

		if (!id) {
			const [[rowTmp]] = await sequelize.query(
				'SELECT id FROM global_modification_categories WHERE name = ? AND scope = ? ORDER BY id DESC LIMIT 1',
				{ replacements: [String(name).trim(), scope] }
			);
			id = rowTmp?.id;
		}

		const [[row]] = await sequelize.query(
			'SELECT * FROM global_modification_categories WHERE id = ?',
			{ replacements: [id] }
		);

		return res.json({ category: row });
	} catch (e) {
		console.error('createCategory error:', e);
		return res.status(500).json({ message: 'Failed to create category' });
	}
};

exports.updateCategory = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, orderIndex = 0, image = null, description = null } = req.body || {};

		if (!name || !String(name).trim()) {
			return res.status(400).json({ message: 'Name is required' });
		}

		await sequelize.query(
			'UPDATE global_modification_categories SET name = ?, order_index = ?, image = ?, description = ?, updated_at = NOW() WHERE id = ?',
			{ replacements: [String(name).trim(), Number(orderIndex) || 0, image || null, description || null, Number(id)] }
		);

		const [[row]] = await sequelize.query(
			'SELECT * FROM global_modification_categories WHERE id = ?',
			{ replacements: [Number(id)] }
		);

		return res.json({ category: row });
	} catch (e) {
		console.error('updateCategory error:', e);
		return res.status(500).json({ message: 'Failed to update category' });
	}
};

exports.deleteCategory = async (req, res) => {
	try {
		const { id } = req.params;
		const { mode = 'only', moveToCategoryId = null } = req.query;

		if (!id) {
			return res.status(400).json({ message: 'Category ID is required' });
		}

		// Get category to verify scope constraints
		const [[category]] = await sequelize.query(
			'SELECT scope, manufacturer_id FROM global_modification_categories WHERE id = ?',
			{ replacements: [Number(id)] }
		);

		if (!category) {
			return res.status(404).json({ message: 'Category not found' });
		}

		// Handle different delete modes
		if (mode === 'only') {
			// Verify category is empty
			const [[count]] = await sequelize.query(
				'SELECT COUNT(*) AS cnt FROM global_modification_templates WHERE category_id = ?',
				{ replacements: [Number(id)] }
			);

			if (count.cnt > 0) {
				return res.status(400).json({
					message: 'Cannot delete category: contains modifications. Use mode=withMods or mode=move.'
				});
			}
		} else if (mode === 'withMods') {
			// Delete all templates in this category first
			await sequelize.query(
				'DELETE FROM global_modification_assignments WHERE template_id IN (SELECT id FROM global_modification_templates WHERE category_id = ?)',
				{ replacements: [Number(id)] }
			);
			await sequelize.query(
				'DELETE FROM global_modification_templates WHERE category_id = ?',
				{ replacements: [Number(id)] }
			);
		} else if (mode === 'move') {
			if (!moveToCategoryId) {
				return res.status(400).json({ message: 'moveToCategoryId is required for mode=move' });
			}

			// Verify target category exists and has same scope
			const [[targetCategory]] = await sequelize.query(
				'SELECT scope, manufacturer_id FROM global_modification_categories WHERE id = ?',
				{ replacements: [Number(moveToCategoryId)] }
			);

			if (!targetCategory) {
				return res.status(400).json({ message: 'Target category not found' });
			}

			if (targetCategory.scope !== category.scope || targetCategory.manufacturer_id !== category.manufacturer_id) {
				return res.status(400).json({ message: 'Target category must have same scope and manufacturer' });
			}

			// Move all templates to target category
			await sequelize.query(
				'UPDATE global_modification_templates SET category_id = ? WHERE category_id = ?',
				{ replacements: [Number(moveToCategoryId), Number(id)] }
			);
		}

		// Delete the category
		await sequelize.query(
			'DELETE FROM global_modification_categories WHERE id = ?',
			{ replacements: [Number(id)] }
		);

		return res.json({ success: true });
	} catch (e) {
		console.error('deleteCategory error:', e);
		return res.status(500).json({ message: 'Failed to delete category' });
	}
};

// LEGACY ASSIGNMENT ENDPOINTS (kept for backward compatibility)

exports.getAssignments = async (req, res) => {
	try {
		const manufacturerId = Number(req.query.manufacturerId);
		if (!manufacturerId) return res.status(400).json({ message: 'manufacturerId is required' });

		const [rows] = await sequelize.query(`
			SELECT a.*, t.id AS t_id, t.name AS t_name, t.price_cents, t.fields_config, t.sample_image, t.is_ready,
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

exports.getItemAssignments = async (req, res) => {
	try {
		const catalogDataId = Number(req.params.catalogDataId);
		if (!catalogDataId) return res.status(400).json({ message: 'catalogDataId is required' });

		const [[item]] = await sequelize.query('SELECT id, manufacturer_id, style, type FROM manufacturer_catalog_data WHERE id = ?', { replacements: [catalogDataId] });
		if (!item) return res.status(404).json({ message: 'Catalog item not found' });

		const manufacturerId = item.manufacturer_id;
		const [rows] = await sequelize.query(`
			SELECT a.*, t.id AS t_id, t.name AS t_name, t.price_cents, t.fields_config, t.sample_image, t.is_ready,
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
