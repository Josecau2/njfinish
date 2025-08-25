const fs = require('fs');
const path = require('path');
const { Manufacturer } = require('./models');

async function migrateManufacturerImages() {
    console.log('🔄 Starting manufacturer image migration...');
    
    try {
        // Get all manufacturers with images
        const manufacturers = await Manufacturer.findAll({
            where: {
                image: {
                    [require('sequelize').Op.ne]: null
                }
            }
        });

        if (manufacturers.length === 0) {
            console.log('✅ No manufacturers with images found.');
            return;
        }

        // Create images directory if it doesn't exist
        const uploadsDir = path.resolve(__dirname, './uploads');
        const imagesDir = path.resolve(uploadsDir, 'images');
        const catalogsDir = path.resolve(uploadsDir, 'manufacturer_catalogs');

        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
            console.log('📁 Created images directory');
        }

        let movedCount = 0;
        let errorCount = 0;

        for (const manufacturer of manufacturers) {
            try {
                const oldPath = path.resolve(catalogsDir, manufacturer.image);
                const newPath = path.resolve(imagesDir, manufacturer.image);

                // Check if file exists in old location
                if (fs.existsSync(oldPath)) {
                    // Check if file already exists in new location
                    if (!fs.existsSync(newPath)) {
                        // Move the file
                        fs.copyFileSync(oldPath, newPath);
                        fs.unlinkSync(oldPath);
                        movedCount++;
                        console.log(`✅ Moved image for ${manufacturer.name}: ${manufacturer.image}`);
                    } else {
                        console.log(`⚠️  Image already exists in destination for ${manufacturer.name}: ${manufacturer.image}`);
                        // Remove the old file since new one exists
                        fs.unlinkSync(oldPath);
                    }
                } else {
                    console.log(`⚠️  Image not found in old location for ${manufacturer.name}: ${manufacturer.image}`);
                }
            } catch (error) {
                errorCount++;
                console.error(`❌ Error migrating image for ${manufacturer.name}:`, error.message);
            }
        }

        console.log(`\n📊 Migration Summary:`);
        console.log(`   Total manufacturers with images: ${manufacturers.length}`);
        console.log(`   Successfully moved: ${movedCount}`);
        console.log(`   Errors: ${errorCount}`);
        console.log('✅ Migration completed!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run the migration
if (require.main === module) {
    migrateManufacturerImages()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Migration error:', error);
            process.exit(1);
        });
}

module.exports = { migrateManufacturerImages };
