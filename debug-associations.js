const { UserGroup, UserGroupMultiplier } = require('./models');

async function debugAssociations() {
    console.log('🔍 Debugging Database Associations\n');
    
    try {
        console.log('📋 UserGroups:');
        const groups = await UserGroup.findAll({ 
            attributes: ['id', 'name'],
            order: [['id', 'ASC']]
        });
        groups.forEach(g => console.log(`  ID: ${g.id}, Name: ${g.name}`));
        
        console.log('\n🔢 UserGroupMultipliers:');
        const multipliers = await UserGroupMultiplier.findAll({ 
            attributes: ['id', 'user_group_id', 'multiplier', 'enabled'],
            order: [['id', 'ASC']]
        });
        multipliers.forEach(m => console.log(`  ID: ${m.id}, GroupID: ${m.user_group_id}, Multiplier: ${m.multiplier}, Enabled: ${m.enabled}`));
        
        console.log('\n🔗 Testing Association:');
        const testAssociation = await UserGroupMultiplier.findAll({
            include: [{
                model: UserGroup,
                attributes: ['id', 'name'],
                required: false
            }],
            limit: 3
        });
        
        testAssociation.forEach(m => {
            const groupName = m.UserGroup ? m.UserGroup.name : 'NULL';
            console.log(`  Multiplier ${m.id} → Group: ${groupName} (ID: ${m.user_group_id})`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

debugAssociations().then(() => process.exit(0));
