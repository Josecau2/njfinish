const fs = require('fs');
const path = require('path');
const env = require('./config/env');

function checkProductionImageSetup() {
    console.log('🔍 Checking production image setup...');
    
    const uploadsRoot = path.resolve(__dirname, env.UPLOAD_PATH);
    const imagesDir = path.resolve(uploadsRoot, 'images');
    const catalogsDir = path.resolve(uploadsRoot, 'manufacturer_catalogs');
    const resourcesDir = path.resolve(__dirname, env.RESOURCES_UPLOAD_DIR);

    const directories = [
        { name: 'Uploads Root', path: uploadsRoot },
        { name: 'Images', path: imagesDir },
        { name: 'Manufacturer Catalogs', path: catalogsDir },
        { name: 'Resources', path: resourcesDir }
    ];

    let allGood = true;

    directories.forEach(dir => {
        try {
            if (!fs.existsSync(dir.path)) {
                console.log(`📁 Creating missing directory: ${dir.name} at ${dir.path}`);
                fs.mkdirSync(dir.path, { recursive: true });
            } else {
                console.log(`✅ ${dir.name} directory exists: ${dir.path}`);
            }

            // Test write permissions
            const testFile = path.join(dir.path, '.write-test');
            try {
                fs.writeFileSync(testFile, 'test');
                fs.unlinkSync(testFile);
                console.log(`✅ ${dir.name} directory is writable`);
            } catch (error) {
                console.error(`❌ ${dir.name} directory is not writable:`, error.message);
                allGood = false;
            }

        } catch (error) {
            console.error(`❌ Error with ${dir.name} directory:`, error.message);
            allGood = false;
        }
    });

    // Check static serving routes
    console.log('\n🌐 Static serving configuration:');
    console.log(`   /uploads -> ${uploadsRoot}`);
    console.log(`   /uploads/images -> ${imagesDir}`);
    console.log(`   /uploads/manufacturer_catalogs -> ${catalogsDir}`);

    if (allGood) {
        console.log('\n✅ Production image setup is ready!');
    } else {
        console.log('\n❌ Production image setup has issues that need to be resolved!');
        process.exit(1);
    }

    return allGood;
}

// Environment variables check
function checkEnvironmentVariables() {
    console.log('\n🔧 Checking environment variables...');
    
    const requiredVars = [
        'NODE_ENV',
        'PORT'
    ];

    const optionalVars = [
        'UPLOAD_PATH',
        'RESOURCES_UPLOAD_DIR'
    ];

    requiredVars.forEach(varName => {
        if (process.env[varName]) {
            console.log(`✅ ${varName}: ${process.env[varName]}`);
        } else {
            console.log(`⚠️  ${varName}: Using default value`);
        }
    });

    optionalVars.forEach(varName => {
        if (process.env[varName]) {
            console.log(`✅ ${varName}: ${process.env[varName]}`);
        } else {
            console.log(`📝 ${varName}: Using default (${env[varName]})`);
        }
    });
}

// Run checks
if (require.main === module) {
    console.log('🚀 Production Environment Check\n');
    checkEnvironmentVariables();
    checkProductionImageSetup();
}

module.exports = { checkProductionImageSetup, checkEnvironmentVariables };
