require('dotenv').config();
const sequelize = require('../config/db');
const Terms = require('../models/Terms');
const TermsAcceptance = require('../models/TermsAcceptance');

async function main() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected. Creating/updating Terms tables...');
    // Create tables if missing; alter to apply non-destructive changes
    await Terms.sync({ alter: true });
    await TermsAcceptance.sync({ alter: true });
    console.log('Done. Terms and TermsAcceptance tables are ready.');
    process.exit(0);
  } catch (err) {
    console.error('Terms sync failed:', err);
    process.exit(1);
  }
}

main();
