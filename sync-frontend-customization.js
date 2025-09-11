const { Sequelize } = require('sequelize');
const sequelize = require('./config/db');
const Customization = require('./models/Customization');
const LoginCustomization = require('./models/LoginCustomization');
const { updateFrontendCustomization } = require('./utils/frontendConfigWriter');

/**
 * Initial Sync Script
 *
 * This script performs the initial migration from database-stored customization
 * to frontend-embedded customization. Run this once after implementing the
 * build-time embedding system.
 *
 * Usage: node sync-frontend-customization.js
 */

const syncFrontendCustomization = async () => {
  try {
    console.log('🔄 Starting frontend customization sync...');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Fetch current customization data
    const uiCustomization = await Customization.findOne({ order: [['updatedAt', 'DESC']] });
    const loginCustomization = await LoginCustomization.findOne({ where: { id: 1 } });

    console.log('📊 Current customization data:');
    console.log('  UI Customization:', uiCustomization ? 'Found' : 'Not found');
    console.log('  Login Customization:', loginCustomization ? 'Found' : 'Not found');

    // Prepare logo files
    const logoFiles = {};
    if (uiCustomization?.logoImage) {
      const logoPath = `.${uiCustomization.logoImage}`;
      console.log(`📁 UI Logo path: ${logoPath}`);
      logoFiles.main = logoPath;
    }

    // Update frontend configuration
    await updateFrontendCustomization(
      uiCustomization?.dataValues || {},
      loginCustomization?.dataValues || {},
      logoFiles
    );

    console.log('🎉 Frontend customization sync completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Restart your frontend development server');
    console.log('2. Test the login page and main app for instant loading');
    console.log('3. Verify that logos and colors load without flickering');
    console.log('4. The app now works without API calls for customization!');

  } catch (error) {
    console.error('❌ Error during sync:', error);
  } finally {
    await sequelize.close();
  }
};

// Run the sync
syncFrontendCustomization();
