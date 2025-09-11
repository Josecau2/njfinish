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
        // Allow override via env
        const override = process.env.STARTUP_MARKER_PATH;
        const primary = override || path.join(__dirname, '.production-setup-complete');
        // Fallback to a known writable directory (uploads or tmp) if EACCES encountered
        this._candidatePaths = [
            primary,
            path.join(__dirname, 'uploads', '.production-setup-complete'),
            path.join('/tmp', '.production-setup-complete')
        ];
        this.setupMarkerFile = this._resolveWritableMarker();
    }

    _resolveWritableMarker() {
        const fs = require('fs');
        for (const p of this._candidatePaths) {
            try {
                const dir = path.dirname(p);
                fs.mkdirSync(dir, { recursive: true });
                // test write
                const testFile = p + '.test';
                fs.writeFileSync(testFile, 'ok');
                fs.unlinkSync(testFile);
                return p;
            } catch (e) {
                // try next
            }
        }
        // As a last resort, return first path (will cause warnings but not crash)
        return this._candidatePaths[0];
    }

    async checkAndRunSetup() {
        try {
            // Check if setup has already been completed
            if (fs.existsSync(this.setupMarkerFile)) {
                console.log('✅ Production setup already completed');
                return true;
            }

            console.log('🔧 Running initial production setup...');

            // Run customization assets migration first
            try {
                const { migrateCustomizationAssets } = require('./migrate-customization-assets');
                await migrateCustomizationAssets();
            } catch (error) {
                console.warn('⚠️ Customization assets migration failed:', error.message);
                // Don't fail startup for this
            }

            // Import and run production setup
            const { ProductionSetup } = require('./setup-production');
            const setup = new ProductionSetup();

            // Set environment flags for startup mode
            process.env.BUILD_MODE = 'startup';
            process.env.SHOW_ADMIN_CREDENTIALS = 'true';

            const success = await setup.runFullSetup();

            if (success) {
                try {
                    fs.writeFileSync(this.setupMarkerFile, new Date().toISOString());
                    console.log('✅ Initial production setup completed successfully');
                } catch (e) {
                    if (e.code === 'EACCES') {
                        console.warn(`⚠️  Could not write setup marker (EACCES) at ${this.setupMarkerFile}. Startup will re-run setup steps next boot.`);
                    } else {
                        console.warn(`⚠️  Failed to write setup marker at ${this.setupMarkerFile}: ${e.message}`);
                    }
                }
            }

            return success;

        } catch (error) {
            if (error && error.code === 'EACCES') {
                console.warn('⚠️  Startup setup encountered EACCES (marker write). Continuing without marker.');
            } else {
                console.error('❌ Startup setup failed:', error.message);
            }

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
