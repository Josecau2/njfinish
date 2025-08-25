const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { Manufacturer } = require('./models');

class ProductionImageVerifier {
    constructor() {
        this.baseUrl = process.env.API_BASE_URL || 'http://localhost:8080';
        this.results = {
            directoryCheck: false,
            permissionsCheck: false,
            dbImageCheck: false,
            apiAccessCheck: false,
            errors: []
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : '✅';
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async checkDirectoryStructure() {
        this.log('Checking directory structure...');
        
        const requiredDirs = [
            './uploads',
            './uploads/images',
            './uploads/manufacturer_catalogs',
            './uploads/resources'
        ];

        try {
            for (const dir of requiredDirs) {
                const fullPath = path.resolve(__dirname, dir);
                if (!fs.existsSync(fullPath)) {
                    this.log(`Missing directory: ${dir}`, 'error');
                    this.results.errors.push(`Missing directory: ${dir}`);
                    return false;
                } else {
                    this.log(`Directory exists: ${dir}`);
                }
            }
            this.results.directoryCheck = true;
            return true;
        } catch (error) {
            this.log(`Directory check failed: ${error.message}`, 'error');
            this.results.errors.push(`Directory check failed: ${error.message}`);
            return false;
        }
    }

    async checkPermissions() {
        this.log('Checking directory permissions...');
        
        const testDirs = [
            './uploads/images',
            './uploads/manufacturer_catalogs',
            './uploads/resources'
        ];

        try {
            for (const dir of testDirs) {
                const fullPath = path.resolve(__dirname, dir);
                const testFile = path.join(fullPath, '.permission-test');
                
                try {
                    fs.writeFileSync(testFile, 'test');
                    fs.unlinkSync(testFile);
                    this.log(`Write permissions OK: ${dir}`);
                } catch (error) {
                    this.log(`No write permissions: ${dir}`, 'error');
                    this.results.errors.push(`No write permissions: ${dir}`);
                    return false;
                }
            }
            this.results.permissionsCheck = true;
            return true;
        } catch (error) {
            this.log(`Permission check failed: ${error.message}`, 'error');
            this.results.errors.push(`Permission check failed: ${error.message}`);
            return false;
        }
    }

    async checkDatabaseImages() {
        this.log('Checking database images...');
        
        try {
            const manufacturers = await Manufacturer.findAll({
                where: {
                    image: {
                        [require('sequelize').Op.ne]: null
                    }
                },
                attributes: ['id', 'name', 'image']
            });

            this.log(`Found ${manufacturers.length} manufacturers with images`);

            for (const manufacturer of manufacturers) {
                const imagePath = path.resolve(__dirname, 'uploads', 'images', manufacturer.image);
                if (!fs.existsSync(imagePath)) {
                    this.log(`Missing image file for ${manufacturer.name}: ${manufacturer.image}`, 'warn');
                    this.results.errors.push(`Missing image file for ${manufacturer.name}: ${manufacturer.image}`);
                } else {
                    this.log(`Image file exists for ${manufacturer.name}: ${manufacturer.image}`);
                }
            }

            this.results.dbImageCheck = true;
            return true;
        } catch (error) {
            this.log(`Database image check failed: ${error.message}`, 'error');
            this.results.errors.push(`Database image check failed: ${error.message}`);
            return false;
        }
    }

    async checkApiAccess() {
        this.log('Checking API access to images...');
        
        try {
            const manufacturers = await Manufacturer.findAll({
                where: {
                    image: {
                        [require('sequelize').Op.ne]: null
                    }
                },
                attributes: ['id', 'name', 'image'],
                limit: 3 // Test first 3 manufacturers
            });

            if (manufacturers.length === 0) {
                this.log('No manufacturers with images found for API test', 'warn');
                this.results.apiAccessCheck = true;
                return true;
            }

            for (const manufacturer of manufacturers) {
                const imageUrl = `${this.baseUrl}/uploads/images/${manufacturer.image}`;
                const accessible = await this.checkUrlAccessible(imageUrl);
                
                if (accessible) {
                    this.log(`API access OK for ${manufacturer.name}: ${imageUrl}`);
                } else {
                    this.log(`API access failed for ${manufacturer.name}: ${imageUrl}`, 'error');
                    this.results.errors.push(`API access failed for ${manufacturer.name}: ${imageUrl}`);
                    return false;
                }
            }

            this.results.apiAccessCheck = true;
            return true;
        } catch (error) {
            this.log(`API access check failed: ${error.message}`, 'error');
            this.results.errors.push(`API access check failed: ${error.message}`);
            return false;
        }
    }

    checkUrlAccessible(url) {
        return new Promise((resolve) => {
            const protocol = url.startsWith('https:') ? https : http;
            
            const request = protocol.get(url, (response) => {
                resolve(response.statusCode === 200);
            });

            request.on('error', () => {
                resolve(false);
            });

            request.setTimeout(5000, () => {
                request.destroy();
                resolve(false);
            });
        });
    }

    async runAllChecks() {
        this.log('🚀 Starting production image verification...\n');
        
        const checks = [
            { name: 'Directory Structure', method: this.checkDirectoryStructure },
            { name: 'Permissions', method: this.checkPermissions },
            { name: 'Database Images', method: this.checkDatabaseImages },
            { name: 'API Access', method: this.checkApiAccess }
        ];

        let allPassed = true;

        for (const check of checks) {
            this.log(`\n🔍 Running ${check.name} check...`);
            const passed = await check.method.call(this);
            if (!passed) {
                allPassed = false;
            }
        }

        this.printSummary(allPassed);
        return allPassed;
    }

    printSummary(success) {
        this.log('\n📊 VERIFICATION SUMMARY');
        this.log('='.repeat(50));
        
        const checks = [
            { name: 'Directory Structure', status: this.results.directoryCheck },
            { name: 'Permissions', status: this.results.permissionsCheck },
            { name: 'Database Images', status: this.results.dbImageCheck },
            { name: 'API Access', status: this.results.apiAccessCheck }
        ];

        checks.forEach(check => {
            const status = check.status ? '✅ PASS' : '❌ FAIL';
            this.log(`${check.name.padEnd(20)} ${status}`);
        });

        this.log('='.repeat(50));

        if (success) {
            this.log('🎉 ALL CHECKS PASSED! Production image setup is ready.', 'info');
        } else {
            this.log('❌ SOME CHECKS FAILED. Please review the errors above.', 'error');
            this.log('\n🔧 ERRORS TO FIX:');
            this.results.errors.forEach((error, index) => {
                this.log(`${index + 1}. ${error}`, 'error');
            });
        }

        this.log(`\n📝 Base URL used for testing: ${this.baseUrl}`);
        if (this.baseUrl.includes('localhost')) {
            this.log('💡 Tip: Set API_BASE_URL environment variable for production URL testing', 'warn');
        }
    }
}

// Run the verification
async function runVerification() {
    const verifier = new ProductionImageVerifier();
    
    try {
        const success = await verifier.runAllChecks();
        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error('❌ Verification failed with error:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    runVerification();
}

module.exports = { ProductionImageVerifier };
