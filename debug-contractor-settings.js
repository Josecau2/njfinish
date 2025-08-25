// Debug script to check exact contractor settings for group 12
const { UserGroup } = require('./models');

const checkExactSettings = async () => {
    try {
        console.log('🔍 Checking exact contractor_settings...\n');

        const contractorGroup = await UserGroup.findByPk(12);

        if (!contractorGroup) {
            console.log('❌ Contractor group 12 not found');
            return;
        }

        console.log('📋 Raw contractor_settings value:');
        console.log('Type:', typeof contractorGroup.contractor_settings);
        console.log('Value:', contractorGroup.contractor_settings);
        console.log('JSON stringified:', JSON.stringify(contractorGroup.contractor_settings));

        if (contractorGroup.contractor_settings) {
            const settings = contractorGroup.contractor_settings;
            console.log('\n🔍 Parsed settings:');
            Object.keys(settings).forEach(key => {
                console.log(`  ${key}:`, settings[key], `(type: ${typeof settings[key]})`);
            });

            if (settings.price_multiplier) {
                console.log(`\n💰 Price multiplier found: ${settings.price_multiplier}`);
                console.log(`  Multiplier type: ${typeof settings.price_multiplier}`);
                console.log(`  $100 × ${settings.price_multiplier} = $${100 * settings.price_multiplier}`);
            }
        }

    } catch (error) {
        console.error('Error checking settings:', error);
    }
};

if (require.main === module) {
    checkExactSettings().then(() => {
        process.exit(0);
    });
}
