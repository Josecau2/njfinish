// Debug script to check tax values that might cause 2.11x multiplier
const mysql = require('mysql2/promise');

async function debugTaxValues() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'njcabinets_db'
    });
    
    console.log('🔍 Checking tax values...\n');
    
    try {
        // Check all taxes
        const [taxes] = await connection.execute('SELECT * FROM taxes');
        console.log('💰 All taxes:');
        taxes.forEach((tax, index) => {
            console.log(`  ${index + 1}. ${tax.name}: ${tax.value}% (default: ${tax.isDefault ? 'YES' : 'NO'})`);
            
            if (tax.isDefault) {
                const taxRate = parseFloat(tax.value);
                const withTax = 100 + (100 * taxRate / 100);
                console.log(`    🎯 $100 + ${taxRate}% tax = $${withTax.toFixed(2)}`);
                
                if (Math.abs(withTax - 211) < 0.01) {
                    console.log('    🚨 FOUND! This tax rate results in $211 total!');
                }
            }
        });
        
        // Let's also check if the tax value could be interpreted incorrectly
        const defaultTax = taxes.find(tax => tax.isDefault);
        if (defaultTax) {
            console.log(`\n🔍 Default tax analysis:`);
            console.log(`  Tax name: ${defaultTax.name}`);
            console.log(`  Tax value: ${defaultTax.value}`);
            console.log(`  Tax as decimal: ${parseFloat(defaultTax.value)}`);
            
            // Check if someone put 111 instead of 11% 
            const taxValue = parseFloat(defaultTax.value);
            if (taxValue > 100) {
                console.log(`  🚨 WARNING: Tax value is ${taxValue}% which is over 100%!`);
                console.log(`  This would result in: $100 + $${(100 * taxValue / 100).toFixed(2)} = $${(100 + (100 * taxValue / 100)).toFixed(2)}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await connection.end();
    }
}

debugTaxValues();
