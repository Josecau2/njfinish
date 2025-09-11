#!/usr/bin/env node
require('dotenv').config();
const { Umzug, SequelizeStorage } = require('umzug');
const path = require('path');
const fs = require('fs');
const sequelize = require('../config/db');
const { spawn } = require('child_process');
const env = require('../config/env');

// Ensure models are loaded for associations when needed by migrations
require('../models');

console.log('🚀 DOCKER MIGRATION SCRIPT');
console.log('=' .repeat(60));

const scriptsMigrationsPath = path.join(__dirname, 'migrations');

console.log('Migration directory:', scriptsMigrationsPath);

// Verify migrations directory exists
if (!fs.existsSync(scriptsMigrationsPath)) {
  console.error('❌ Migrations directory not found:', scriptsMigrationsPath);
  process.exit(1);
}

const migrationFiles = fs.readdirSync(scriptsMigrationsPath).filter(f => f.endsWith('.js'));
console.log(`📁 Found ${migrationFiles.length} migration files`);

const umzug = new Umzug({
  migrations: {
    glob: ['scripts/migrations/*.js', { cwd: path.join(__dirname, '..') }],
    resolve: ({ name, path: filePath, context }) => {
      const migration = require(filePath);
      // Validate shape; provide defensive no-op to avoid crash loops while surfacing warning once
      const hasUp = migration && typeof migration.up === 'function';
      const hasDown = migration && typeof migration.down === 'function';
      if (!hasUp) {
        console.warn(`[MIGRATE] Warning: migration ${name} has no exported up() function. Inserting no-op to preserve ordering.`);
      }
      return {
        name,
        up: async () => {
          console.log(`🔄 Running migration: ${name}`);
          if (hasUp) return migration.up(context, sequelize.Sequelize);
          // else no-op
          return Promise.resolve();
        },
        down: async () => {
          if (hasDown) return migration.down(context, sequelize.Sequelize);
          return Promise.resolve();
        },
      };
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, tableName: 'SequelizeMeta' }),
  logger: console,
});

async function run() {
  const cmd = process.argv[2] || 'up';

  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful');

    // Check current migration status
    const executed = await umzug.executed();
    const pending = await umzug.pending();

    console.log(`\n📊 Migration Status:`);
    console.log(`   - Executed: ${executed.length}`);
    console.log(`   - Pending: ${pending.length}`);

    if (pending.length === 0) {
      console.log('✅ All migrations are already applied');
    } else {
      console.log('\n📋 Pending migrations:');
      pending.forEach(m => console.log(`   - ${m.name}`));
    }

    // Optional backup before migrations in production
    if (env.DB_BACKUP_ON_MIGRATE && process.env.NODE_ENV === 'production' && cmd === 'up' && pending.length > 0) {
      try {
        // Check mysqldump availability first
        await new Promise((resolve, reject) => {
          const check = spawn('sh', ['-lc', 'command -v mysqldump >/dev/null 2>&1']);
          check.on('exit', (code) => code === 0 ? resolve() : reject(new Error('mysqldump-missing')));
        });
        const ts = new Date().toISOString().replace(/[:T]/g, '-').replace(/\..+/, '');
        const backupDir = process.env.BACKUP_DIR || '/app/backups';
        const file = `${backupDir}/backup-${process.env.DB_NAME || 'db'}-${ts}.sql`;
        console.log(`💾 Backing up database to ${file} ...`);
        await new Promise((resolve, reject) => {
          const proc = spawn('sh', ['-lc', `mysqldump -h ${process.env.DB_HOST} -P ${process.env.DB_PORT || 3306} -u${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} > ${file}`], { stdio: 'inherit' });
          proc.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`mysqldump exit ${code}`)));
        });
        console.log('✅ Database backup completed');
      } catch (e) {
        if (e.message === 'mysqldump-missing') {
          console.warn('[MIGRATE] Skipping backup: mysqldump not installed. Set DB_BACKUP_ON_MIGRATE=false to silence.');
        } else {
          console.warn('⚠️  Database backup failed. Proceeding without backup.', e.message);
        }
      }
    }

    if (cmd === 'up') {
      if (pending.length === 0) {
        console.log('✅ No migrations to run');
      } else {
        try {
          console.log('\n🚀 Running migrations...');
          await umzug.up();
          console.log('✅ All migrations applied successfully');
        } catch (err) {
          // Auto-skip idempotent structural errors to prevent crash loops
          const msg = String(err && err.message || '');
          const dupCol = msg.includes('Duplicate column name');
          const noTable = msg.includes("doesn't exist") && /global_modification_templates|global_modification_categories/.test(msg);
          const alreadyExists = msg.includes('already exists');

          if (dupCol || noTable || alreadyExists) {
            console.warn('[MIGRATE] Non-fatal duplication/missing prerequisite detected, treating as already applied:', msg);
            console.log('✅ Migrations completed with warnings');
          } else {
            console.error('❌ Migration failed:', err);
            throw err;
          }
        }
      }
    } else if (cmd === 'down') {
      await umzug.down();
      console.log('✅ Rolled back last migration');
    } else if (cmd === 'status') {
      console.log('\n📊 Migration Status:');
      console.log('Executed:', executed.map(m => m.name));
      console.log('Pending:', pending.map(m => m.name));
    } else {
      console.error('❌ Unknown command. Use: up|down|status');
      process.exit(1);
    }

    // Final verification
    if (cmd === 'up') {
      const finalExecuted = await umzug.executed();
      const finalPending = await umzug.pending();

      console.log('\n🎯 Final Status:');
      console.log(`   - Total executed: ${finalExecuted.length}`);
      console.log(`   - Remaining pending: ${finalPending.length}`);

      if (finalPending.length === 0) {
        console.log('✅ All migrations successfully applied!');
      } else {
        console.log('⚠️  Some migrations are still pending');
      }
    }

    await sequelize.close();
    console.log('\n🎉 Migration process completed');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

run().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
