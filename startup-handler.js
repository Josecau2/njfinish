/**
 * App Startup Handler
 * 
 * This module ensures that production setup runs automatically when the app starts
 * if it hasn't been run yet or if the database is empty.
 */

const fs = require('fs');
const path = require('path');

class AppStartupHandler {
    constructor() {
        this.setupMarkerFile = path.join(__dirname, '.production-setup-complete');
    }

    async checkAndRunSetup() {
        try {
            // Check if setup has already been completed
            if (fs.existsSync(this.setupMarkerFile)) {
                console.log('✅ Production setup already completed');
                return true;
            }

            console.log('🔧 Running initial production setup...');
            
            // Import and run production setup
            const { ProductionSetup } = require('./setup-production');
            const setup = new ProductionSetup();
            
            // Set environment flags for startup mode
            process.env.BUILD_MODE = 'startup';
            process.env.SHOW_ADMIN_CREDENTIALS = 'true';
            
            const success = await setup.runFullSetup();
            
            if (success) {
                // Create marker file to indicate setup is complete
                fs.writeFileSync(this.setupMarkerFile, new Date().toISOString());
                console.log('✅ Initial production setup completed successfully');
            }
            
            return success;
            
        } catch (error) {
            console.error('❌ Startup setup failed:', error.message);
            
            // Don't fail app startup if setup fails - app might still work
            if (error.name === 'ConnectionError') {
                console.log('⚠️ Database connection failed. App will start but may need manual setup.');
            }
            
            return false;
        }
    }

    isSetupComplete() {
        return fs.existsSync(this.setupMarkerFile);
    }

    resetSetup() {
        if (fs.existsSync(this.setupMarkerFile)) {
            fs.unlinkSync(this.setupMarkerFile);
            console.log('🔄 Production setup marker reset');
        }
    }
}

module.exports = new AppStartupHandler();
