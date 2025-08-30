#!/usr/bin/env node
require('dotenv').config();
const { Umzug, SequelizeStorage } = require('umzug');
const path = require('path');
const sequelize = require('../config/db');
const { spawn } = require('child_process');
const env = require('../config/env');

// Ensure models are loaded for associations when needed by migrations
require('../models');

const umzug = new Umzug({
  migrations: { glob: path.join(__dirname, 'migrations', '*.js') },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, modelName: 'SequelizeMeta' }),
  logger: console,
});

async function run() {
  const cmd = process.argv[2] || 'up';
  await sequelize.authenticate();
  // Optional backup before migrations in production
  if (env.DB_BACKUP_ON_MIGRATE && process.env.NODE_ENV === 'production' && cmd === 'up') {
    try {
      const ts = new Date().toISOString().replace(/[:T]/g, '-').replace(/\..+/, '');
      const file = `backup-${process.env.DB_NAME || 'db'}-${ts}.sql`;
      console.log(`Backing up database to ${file} ...`);
      await new Promise((resolve, reject) => {
        const proc = spawn('sh', ['-lc', `mysqldump -h ${process.env.DB_HOST} -P ${process.env.DB_PORT || 3306} -u${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} > ${file}`], { stdio: 'inherit' });
        proc.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`mysqldump exit ${code}`)));
      });
    } catch (e) {
      console.warn('Database backup failed or mysqldump not available. Proceeding without backup.', e.message);
    }
  }
  if (cmd === 'up') {
    await umzug.up();
    console.log('Migrations applied.');
  } else if (cmd === 'down') {
    await umzug.down();
    console.log('Rolled back last migration.');
  } else if (cmd === 'status') {
    const executed = await umzug.executed();
    const pending = await umzug.pending();
    console.log('Executed:', executed.map(m => m.name));
    console.log('Pending:', pending.map(m => m.name));
  } else {
    console.error('Unknown command. Use: up|down|status');
    process.exit(1);
  }
  await sequelize.close();
}

run().catch(err => { console.error(err); process.exit(1); });
