// Quick test script to verify multiplier pricing calculations
const { User, UserGroup, UserGroupMultiplier, ManufacturerCatalogData } = require('./models');

async function quickMultiplierTest() {
    console.log('🔍 Quick Multiplier Test\n');
    
    try {
        // Test 1: Check user groups and their multipliers
        console.log('📊 User Groups with Multipliers:');
        const groupsWithMultipliers = await UserGroupMultiplier.findAll({
            include: [{
                model: UserGroup,
                as: 'user_group',
                attributes: ['id', 'name'],
                required: false
            }]
        });
        
        if (groupsWithMultipliers.length === 0) {
            console.log('❌ No user group multipliers found!');
            console.log('💡 Go to User Group Multipliers page and set up multipliers first.');
            return;
        }
        
        groupsWithMultipliers.forEach(gm => {
            const status = gm.enabled ? '✅ Enabled' : '❌ Disabled';
            const groupName = gm.user_group?.name || 'Unknown';
            console.log(`   ${groupName}: ${gm.multiplier}x ${status}`);
        });
        
        // Test 2: Sample pricing calculations
        console.log('\n💰 Sample Pricing Calculations:');
        const sampleItem = await ManufacturerCatalogData.findOne({
            where: { price: { [require('sequelize').Op.gt]: 0 } }
        });
        
        if (!sampleItem) {
            console.log('❌ No catalog items found for testing');
            return;
        }
        
        const basePrice = parseFloat(sampleItem.price);
        console.log(`   Sample Item: ${sampleItem.code} - Base Price: $${basePrice.toFixed(2)}`);
        
        groupsWithMultipliers.forEach(gm => {
            if (gm.enabled) {
                const multipliedPrice = basePrice * parseFloat(gm.multiplier);
                const groupName = gm.user_group?.name || 'Unknown';
                console.log(`   ${groupName} sees: $${basePrice.toFixed(2)} × ${gm.multiplier} = $${multipliedPrice.toFixed(2)}`);
            }
        });
        
        // Test 3: Check if users exist in groups
        console.log('\n👥 Users in Groups:');
        const usersCount = await User.count({
            include: [{
                model: UserGroup,
                as: 'group',
                where: { id: { [require('sequelize').Op.in]: groupsWithMultipliers.map(gm => gm.user_group_id) } }
            }]
        });
        console.log(`   ${usersCount} users found in groups with multipliers`);
        
        // Test 4: API endpoint check
        console.log('\n🔌 Quick API Test:');
        const testUser = await User.findOne({
            include: [{
                model: UserGroup,
                as: 'group'
            }]
        });
        
        if (testUser && testUser.group_id) {
            const userMultiplier = await UserGroupMultiplier.findOne({
                where: { user_group_id: testUser.group_id, enabled: 1 },
                include: [{
                    model: UserGroup,
                    as: 'user_group',
                    required: false
                }]
            });
            
            if (userMultiplier) {
                console.log(`   ✅ User ${testUser.email} (${testUser.group?.name}) has multiplier: ${userMultiplier.multiplier}`);
            } else {
                console.log(`   ⚠️  User ${testUser.email} (${testUser.group?.name}) has no active multiplier`);
            }
        }
        
        console.log('\n🎯 To test in the app:');
        console.log('   1. Login as a contractor user');
        console.log('   2. Create a new proposal');
        console.log('   3. Add items to the proposal');
        console.log('   4. Check if prices are automatically multiplied');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run if called directly
if (require.main === module) {
    quickMultiplierTest().then(() => {
        process.exit(0);
    });
}

module.exports = { quickMultiplierTest };
