require('dotenv').config();
const sequelize = require('../config/db');
// Ensure models and associations are loaded
require('../models');

async function main() {
	try {
		console.log('Connecting to database...');
		await sequelize.authenticate();
		console.log('Connected. Synchronizing schema with alter:true ...');
		await sequelize.sync({ alter: true });
		console.log('Done. Database schema is in sync with models.');
		process.exit(0);
	} catch (err) {
		console.error('Database sync failed:', err);
		process.exit(1);
	}
}

main();

