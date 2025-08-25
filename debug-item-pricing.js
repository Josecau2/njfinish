// Debug script to check item b09 pricing in manufacturer catalog
const { ManufacturerCatalogData } = require('./models');

const checkItemPricing = async () => {
    try {
        console.log('🔍 Checking item b09 pricing...\n');

        // Find item b09
        const item = await ManufacturerCatalogData.findOne({
            where: { code: 'b09' }
        });

        if (!item) {
            console.log('❌ Item b09 not found in catalog');
            return;
        }

        console.log('📋 Item b09 Details:');
        console.log(`- ID: ${item.id}`);
        console.log(`- Code: ${item.code}`);
        console.log(`- Description: ${item.description}`);
        console.log(`- Price: $${item.price}`);
        console.log(`- Style: ${item.style}`);
        console.log(`- Manufacturer ID: ${item.manufacturerId}`);
        console.log(`- Category: ${item.category || 'N/A'}`);
        console.log(`- Assembly Fee: $${item.assemblyFee || 0}`);
        console.log(`- Created: ${item.createdAt}`);
        console.log(`- Updated: ${item.updatedAt}`);

        // Check if there are multiple items with this code (different manufacturers)
        const allB09Items = await ManufacturerCatalogData.findAll({
            where: { code: 'b09' }
        });

        if (allB09Items.length > 1) {
            console.log(`\n📊 Found ${allB09Items.length} items with code b09:`);
            allB09Items.forEach((item, index) => {
                console.log(`  ${index + 1}. ID ${item.id}: $${item.price} (Manufacturer ${item.manufacturerId})`);
            });
        }

    } catch (error) {
        console.error('Error checking item pricing:', error);
    }
};

// If this script is run directly
if (require.main === module) {
    checkItemPricing().then(() => {
        process.exit(0);
    });
}

module.exports = { checkItemPricing };
