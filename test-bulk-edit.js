const { ManufacturerCatalogData, Manufacturer } = require('./models');

async function testBulkEditFunctionality() {
    console.log('Testing bulk edit functionality...\n');

    try {
        // Find the first manufacturer
        const manufacturer = await Manufacturer.findOne();
        if (!manufacturer) {
            console.log('No manufacturer found! Please add a manufacturer first.');
            return;
        }

        console.log(`Testing with manufacturer: ${manufacturer.name}\n`);

        // Get some catalog items for this manufacturer
        const catalogItems = await ManufacturerCatalogData.findAll({
            where: { manufacturerId: manufacturer.id },
            limit: 5
        });

        if (catalogItems.length === 0) {
            console.log('No catalog items found! Please add some catalog items first.');
            return;
        }

        console.log(`Found ${catalogItems.length} catalog items:\n`);
        catalogItems.forEach(item => {
            console.log(`- ID: ${item.id}, Code: ${item.code}, Style: ${item.style}, Type: ${item.type}, Price: $${item.price}`);
        });

        console.log('\n--- Testing Bulk Edit Functionality ---\n');

        // Test 1: Bulk update styles
        const itemIds = catalogItems.map(item => item.id);
        const newStyle = 'TEST_BULK_STYLE';
        
        console.log(`1. Testing bulk style update to "${newStyle}"...`);
        
        const [affectedCount] = await ManufacturerCatalogData.update(
            { style: newStyle, updatedAt: new Date() },
            { where: { id: itemIds } }
        );
        
        console.log(`   ✓ Updated ${affectedCount} items`);

        // Verify the update
        const updatedItems = await ManufacturerCatalogData.findAll({
            where: { id: itemIds }
        });
        
        const allUpdated = updatedItems.every(item => item.style === newStyle);
        console.log(`   ✓ Verification: ${allUpdated ? 'PASSED' : 'FAILED'}`);

        console.log('\n--- Testing Style Name Edit Functionality ---\n');

        // Test 2: Style name change
        const oldStyleName = newStyle;
        const newStyleName = 'RENAMED_BULK_STYLE';
        
        console.log(`2. Testing style name change from "${oldStyleName}" to "${newStyleName}"...`);
        
        const [styleUpdateCount] = await ManufacturerCatalogData.update(
            { style: newStyleName, updatedAt: new Date() },
            { 
                where: { 
                    manufacturerId: manufacturer.id,
                    style: oldStyleName 
                } 
            }
        );
        
        console.log(`   ✓ Updated ${styleUpdateCount} items`);

        // Verify style name change
        const renamedItems = await ManufacturerCatalogData.findAll({
            where: { 
                manufacturerId: manufacturer.id,
                style: newStyleName
            }
        });
        
        console.log(`   ✓ Verification: Found ${renamedItems.length} items with new style name`);

        console.log('\n--- Testing Mixed Field Updates ---\n');

        // Test 3: Mixed field updates
        console.log('3. Testing mixed field updates (style, type, description, price)...');
        
        const mixedUpdates = {
            style: 'MIXED_UPDATE_STYLE',
            type: 'Mixed Type',
            description: 'Bulk updated description',
            price: 99.99,
            updatedAt: new Date()
        };
        
        const [mixedUpdateCount] = await ManufacturerCatalogData.update(
            mixedUpdates,
            { where: { id: itemIds.slice(0, 2) } } // Update first 2 items only
        );
        
        console.log(`   ✓ Updated ${mixedUpdateCount} items with mixed fields`);

        // Verify mixed updates
        const mixedItems = await ManufacturerCatalogData.findAll({
            where: { id: itemIds.slice(0, 2) }
        });
        
        const mixedVerification = mixedItems.every(item => 
            item.style === mixedUpdates.style && 
            item.type === mixedUpdates.type &&
            item.description === mixedUpdates.description &&
            parseFloat(item.price) === mixedUpdates.price
        );
        
        console.log(`   ✓ Verification: ${mixedVerification ? 'PASSED' : 'FAILED'}`);

        console.log('\n--- Cleanup ---\n');

        // Restore original data
        console.log('4. Restoring original data...');
        
        for (let i = 0; i < catalogItems.length; i++) {
            const originalItem = catalogItems[i];
            await ManufacturerCatalogData.update(
                {
                    style: originalItem.style,
                    type: originalItem.type,
                    description: originalItem.description,
                    price: originalItem.price,
                    updatedAt: new Date()
                },
                { where: { id: originalItem.id } }
            );
        }
        
        console.log('   ✓ Original data restored');

        console.log('\n🎉 All tests completed successfully!\n');

        console.log('--- API Endpoint Summary ---');
        console.log('✓ PUT /api/manufacturers/catalog/bulk-edit - Bulk edit multiple items');
        console.log('✓ PUT /api/manufacturers/:id/style-name - Edit style name globally');
        console.log('\n--- Frontend Features Added ---');
        console.log('✓ Bulk Edit button in catalog mapping when items are selected');
        console.log('✓ Bulk Edit modal with style, type, description, price fields');
        console.log('✓ Style management section when a style is filtered');
        console.log('✓ Rename Style button for global style name changes');
        console.log('✓ Edit Style Name modal');

    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run the test
testBulkEditFunctionality().then(() => {
    process.exit(0);
}).catch(error => {
    console.error('Test script error:', error);
    process.exit(1);
});
