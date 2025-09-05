const sequelize = require('./config/db');

async function auditModificationData() {
  try {
    console.log('🔍 Running modification data audit...\n');

    // 1. Check templates table structure
    console.log('1. Checking templates table structure:');
    const [templateFields] = await sequelize.query('DESCRIBE global_modification_templates');
    const hasIsBlueprint = templateFields.some(f => f.Field === 'is_blueprint');
    const hasManufacturerId = templateFields.some(f => f.Field === 'manufacturer_id');
    const hasPriceCents = templateFields.some(f => f.Field === 'price_cents');
    const hasDefaultPrice = templateFields.some(f => f.Field === 'default_price');

    console.log(`   - is_blueprint field: ${hasIsBlueprint ? '✅' : '❌'}`);
    console.log(`   - manufacturer_id field: ${hasManufacturerId ? '✅' : '❌'}`);
    console.log(`   - price_cents field: ${hasPriceCents ? '✅' : '❌'}`);
    console.log(`   - default_price field: ${hasDefaultPrice ? '⚠️  (should be removed)' : '✅'}`);

    if (!hasIsBlueprint || !hasManufacturerId || !hasPriceCents) {
      console.log('❌ Schema migration incomplete. Run the migration first.');
      return;
    }

    // 2. Check categories table structure
    console.log('\n2. Checking categories table structure:');
    const [categoryFields] = await sequelize.query('DESCRIBE global_modification_categories');
    const hasScope = categoryFields.some(f => f.Field === 'scope');
    const hasCatManufacturerId = categoryFields.some(f => f.Field === 'manufacturer_id');

    console.log(`   - scope field: ${hasScope ? '✅' : '❌'}`);
    console.log(`   - manufacturer_id field: ${hasCatManufacturerId ? '✅' : '❌'}`);

    // 3. Count current data
    console.log('\n3. Current data counts:');
    const [[templateCount]] = await sequelize.query('SELECT COUNT(*) AS count FROM global_modification_templates');
    const [[categoryCount]] = await sequelize.query('SELECT COUNT(*) AS count FROM global_modification_categories');
    const [[assignmentCount]] = await sequelize.query('SELECT COUNT(*) AS count FROM global_modification_assignments');

    console.log(`   - Templates: ${templateCount.count}`);
    console.log(`   - Categories: ${categoryCount.count}`);
    console.log(`   - Assignments: ${assignmentCount.count}`);

    // 4. Audit for invalid template rows
    console.log('\n4. Auditing templates for invalid data:');

    // Orphaned manufacturer mods (is_blueprint=0 but no manufacturer_id)
    const [[orphanedMods]] = await sequelize.query(`
      SELECT COUNT(*) AS count FROM global_modification_templates
      WHERE (is_blueprint = 0 OR is_blueprint IS NULL) AND manufacturer_id IS NULL
    `);
    console.log(`   - Orphaned manufacturer mods (no manufacturer_id): ${orphanedMods.count}`);

    // Mis-scoped blueprints (is_blueprint=1 but has manufacturer_id)
    const [[misscoped_blueprints]] = await sequelize.query(`
      SELECT COUNT(*) AS count FROM global_modification_templates
      WHERE is_blueprint = 1 AND manufacturer_id IS NOT NULL
    `);
    console.log(`   - Mis-scoped blueprints (has manufacturer_id): ${misscoped_blueprints.count}`);

    // Blueprints with price
    const [[blueprintsWithPrice]] = await sequelize.query(`
      SELECT COUNT(*) AS count FROM global_modification_templates
      WHERE is_blueprint = 1 AND price_cents IS NOT NULL
    `);
    console.log(`   - Blueprints with price: ${blueprintsWithPrice.count}`);

    // Manufacturer mods without price
    const [[modsWithoutPrice]] = await sequelize.query(`
      SELECT COUNT(*) AS count FROM global_modification_templates
      WHERE (is_blueprint = 0 OR is_blueprint IS NULL) AND manufacturer_id IS NOT NULL AND price_cents IS NULL
    `);
    console.log(`   - Manufacturer mods without price: ${modsWithoutPrice.count}`);

    // Null is_blueprint flags
    const [[nullBlueprints]] = await sequelize.query(`
      SELECT COUNT(*) AS count FROM global_modification_templates
      WHERE is_blueprint IS NULL
    `);
    console.log(`   - Templates with null is_blueprint: ${nullBlueprints.count}`);

    // 5. Audit categories
    console.log('\n5. Auditing categories for invalid data:');

    if (hasScope) {
      // Categories with null scope
      const [[nullScope]] = await sequelize.query(`
        SELECT COUNT(*) AS count FROM global_modification_categories
        WHERE scope IS NULL
      `);
      console.log(`   - Categories with null scope: ${nullScope.count}`);

      // Gallery categories with manufacturer_id
      const [[galleryWithManu]] = await sequelize.query(`
        SELECT COUNT(*) AS count FROM global_modification_categories
        WHERE scope = 'gallery' AND manufacturer_id IS NOT NULL
      `);
      console.log(`   - Gallery categories with manufacturer_id: ${galleryWithManu.count}`);

      // Manufacturer categories without manufacturer_id
      const [[manuWithoutId]] = await sequelize.query(`
        SELECT COUNT(*) AS count FROM global_modification_categories
        WHERE scope = 'manufacturer' AND manufacturer_id IS NULL
      `);
      console.log(`   - Manufacturer categories without manufacturer_id: ${manuWithoutId.count}`);
    }

    // 6. Check for scope mismatches between templates and categories
    console.log('\n6. Checking template-category scope mismatches:');

    // Templates pointing to wrong category scope
    const [mismatchedScopes] = await sequelize.query(`
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
    console.log(`   - Templates with mismatched category scope: ${mismatchedScopes.length}`);

    if (mismatchedScopes.length > 0) {
      console.log('   Sample mismatches:');
      mismatchedScopes.slice(0, 3).forEach(m => {
        console.log(`     - Template "${m.template_name}" (blueprint=${m.is_blueprint}, manu=${m.template_manufacturer_id}) -> Category "${m.category_name}" (scope=${m.category_scope}, manu=${m.category_manufacturer_id})`);
      });
    }

    // 7. Summary
    console.log('\n📊 AUDIT SUMMARY:');
    const totalIssues = orphanedMods.count + misscoped_blueprints.count + blueprintsWithPrice.count +
                       modsWithoutPrice.count + nullBlueprints.count + mismatchedScopes.length;

    if (totalIssues === 0) {
      console.log('✅ No data issues found! System is clean.');
    } else {
      console.log(`❌ Found ${totalIssues} data issues that need repair.`);
      console.log('\nRun the repair script to fix these issues.');
    }

    console.log('\n🏁 Audit complete.');

  } catch (error) {
    console.error('❌ Audit failed:', error);
  }
}

if (require.main === module) {
  auditModificationData().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { auditModificationData };
