#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function consolidateMigrations() {
  try {
    console.log('🔄 CONSOLIDATING MIGRATION FILES');
    console.log('=' .repeat(60));

    const rootMigrationsDir = path.join(__dirname, 'migrations');
    const scriptsMigrationsDir = path.join(__dirname, 'scripts', 'migrations');

    // Get all migration files from both directories
    const rootMigrations = fs.existsSync(rootMigrationsDir)
      ? fs.readdirSync(rootMigrationsDir).filter(f => f.endsWith('.js'))
      : [];

    const scriptsMigrations = fs.existsSync(scriptsMigrationsDir)
      ? fs.readdirSync(scriptsMigrationsDir).filter(f => f.endsWith('.js'))
      : [];

    console.log(`\n📁 Root migrations directory: ${rootMigrations.length} files`);
    rootMigrations.forEach(f => console.log(`  - ${f}`));

    console.log(`\n📁 Scripts migrations directory: ${scriptsMigrations.length} files`);
    scriptsMigrations.forEach(f => console.log(`  - ${f}`));

    // Check for duplicates
    const duplicates = [];
    const allMigrations = new Map();

    // Process root migrations
    rootMigrations.forEach(file => {
      const baseName = file.replace(/^(\d{8})[_-]/, '').replace(/\.js$/, '');
      if (allMigrations.has(baseName)) {
        duplicates.push({
          name: baseName,
          files: [allMigrations.get(baseName), path.join(rootMigrationsDir, file)]
        });
      } else {
        allMigrations.set(baseName, path.join(rootMigrationsDir, file));
      }
    });

    // Process scripts migrations
    scriptsMigrations.forEach(file => {
      const baseName = file.replace(/^(\d{8})[_-]/, '').replace(/\.js$/, '');
      if (allMigrations.has(baseName)) {
        if (!duplicates.find(d => d.name === baseName)) {
          duplicates.push({
            name: baseName,
            files: [allMigrations.get(baseName), path.join(scriptsMigrationsDir, file)]
          });
        } else {
          const existing = duplicates.find(d => d.name === baseName);
          existing.files.push(path.join(scriptsMigrationsDir, file));
        }
      } else {
        allMigrations.set(baseName, path.join(scriptsMigrationsDir, file));
      }
    });

    if (duplicates.length > 0) {
      console.log(`\n⚠️  DUPLICATE MIGRATIONS FOUND: ${duplicates.length}`);
      duplicates.forEach(dup => {
        console.log(`\n🔍 ${dup.name}:`);
        dup.files.forEach(file => console.log(`   - ${file}`));
      });
    }

    // Move all root migrations to scripts/migrations if they don't exist there
    console.log('\n🔄 CONSOLIDATION PLAN:');
    let moved = 0;

    for (const file of rootMigrations) {
      const sourcePath = path.join(rootMigrationsDir, file);
      const targetPath = path.join(scriptsMigrationsDir, file);

      if (!fs.existsSync(targetPath)) {
        console.log(`   Moving: ${file} -> scripts/migrations/`);

        // Ensure target directory exists
        if (!fs.existsSync(scriptsMigrationsDir)) {
          fs.mkdirSync(scriptsMigrationsDir, { recursive: true });
        }

        // Copy file
        fs.copyFileSync(sourcePath, targetPath);
        moved++;

        // Remove original
        fs.unlinkSync(sourcePath);
      } else {
        console.log(`   Skipping: ${file} (already exists in scripts/migrations/)`);
      }
    }

    // Clean up root migrations directory if empty
    if (fs.existsSync(rootMigrationsDir)) {
      const remainingFiles = fs.readdirSync(rootMigrationsDir).filter(f => f.endsWith('.js'));
      if (remainingFiles.length === 0) {
        const nonJsFiles = fs.readdirSync(rootMigrationsDir);
        if (nonJsFiles.length === 0) {
          console.log('   Removing empty migrations directory');
          fs.rmdirSync(rootMigrationsDir);
        }
      }
    }

    console.log(`\n✅ CONSOLIDATION COMPLETE`);
    console.log(`   Files moved: ${moved}`);
    console.log(`   Total migrations: ${fs.readdirSync(scriptsMigrationsDir).filter(f => f.endsWith('.js')).length}`);

    console.log('\n🎯 NEXT STEPS:');
    console.log('   1. All migrations are now in scripts/migrations/');
    console.log('   2. Update Dockerfile to ensure migrations run on container start');
    console.log('   3. Run database sync verification');

  } catch (error) {
    console.error('❌ Error consolidating migrations:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  consolidateMigrations();
}

module.exports = consolidateMigrations;
