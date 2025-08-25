// Debug script to check if contractor_settings price_multiplier could be 2.11
const { UserGroup } = require('./models');

const updateContractorSettings = async () => {
    try {
        console.log('🔍 Checking and updating contractor_settings...\n');

        const contractorGroup = await UserGroup.findByPk(12);

        if (!contractorGroup) {
            console.log('❌ Contractor group 12 not found');
            return;
        }

        console.log('📋 Current contractor_settings:');
        console.log('Raw value:', contractorGroup.contractor_settings);
        
        // Parse the current settings
        let currentSettings;
        try {
            currentSettings = JSON.parse(contractorGroup.contractor_settings);
            console.log('Parsed current settings:', currentSettings);
        } catch (e) {
            console.log('Failed to parse current settings:', e.message);
            currentSettings = {};
        }

        // Let's check if it might be 2.11
        console.log('\n🧮 Testing different multiplier values:');
        console.log(`$100 × 1 = $${100 * 1}`);
        console.log(`$100 × 2.11 = $${100 * 2.11}`);
        
        // Check if there's a hidden value causing this
        if (currentSettings.price_multiplier === 1) {
            console.log('\n💡 Current multiplier is 1, but we\'re seeing $211 total.');
            console.log('This suggests the multiplier might be applied elsewhere or there\'s a different source.');
        }

        // Let's try updating the settings to see if that's the source
        console.log('\n🔄 Temporarily updating multiplier to 2.11 for testing...');
        
        const newSettings = { ...currentSettings, price_multiplier: 2.11 };
        await contractorGroup.update({
            contractor_settings: JSON.stringify(newSettings)
        });
        
        console.log('✅ Updated contractor_settings to:', JSON.stringify(newSettings));
        console.log('\n⚠️  Please test the proposal pricing now and then run this script again to revert.');

    } catch (error) {
        console.error('Error:', error);
    }
};

const revertContractorSettings = async () => {
    try {
        console.log('🔄 Reverting contractor_settings back to 1...\n');

        const contractorGroup = await UserGroup.findByPk(12);
        const originalSettings = { price_multiplier: 1 };
        
        await contractorGroup.update({
            contractor_settings: JSON.stringify(originalSettings)
        });
        
        console.log('✅ Reverted contractor_settings to:', JSON.stringify(originalSettings));

    } catch (error) {
        console.error('Error reverting:', error);
    }
};

// Check command line argument
const action = process.argv[2];

if (require.main === module) {
    if (action === 'revert') {
        revertContractorSettings().then(() => process.exit(0));
    } else {
        updateContractorSettings().then(() => process.exit(0));
    }
}
