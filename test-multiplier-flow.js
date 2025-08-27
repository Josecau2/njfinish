// Test script to verify the new multiplier flow is working correctly
const { Manufacturer, UserGroupMultiplier, UserGroup, ManufacturerCatalogData } = require('./models');

async function testMultiplierFlow() {
    console.log('🧪 Testing New Multiplier Flow\n');
    
    try {
        // Step 1: Get manufacturer with cost multiplier
        const manufacturer = await Manufacturer.findOne({
            where: { name: 'Jose Fleitas' },
            attributes: ['id', 'name', 'costMultiplier']
        });
        
        if (!manufacturer) {
            console.log('❌ No manufacturer found');
            return;
        }
        
        console.log('🏭 Manufacturer:', {
            id: manufacturer.id,
            name: manufacturer.name,
            costMultiplier: manufacturer.costMultiplier
        });
        
        // Step 2: Get a sample catalog item
        const catalogItem = await ManufacturerCatalogData.findOne({
            where: { 
                manufacturerId: manufacturer.id,
                price: { [require('sequelize').Op.gt]: 0 }
            },
            attributes: ['id', 'code', 'description', 'price', 'style']
        });
        
        if (!catalogItem) {
            console.log('❌ No catalog items found for manufacturer');
            return;
        }
        
        console.log('\n📦 Sample Catalog Item:', {
            id: catalogItem.id,
            code: catalogItem.code,
            description: catalogItem.description.substring(0, 50) + '...',
            basePrice: catalogItem.price,
            style: catalogItem.style
        });
        
        // Step 3: Get user group multipliers
        const userGroups = await UserGroupMultiplier.findAll({
            where: { enabled: 1 },
            include: [{
                model: UserGroup,
                as: 'user_group',
                attributes: ['id', 'name']
            }]
        });
        
        console.log('\n👥 Active User Group Multipliers:');
        userGroups.forEach(ug => {
            const groupName = ug.user_group?.name || 'Unknown';
            console.log(`   ${groupName}: ${ug.multiplier}x`);
        });
        
        // Step 4: Calculate pricing examples
        console.log('\n💰 Pricing Examples (Base Price: $' + catalogItem.price + '):\n');
        
        const basePrice = parseFloat(catalogItem.price);
        const manufacturerMultiplier = parseFloat(manufacturer.costMultiplier);
        
        userGroups.forEach(ug => {
            const groupName = ug.user_group?.name || 'Unknown';
            const userGroupMultiplier = parseFloat(ug.multiplier);
            
            // Apply manufacturer multiplier first, then user group multiplier
            const step1_manufacturerAdjusted = basePrice * manufacturerMultiplier;
            const step2_finalPrice = step1_manufacturerAdjusted * userGroupMultiplier;
            
            console.log(`   ${groupName}:`);
            console.log(`      Step 1: $${basePrice.toFixed(2)} × ${manufacturerMultiplier} = $${step1_manufacturerAdjusted.toFixed(2)}`);
            console.log(`      Step 2: $${step1_manufacturerAdjusted.toFixed(2)} × ${userGroupMultiplier} = $${step2_finalPrice.toFixed(2)}`);
            console.log(`      Final Price: $${step2_finalPrice.toFixed(2)}\n`);
        });
        
        // Step 5: Show what happens with Admin group (should be 1x multiplier)
        const adminGroup = await UserGroupMultiplier.findOne({
            where: { enabled: 1 },
            include: [{
                model: UserGroup,
                as: 'user_group',
                where: { name: 'Admin' }
            }]
        });
        
        if (adminGroup) {
            const adminMultiplier = parseFloat(adminGroup.multiplier);
            const adminStep1 = basePrice * manufacturerMultiplier;
            const adminFinal = adminStep1 * adminMultiplier;
            
            console.log('👨‍💼 Admin Pricing (should show cost):');
            console.log(`      Step 1: $${basePrice.toFixed(2)} × ${manufacturerMultiplier} = $${adminStep1.toFixed(2)}`);
            console.log(`      Step 2: $${adminStep1.toFixed(2)} × ${adminMultiplier} = $${adminFinal.toFixed(2)}`);
            console.log(`      Final Price: $${adminFinal.toFixed(2)}\n`);
        }
        
        console.log('✅ Multiplier flow test completed!');
        console.log('\n📋 Summary:');
        console.log('   1. Base prices come from manufacturer catalog');
        console.log('   2. Manufacturer cost multiplier is applied first (set in manufacturer settings)');
        console.log('   3. User group multiplier is applied second (set in user group multipliers)');
        console.log('   4. Admin should see cost (manufacturer multiplier only, user group = 1x)');
        console.log('   5. Contractors see final customer price (both multipliers applied)');
        
    } catch (error) {
        console.error('❌ Error testing multiplier flow:', error);
    }
}

// Run the test
if (require.main === module) {
    testMultiplierFlow().then(() => {
        process.exit(0);
    });
}

module.exports = { testMultiplierFlow };
