const { sequelize } = require('../models');

async function checkCatalogData() {
  try {
    const [results] = await sequelize.query('SELECT id, name, code FROM manufacturer_catalog_data LIMIT 5');
    console.log('Available catalog items:', results);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkCatalogData();
