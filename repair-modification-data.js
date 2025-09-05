const sequelize = require('./config/db');
const { auditModificationData } = require('./audit-modification-data');

async function repairModificationData() {
  try {
    console.log('🔧 Running modification data repair...\n');

    // Run audit first to show before state
    console.log('BEFORE REPAIR:');
    await auditModificationData();
    console.log('\n' + '='.repeat(60) + '\n');

    console.log('🔧 Starting repairs...\n');

    // 1. Fix orphaned manufacturer mods (no manufacturer_id)
    console.log('1. Fixing orphaned manufacturer mods...');

    // First, let's see what we have
    const [orphanedMods] = await sequelize.query(`
      SELECT id, name, category_id, is_blueprint, manufacturer_id
      FROM global_modification_templates
      WHERE (is_blueprint = 0 OR is_blueprint IS NULL) AND manufacturer_id IS NULL
      LIMIT 10
    `);

    if (orphanedMods.length > 0) {
      console.log(`   Found ${orphanedMods.length} orphaned mods (showing first 10):`);
      orphanedMods.forEach(mod => {
        console.log(`     - "${mod.name}" (id=${mod.id}, blueprint=${mod.is_blueprint})`);
      });

      // For orphaned mods, we need to either:
      // A) Convert them to blueprints (if they seem like templates)
      // B) Assign them to a manufacturer (if we know which one)
      // C) Delete them if they're clearly invalid

      // Strategy: Convert all orphaned mods to blueprints in gallery
      console.log('   Converting orphaned mods to blueprints...');

      // First ensure there's a default "Uncategorized" gallery category
      let [[uncategorizedGallery]] = await sequelize.query(`
        SELECT id FROM global_modification_categories
        WHERE scope = 'gallery' AND manufacturer_id IS NULL AND name = 'Uncategorized'
      `);

      if (!uncategorizedGallery) {
        console.log('   Creating "Uncategorized" gallery category...');
        const insertResult = await sequelize.query(`
          INSERT INTO global_modification_categories (name, scope, manufacturer_id, order_index, created_at, updated_at)
          VALUES ('Uncategorized', 'gallery', NULL, 999, NOW(), NOW())
        `);
        const meta = Array.isArray(insertResult) ? insertResult[1] : insertResult;
        const uncategorizedId = meta?.insertId;

        // Fetch the created category to get its ID
        [[uncategorizedGallery]] = await sequelize.query(`
          SELECT id FROM global_modification_categories
          WHERE scope = 'gallery' AND manufacturer_id IS NULL AND name = 'Uncategorized'
          ORDER BY id DESC LIMIT 1
        `);
      }

      if (!uncategorizedGallery?.id) {
        throw new Error('Failed to create or find Uncategorized gallery category');
      }

      // Convert orphaned mods to blueprints
      const updateResult = await sequelize.query(`
        UPDATE global_modification_templates
        SET
          is_blueprint = 1,
          manufacturer_id = NULL,
          price_cents = NULL,
          category_id = ?
        WHERE (is_blueprint = 0 OR is_blueprint IS NULL) AND manufacturer_id IS NULL
      `, { replacements: [uncategorizedGallery.id] });

      console.log(`   ✅ Converted ${updateResult[1]?.affectedRows || 0} orphaned mods to blueprints`);
    }

    // 2. Fix mis-scoped blueprints (has manufacturer_id)
    console.log('\n2. Fixing mis-scoped blueprints...');
    const [[misscopedCount]] = await sequelize.query(`
      SELECT COUNT(*) AS count FROM global_modification_templates
      WHERE is_blueprint = 1 AND manufacturer_id IS NOT NULL
    `);

    if (misscopedCount.count > 0) {
      console.log(`   Found ${misscopedCount.count} mis-scoped blueprints`);
      await sequelize.query(`
        UPDATE global_modification_templates
        SET manufacturer_id = NULL, price_cents = NULL
        WHERE is_blueprint = 1 AND manufacturer_id IS NOT NULL
      `);
      console.log(`   ✅ Fixed mis-scoped blueprints`);
    } else {
      console.log('   ✅ No mis-scoped blueprints found');
    }

    // 3. Fix blueprints with price
    console.log('\n3. Fixing blueprints with price...');
    const [[blueprintPriceCount]] = await sequelize.query(`
      SELECT COUNT(*) AS count FROM global_modification_templates
      WHERE is_blueprint = 1 AND price_cents IS NOT NULL
    `);

    if (blueprintPriceCount.count > 0) {
      console.log(`   Found ${blueprintPriceCount.count} blueprints with price`);
      await sequelize.query(`
        UPDATE global_modification_templates
        SET price_cents = NULL
        WHERE is_blueprint = 1 AND price_cents IS NOT NULL
      `);
      console.log(`   ✅ Removed prices from blueprints`);
    } else {
      console.log('   ✅ No blueprints with price found');
    }

    // 4. Fix manufacturer mods without price
    console.log('\n4. Fixing manufacturer mods without price...');
    const [[modNoPriceCount]] = await sequelize.query(`
      SELECT COUNT(*) AS count FROM global_modification_templates
      WHERE (is_blueprint = 0 OR is_blueprint IS NULL) AND manufacturer_id IS NOT NULL AND price_cents IS NULL
    `);

    if (modNoPriceCount.count > 0) {
      console.log(`   Found ${modNoPriceCount.count} manufacturer mods without price`);
      await sequelize.query(`
        UPDATE global_modification_templates
        SET price_cents = 0
        WHERE (is_blueprint = 0 OR is_blueprint IS NULL) AND manufacturer_id IS NOT NULL AND price_cents IS NULL
      `);
      console.log(`   ✅ Set default price (0 cents) for manufacturer mods`);
    } else {
      console.log('   ✅ No manufacturer mods without price found');
    }

    // 5. Fix template-category scope mismatches
    console.log('\n5. Fixing template-category scope mismatches...');

    // Get mismatched templates
    const [mismatchedTemplates] = await sequelize.query(`
      SELECT
        t.id as template_id,
        t.name as template_name,
        t.is_blueprint,
        t.manufacturer_id as template_manufacturer_id,
        c.id as category_id,
        c.name as category_name,
        c.scope as category_scope,
        c.manufacturer_id as category_manufacturer_id
      FROM global_modification_templates t
      JOIN global_modification_categories c ON t.category_id = c.id
      WHERE
        (t.is_blueprint = 1 AND t.manufacturer_id IS NULL AND c.scope != 'gallery') OR
        (t.is_blueprint = 0 AND t.manufacturer_id IS NOT NULL AND c.scope != 'manufacturer') OR
        (t.is_blueprint = 0 AND t.manufacturer_id IS NOT NULL AND c.manufacturer_id != t.manufacturer_id)
    `);

    if (mismatchedTemplates.length > 0) {
      console.log(`   Found ${mismatchedTemplates.length} templates with mismatched categories`);

      for (const template of mismatchedTemplates) {
        if (template.is_blueprint === 1) {
          // Blueprint pointing to non-gallery category -> move to gallery
          let [[galleryCategory]] = await sequelize.query(`
            SELECT id FROM global_modification_categories
            WHERE scope = 'gallery' AND manufacturer_id IS NULL AND name = ?
          `, { replacements: [template.category_name] });

          if (!galleryCategory) {
            // Try to create gallery category with same name, or use a unique name if it exists
            let categoryName = template.category_name;
            let attempts = 0;

            while (!galleryCategory && attempts < 10) {
              try {
                const insertResult = await sequelize.query(`
                  INSERT INTO global_modification_categories (name, scope, manufacturer_id, order_index, created_at, updated_at)
                  VALUES (?, 'gallery', NULL, 0, NOW(), NOW())
                `, { replacements: [categoryName] });

                const meta = Array.isArray(insertResult) ? insertResult[1] : insertResult;
                galleryCategory = { id: meta?.insertId };
                break;
              } catch (e) {
                if (e.name === 'SequelizeUniqueConstraintError' || e.code === 'ER_DUP_ENTRY') {
                  attempts++;
                  categoryName = `${template.category_name} (${attempts})`;
                } else {
                  throw e;
                }
              }
            }

            if (!galleryCategory) {
              // Fallback: use the Uncategorized gallery category
              [[galleryCategory]] = await sequelize.query(`
                SELECT id FROM global_modification_categories
                WHERE scope = 'gallery' AND manufacturer_id IS NULL AND name = 'Uncategorized'
              `);
            }
          }

          if (!galleryCategory?.id) {
            console.log(`     ⚠️  Could not find or create gallery category for "${template.template_name}", skipping...`);
            continue;
          }

          await sequelize.query(`
            UPDATE global_modification_templates
            SET category_id = ?
            WHERE id = ?
          `, { replacements: [galleryCategory.id, template.template_id] });

          console.log(`     ✅ Moved blueprint "${template.template_name}" to gallery category`);
        } else {
          // Manufacturer mod pointing to wrong category -> move to manufacturer category
          let [[manuCategory]] = await sequelize.query(`
            SELECT id FROM global_modification_categories
            WHERE scope = 'manufacturer' AND manufacturer_id = ? AND name = ?
          `, { replacements: [template.template_manufacturer_id, template.category_name] });

          if (!manuCategory) {
            // Try to create manufacturer category with same name, or use a unique name if it exists
            let categoryName = template.category_name;
            let attempts = 0;

            while (!manuCategory && attempts < 10) {
              try {
                const insertResult = await sequelize.query(`
                  INSERT INTO global_modification_categories (name, scope, manufacturer_id, order_index, created_at, updated_at)
                  VALUES (?, 'manufacturer', ?, 0, NOW(), NOW())
                `, { replacements: [categoryName, template.template_manufacturer_id] });

                const meta = Array.isArray(insertResult) ? insertResult[1] : insertResult;
                manuCategory = { id: meta?.insertId };
                break;
              } catch (e) {
                if (e.name === 'SequelizeUniqueConstraintError' || e.code === 'ER_DUP_ENTRY') {
                  attempts++;
                  categoryName = `${template.category_name} (${attempts})`;
                } else {
                  throw e;
                }
              }
            }

            if (!manuCategory) {
              // Fallback: just use any existing manufacturer category for this manufacturer
              [[manuCategory]] = await sequelize.query(`
                SELECT id FROM global_modification_categories
                WHERE scope = 'manufacturer' AND manufacturer_id = ?
                LIMIT 1
              `, { replacements: [template.template_manufacturer_id] });
            }
          }

          if (!manuCategory?.id) {
            console.log(`     ⚠️  Could not find or create manufacturer category for "${template.template_name}", skipping...`);
            continue;
          }

          await sequelize.query(`
            UPDATE global_modification_templates
            SET category_id = ?
            WHERE id = ?
          `, { replacements: [manuCategory.id, template.template_id] });

          console.log(`     ✅ Moved manufacturer mod "${template.template_name}" to manufacturer category`);
        }
      }
    } else {
      console.log('   ✅ No mismatched template-category scopes found');
    }

    // 6. Clean up default_price column if it still exists
    console.log('\n6. Cleaning up legacy columns...');
    try {
      const [fields] = await sequelize.query('DESCRIBE global_modification_templates');
      const hasDefaultPrice = fields.some(f => f.Field === 'default_price');

      if (hasDefaultPrice) {
        console.log('   Removing legacy default_price column...');
        await sequelize.query('ALTER TABLE global_modification_templates DROP COLUMN default_price');
        console.log('   ✅ Removed default_price column');
      } else {
        console.log('   ✅ No legacy columns to clean up');
      }
    } catch (e) {
      console.log(`   ⚠️  Could not clean up legacy columns: ${e.message}`);
    }

    console.log('\n' + '='.repeat(60) + '\n');
    console.log('AFTER REPAIR:');
    await auditModificationData();

    console.log('\n🎉 Data repair completed!');

  } catch (error) {
    console.error('❌ Repair failed:', error);
    throw error;
  }
}

if (require.main === module) {
  repairModificationData().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { repairModificationData };
