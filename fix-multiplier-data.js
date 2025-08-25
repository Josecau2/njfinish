// Script to fix multiplier data issues
const { UserGroup, UserGroupMultiplier } = require('./models');

async function fixMultiplierData() {
    console.log('🔧 Fixing User Group Multiplier Data...\n');
    
    try {
        // Step 1: Fix N/A multipliers
        console.log('1. Fixing N/A multipliers...');
        const naMultipliers = await UserGroupMultiplier.findAll({
            where: { multiplier: 'N/A' }
        });
        
        for (const multiplier of naMultipliers) {
            await multiplier.update({ multiplier: '1.0' });
            console.log(`   ✓ Fixed multiplier ID ${multiplier.id}: N/A → 1.0`);
        }
        
        // Step 2: Check associations
        console.log('\n2. Checking UserGroup associations...');
        const multipliersWithGroups = await UserGroupMultiplier.findAll({
            include: [{
                model: UserGroup,
                attributes: ['id', 'name'],
                required: false
            }]
        });
        
        console.log('\n📊 Current Multipliers:');
        multipliersWithGroups.forEach(gm => {
            const groupName = gm.UserGroup?.name || `Missing Group (ID: ${gm.user_group_id})`;
            const status = gm.enabled ? '✅ Enabled' : '❌ Disabled';
            console.log(`   ${groupName}: ${gm.multiplier}x ${status}`);
        });
        
        // Step 3: Check for orphaned multipliers
        console.log('\n3. Checking for orphaned multipliers...');
        const orphanedMultipliers = multipliersWithGroups.filter(gm => !gm.UserGroup);
        
        if (orphanedMultipliers.length > 0) {
            console.log(`⚠️  Found ${orphanedMultipliers.length} orphaned multipliers:`);
            for (const orphan of orphanedMultipliers) {
                console.log(`   ID ${orphan.id} references missing group_id ${orphan.user_group_id}`);
                
                // Try to find a valid group to assign it to
                const validGroup = await UserGroup.findOne({
                    where: { name: { [require('sequelize').Op.not]: 'Admin' } }
                });
                
                if (validGroup) {
                    console.log(`   → Reassigning to group "${validGroup.name}" (ID: ${validGroup.id})`);
                    await orphan.update({ user_group_id: validGroup.id });
                } else {
                    console.log(`   → Deleting orphaned multiplier`);
                    await orphan.destroy();
                }
            }
        } else {
            console.log('✓ No orphaned multipliers found');
        }
        
        // Step 4: Ensure all user groups have multiplier entries
        console.log('\n4. Ensuring all groups have multiplier entries...');
        const allGroups = await UserGroup.findAll({
            where: { name: { [require('sequelize').Op.not]: 'Admin' } }
        });
        
        for (const group of allGroups) {
            const existingMultiplier = await UserGroupMultiplier.findOne({
                where: { user_group_id: group.id }
            });
            
            if (!existingMultiplier) {
                await UserGroupMultiplier.create({
                    user_group_id: group.id,
                    multiplier: '1.0',
                    enabled: 0
                });
                console.log(`   ✓ Created multiplier entry for group "${group.name}"`);
            } else {
                console.log(`   ✓ Group "${group.name}" already has multiplier`);
            }
        }
        
        // Step 5: Final verification
        console.log('\n5. Final verification...');
        const finalCheck = await UserGroupMultiplier.findAll({
            include: [{
                model: UserGroup,
                attributes: ['id', 'name'],
                required: false
            }]
        });
        
        console.log('\n🎉 Final Multiplier Status:');
        finalCheck.forEach(gm => {
            const groupName = gm.UserGroup?.name || `Error: Missing Group`;
            const status = gm.enabled ? '✅ Enabled' : '❌ Disabled';
            const multiplier = parseFloat(gm.multiplier) || 'Invalid';
            console.log(`   ${groupName}: ${multiplier}x ${status}`);
        });
        
        console.log('\n✅ Multiplier data cleanup completed!');
        
    } catch (error) {
        console.error('❌ Error fixing multiplier data:', error.message);
    }
}

// Run if called directly
if (require.main === module) {
    fixMultiplierData().then(() => {
        process.exit(0);
    });
}

module.exports = { fixMultiplierData };
