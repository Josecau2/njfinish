const { Manufacturer } = require('./models');

async function testETASave() {
    console.log('Testing ETA field saving...');
    
    try {
        // Find a manufacturer to test with
        const manufacturer = await Manufacturer.findOne();
        if (!manufacturer) {
            console.log('No manufacturers found');
            return;
        }
        
        console.log('Found manufacturer:', manufacturer.name);
        console.log('Current ETA values:');
        console.log('  Assembled ETA:', manufacturer.assembledEtaDays);
        console.log('  Unassembled ETA:', manufacturer.unassembledEtaDays);
        
        // Test updating with text values
        const testAssembledETA = '7-14 days';
        const testUnassembledETA = '3-4 days';
        
        console.log('\nUpdating with test values:');
        console.log('  Assembled ETA:', testAssembledETA);
        console.log('  Unassembled ETA:', testUnassembledETA);
        
        // Update using Sequelize
        const updated = await manufacturer.update({
            assembledEtaDays: testAssembledETA,
            unassembledEtaDays: testUnassembledETA
        });
        
        console.log('\nSequelize update result:');
        console.log('  Assembled ETA:', updated.assembledEtaDays);
        console.log('  Unassembled ETA:', updated.unassembledEtaDays);
        
        // Reload from database to verify
        await manufacturer.reload();
        
        console.log('\nReloaded from database:');
        console.log('  Assembled ETA:', manufacturer.assembledEtaDays);
        console.log('  Unassembled ETA:', manufacturer.unassembledEtaDays);
        
    } catch (error) {
        console.error('Error testing ETA save:', error);
    }
}

testETASave();
