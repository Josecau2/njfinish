/**
 * Production Setup Script
 * 
 * This script sets up all essential data needed for the NJ Cabinets application
 * to work properly in production environment.
 * 
 * Compatible with Windows, Linux, and macOS
 * 
 * Run this script after database sync to ensure all required data exists.
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const path = require('path');
const os = require('os');
const sequelize = require('./config/db');
const imageLogger = require('./utils/imageLogger');

// Import all required models
const {
    User,
    UserGroup,
    Location,
    Taxes,
    Customization,
    LoginCustomization,
    PdfCustomization,
    ResourceLink,
    Notification
} = require('./models');

class ProductionSetup {
    constructor() {
        this.results = {
            admin: false,
            adminGroup: false,
            defaultLocation: false,
            defaultTaxes: false,
            defaultCustomizations: false,
            defaultResources: false,
            errors: []
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : type === 'success' ? '✅' : '📝';
        console.log(`${prefix} [${timestamp}] ${message}`);
        
        // Also log to file in production
        if (process.env.NODE_ENV === 'production') {
            try {
                const fs = require('fs');
                const logDir = path.join(__dirname, 'logs');
                if (!fs.existsSync(logDir)) {
                    fs.mkdirSync(logDir, { recursive: true });
                }
                const logFile = path.join(logDir, 'setup-production.log');
                const logEntry = `${timestamp} [${type.toUpperCase()}] ${message}\n`;
                fs.appendFileSync(logFile, logEntry);
            } catch (error) {
                // Silent fail for logging errors
            }
        }
    }

    async createAdminUser() {
        this.log('Creating/updating admin user...');
        
        try {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            const [adminUser, created] = await User.findOrCreate({
                where: { email: 'joseca@symmetricalwolf.com' },
                defaults: {
                    name: 'Joseca Admin',
                    email: 'joseca@symmetricalwolf.com',
                    password: hashedPassword,
                    role: 'Admin',
                    role_id: 2, // Admin role ID
                    location: '1',
                    group_id: 2, // Admin group ID
                    isSalesRep: false,
                    isDeleted: false,
                    isActive: 'true'
                }
            });

            if (!created) {
                // Update existing admin user
                await adminUser.update({
                    password: hashedPassword,
                    role: 'Admin',
                    role_id: 2,
                    group_id: 2,
                    isActive: 'true',
                    isDeleted: false
                });
                this.log('Admin user updated successfully', 'success');
            } else {
                this.log('Admin user created successfully', 'success');
            }

            this.log(`Admin credentials: joseca@symmetricalwolf.com / admin123`);
            this.results.admin = true;
            return adminUser;

        } catch (error) {
            this.log(`Failed to create admin user: ${error.message}`, 'error');
            this.results.errors.push(`Admin user creation failed: ${error.message}`);
            return null;
        }
    }

    async createAdminGroup() {
        this.log('Creating admin user group...');
        
        try {
            const [adminGroup, created] = await UserGroup.findOrCreate({
                where: { id: 2 },
                defaults: {
                    id: 2,
                    name: 'Admin Group',
                    group_type: 'standard',
                    modules: {
                        dashboard: true,
                        proposals: true,
                        customers: true,
                        resources: true,
                        manufacturers: true,
                        settings: true,
                        users: true,
                        reports: true
                    },
                    contractor_settings: null
                }
            });

            if (!created) {
                // Update existing admin group to ensure all modules are enabled
                await adminGroup.update({
                    modules: {
                        dashboard: true,
                        proposals: true,
                        customers: true,
                        resources: true,
                        manufacturers: true,
                        settings: true,
                        users: true,
                        reports: true
                    }
                });
                this.log('Admin group updated successfully', 'success');
            } else {
                this.log('Admin group created successfully', 'success');
            }

            this.results.adminGroup = true;
            return adminGroup;

        } catch (error) {
            this.log(`Failed to create admin group: ${error.message}`, 'error');
            this.results.errors.push(`Admin group creation failed: ${error.message}`);
            return null;
        }
    }

    async createDefaultLocation() {
        this.log('Creating default location...');
        
        try {
            const [defaultLocation, created] = await Location.findOrCreate({
                where: { id: 1 },
                defaults: {
                    id: 1,
                    locationName: 'NJ Cabinets HQ',
                    address: '123 Main Street, Newark, NJ 07102',
                    website: 'https://njcabinets.com',
                    email: 'info@njcabinets.com',
                    phone: '+1 (973) 555-0123',
                    country: 'United States',
                    timezone: 'America/New_York',
                    isDeleted: false
                }
            });

            if (created) {
                this.log('Default location created successfully', 'success');
            } else {
                this.log('Default location already exists');
            }

            this.results.defaultLocation = true;
            return defaultLocation;

        } catch (error) {
            this.log(`Failed to create default location: ${error.message}`, 'error');
            this.results.errors.push(`Default location creation failed: ${error.message}`);
            return null;
        }
    }

    async createDefaultTaxes() {
        this.log('Creating default tax configurations...');
        
        try {
            const defaultTaxes = [
                { label: 'New Jersey Sales Tax', value: 6.625, isDefault: true },
                { label: 'No Tax', value: 0.00, isDefault: false },
                { label: 'Custom Tax Rate', value: 7.50, isDefault: false }
            ];

            for (const taxData of defaultTaxes) {
                const [tax, created] = await Taxes.findOrCreate({
                    where: { label: taxData.label },
                    defaults: taxData
                });

                if (created) {
                    this.log(`Created tax: ${taxData.label} (${taxData.value}%)`, 'success');
                } else {
                    this.log(`Tax already exists: ${taxData.label}`);
                }
            }

            this.results.defaultTaxes = true;

        } catch (error) {
            this.log(`Failed to create default taxes: ${error.message}`, 'error');
            this.results.errors.push(`Default taxes creation failed: ${error.message}`);
        }
    }

    async createDefaultCustomizations() {
        this.log('Creating default customizations...');
        
        try {
            // Login customization
            const [loginCustomization, loginCreated] = await LoginCustomization.findOrCreate({
                where: { id: 1 },
                defaults: {
                    id: 1,
                    logoPath: null,
                    welcomeMessage: 'Welcome to NJ Cabinets',
                    footerText: '© 2024 NJ Cabinets. All rights reserved.',
                    primaryColor: '#0066cc',
                    secondaryColor: '#f8f9fa',
                    isActive: true
                }
            });

            if (loginCreated) {
                this.log('Login customization created successfully', 'success');
            } else {
                this.log('Login customization already exists');
            }

            // PDF customization
            const [pdfCustomization, pdfCreated] = await PdfCustomization.findOrCreate({
                where: { id: 1 },
                defaults: {
                    id: 1,
                    companyName: 'NJ Cabinets',
                    companyLogo: null,
                    headerColor: '#0066cc',
                    footerText: 'Thank you for choosing NJ Cabinets',
                    showTermsAndConditions: true,
                    termsAndConditions: 'Standard terms and conditions apply.',
                    isActive: true
                }
            });

            if (pdfCreated) {
                this.log('PDF customization created successfully', 'success');
            } else {
                this.log('PDF customization already exists');
            }

            // General customization
            const [customization, customCreated] = await Customization.findOrCreate({
                where: { id: 1 },
                defaults: {
                    id: 1,
                    companyName: 'NJ Cabinets',
                    logo: null,
                    primaryColor: '#0066cc',
                    secondaryColor: '#f8f9fa',
                    isActive: true
                }
            });

            if (customCreated) {
                this.log('General customization created successfully', 'success');
            } else {
                this.log('General customization already exists');
            }

            this.results.defaultCustomizations = true;

        } catch (error) {
            this.log(`Failed to create default customizations: ${error.message}`, 'error');
            this.results.errors.push(`Default customizations creation failed: ${error.message}`);
        }
    }

    async createDefaultResources() {
        this.log('Creating default resource links...');
        
        try {
            const defaultResources = [
                {
                    title: 'User Manual',
                    url: 'https://docs.njcabinets.com/user-manual',
                    type: 'pdf',
                    visible_to_group_types: ['contractor', 'standard'],
                    isActive: true
                },
                {
                    title: 'Installation Guide',
                    url: 'https://docs.njcabinets.com/installation-guide',
                    type: 'pdf',
                    visible_to_group_types: ['contractor'],
                    isActive: true
                },
                {
                    title: 'Contact Support',
                    url: 'mailto:support@njcabinets.com',
                    type: 'link',
                    visible_to_group_types: ['contractor', 'standard'],
                    isActive: true
                }
            ];

            for (const resourceData of defaultResources) {
                const [resource, created] = await ResourceLink.findOrCreate({
                    where: { title: resourceData.title },
                    defaults: resourceData
                });

                if (created) {
                    this.log(`Created resource: ${resourceData.title}`, 'success');
                } else {
                    this.log(`Resource already exists: ${resourceData.title}`);
                }
            }

            this.results.defaultResources = true;

        } catch (error) {
            this.log(`Failed to create default resources: ${error.message}`, 'error');
            this.results.errors.push(`Default resources creation failed: ${error.message}`);
        }
    }

    async ensureDirectories() {
        this.log('Ensuring required directories exist...');
        
        try {
            const { checkProductionImageSetup } = require('./check-production-setup');
            const success = checkProductionImageSetup();
            
            if (success) {
                this.log('All required directories are ready', 'success');
            } else {
                this.log('Some directory issues detected', 'warn');
            }

        } catch (error) {
            this.log(`Directory check failed: ${error.message}`, 'error');
            this.results.errors.push(`Directory setup failed: ${error.message}`);
        }
    }

    async runMigrations() {
        this.log('Running image migrations...');
        
        try {
            const { migrateManufacturerImages } = require('./migrate-manufacturer-images');
            await migrateManufacturerImages();
            this.log('Image migrations completed successfully', 'success');

        } catch (error) {
            this.log(`Image migration failed: ${error.message}`, 'error');
            this.results.errors.push(`Image migration failed: ${error.message}`);
        }
    }

    async runFullSetup() {
        this.log('🚀 Starting automatic production setup...\n');
        
        try {
            // Ensure database connection
            await sequelize.authenticate();
            this.log('Database connection established successfully', 'success');

            // Sync database (but don't force, to preserve existing data)
            await sequelize.sync({ alter: false });
            this.log('Database synchronization completed', 'success');

            // Run all setup steps silently for automatic deployment
            const setupSteps = [
                { name: 'Admin Group', method: this.createAdminGroup },
                { name: 'Admin User', method: this.createAdminUser },
                { name: 'Default Location', method: this.createDefaultLocation },
                { name: 'Default Taxes', method: this.createDefaultTaxes },
                { name: 'Default Customizations', method: this.createDefaultCustomizations },
                { name: 'Default Resources', method: this.createDefaultResources },
                { name: 'Directory Setup', method: this.ensureDirectories },
                { name: 'Image Migrations', method: this.runMigrations }
            ];

            for (const step of setupSteps) {
                await step.method.call(this);
            }

            if (this.results.errors.length === 0) {
                this.log('✅ Production setup completed successfully!', 'success');
                
                // Only show credentials in production setup, not during build
                if (process.env.SHOW_ADMIN_CREDENTIALS !== 'false') {
                    this.log('\n🔑 ADMIN CREDENTIALS: joseca@symmetricalwolf.com / admin123');
                    this.log('⚠️  Change password after first login!');
                }
                
                imageLogger.log('PRODUCTION_SETUP', { 
                    status: 'success', 
                    timestamp: new Date().toISOString(),
                    environment: process.env.NODE_ENV 
                });
                return true;
            } else {
                this.log('⚠️ Production setup completed with some warnings.', 'warn');
                imageLogger.log('PRODUCTION_SETUP', { 
                    status: 'partial_success', 
                    errors: this.results.errors,
                    timestamp: new Date().toISOString(),
                    environment: process.env.NODE_ENV 
                });
                return true; // Still return true for warnings, not hard failures
            }

        } catch (error) {
            this.log(`❌ Production setup failed: ${error.message}`, 'error');
            imageLogger.logError('PRODUCTION_SETUP', error, { 
                environment: process.env.NODE_ENV 
            });
            
            // In automatic build mode, don't fail the entire build for setup issues
            if (process.env.BUILD_MODE === 'automatic') {
                this.log('⚠️ Continuing build despite setup issues...', 'warn');
                return true;
            }
            throw error;
        }
    }

    printSummary() {
        this.log('\n📊 PRODUCTION SETUP SUMMARY');
        this.log('='.repeat(50));
        
        const steps = [
            { name: 'Admin User', status: this.results.admin },
            { name: 'Admin Group', status: this.results.adminGroup },
            { name: 'Default Location', status: this.results.defaultLocation },
            { name: 'Default Taxes', status: this.results.defaultTaxes },
            { name: 'Default Customizations', status: this.results.defaultCustomizations },
            { name: 'Default Resources', status: this.results.defaultResources }
        ];

        steps.forEach(step => {
            const status = step.status ? '✅ READY' : '❌ FAILED';
            this.log(`${step.name.padEnd(25)} ${status}`);
        });

        this.log('='.repeat(50));

        if (this.results.errors.length > 0) {
            this.log('\n🔧 ERRORS TO REVIEW:');
            this.results.errors.forEach((error, index) => {
                this.log(`${index + 1}. ${error}`, 'error');
            });
        }

        this.log('\n📝 ADMIN LOGIN CREDENTIALS:');
        this.log('   Email: joseca@symmetricalwolf.com');
        this.log('   Password: admin123');
        this.log('   Role: Admin');
        
        this.log('\n🔒 SECURITY REMINDER:');
        this.log('   - Change the admin password after first login');
        this.log('   - Update the default location information');
        this.log('   - Review and customize tax settings for your region');
        this.log('   - Set up proper backup procedures');
    }
}

// Main execution
async function runProductionSetup() {
    // Set build mode for automatic deployment
    process.env.BUILD_MODE = 'automatic';
    process.env.SHOW_ADMIN_CREDENTIALS = 'false';
    
    const setup = new ProductionSetup();
    
    try {
        const success = await setup.runFullSetup();
        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error('❌ Fatal setup error:', error);
        
        // In automatic build mode, don't fail the build for database connection issues
        if (process.env.BUILD_MODE === 'automatic' && error.name === 'ConnectionError') {
            console.log('⚠️ Database not ready during build. Setup will run on first app start.');
            process.exit(0);
        }
        
        process.exit(1);
    } finally {
        try {
            await sequelize.close();
        } catch (error) {
            // Ignore connection close errors during build
        }
    }
}

// Run setup if this file is executed directly
if (require.main === module) {
    runProductionSetup();
}

module.exports = { ProductionSetup };
