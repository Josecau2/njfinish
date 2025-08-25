// Quick script to check if taxes table exists and has data
const mysql = require('mysql2/promise');

async function quickTaxCheck() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'njcabinets_db'
    });
    
    try {
        // Check if taxes table exists and has data
        const [tableExists] = await connection.execute("SHOW TABLES LIKE 'taxes'");
        console.log('📋 Taxes table exists:', tableExists.length > 0 ? 'YES' : 'NO');
        
        if (tableExists.length > 0) {
            const [count] = await connection.execute('SELECT COUNT(*) as count FROM taxes');
            console.log('📊 Number of tax records:', count[0].count);
            
            if (count[0].count > 0) {
                const [taxes] = await connection.execute('SELECT * FROM taxes LIMIT 5');
                console.log('💰 Sample taxes:');
                taxes.forEach((tax, index) => {
                    console.log(`  ${index + 1}. ${JSON.stringify(tax, null, 2)}`);
                });
            }
        }
        
        // Check for 111 or 2.11 values anywhere in the database
        console.log('\n🔍 Searching for 111 or 2.11 values in the database...');
        
        // Check user_groups table for any settings that might have 2.11
        const [userGroups] = await connection.execute('SELECT * FROM user_groups WHERE contractor_settings LIKE "%2.11%" OR contractor_settings LIKE "%111%"');
        if (userGroups.length > 0) {
            console.log('🎯 Found 111/2.11 in user_groups:');
            userGroups.forEach(group => {
                console.log(`  Group ${group.id}: ${group.contractor_settings}`);
            });
        }
        
        // Check for any decimal values close to 2.11
        const [multipliers] = await connection.execute('SELECT * FROM user_group_multipliers');
        console.log('\n📊 User group multipliers:');
        multipliers.forEach(mult => {
            console.log(`  ${JSON.stringify(mult, null, 2)}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await connection.end();
    }
}

quickTaxCheck();
