// Debug script to check contractor group multiplier settings
const { UserGroup, UserGroupMultiplier } = require('./models');

const checkContractorMultipliers = async () => {
    try {
        console.log('🔍 Checking contractor group multipliers...\n');

        // Find the "Acme Contractors" group (contractor group ID 12)
        const contractorGroup = await UserGroup.findByPk(12, {
            include: [{
                model: UserGroupMultiplier,
                required: false
            }]
        });

        if (!contractorGroup) {
            console.log('❌ Contractor group 12 not found');
            return;
        }

        console.log('📋 Contractor Group Details:');
        console.log(`- ID: ${contractorGroup.id}`);
        console.log(`- Name: ${contractorGroup.name}`);
        console.log(`- Group Type: ${contractorGroup.group_type}`);
        console.log(`- Contractor Settings:`, contractorGroup.contractor_settings);
        
        if (contractorGroup.user_group_multipliers?.length > 0) {
            console.log('\n💰 Group Multipliers:');
            contractorGroup.user_group_multipliers.forEach((multiplier, index) => {
                console.log(`  ${index + 1}. ID: ${multiplier.id}, Multiplier: ${multiplier.multiplier}, Manufacturer ID: ${multiplier.manufacturer_id || 'N/A'}`);
            });
        } else {
            console.log('\n✅ No specific multipliers found for this group');
        }

        // Check all multipliers in the system
        console.log('\n📊 All System Multipliers:');
        const allMultipliers = await UserGroupMultiplier.findAll({
            include: [{
                model: UserGroup,
                attributes: ['id', 'name', 'group_type']
            }]
        });

        if (allMultipliers.length === 0) {
            console.log('  No multipliers configured in the system');
        } else {
            allMultipliers.forEach(multiplier => {
                console.log(`  - Group "${multiplier.user_group.name}" (ID: ${multiplier.user_group_id}): ${multiplier.multiplier}x multiplier`);
            });
        }

    } catch (error) {
        console.error('Error checking multipliers:', error);
    }
};

// If this script is run directly
if (require.main === module) {
    checkContractorMultipliers().then(() => {
        process.exit(0);
    });
}

module.exports = { checkContractorMultipliers };
