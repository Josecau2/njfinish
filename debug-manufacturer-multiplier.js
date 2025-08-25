// Debug script to check manufacturer costMultiplier for item b09
const mysql = require('mysql2/promise');

async function debugManufacturerMultiplier() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'njcabinets_db'
    });
    console.log('🔍 Checking manufacturer costMultiplier for item b09...\n');
    
    try {
        // First, find which manufacturer has item b09
        const [catalogItems] = await connection.execute(`
            SELECT mcd.*, m.name as manufacturer_name, m.cost_multiplier 
            FROM manufacturer_catalog_data mcd
            LEFT JOIN manufacturers m ON mcd.manufacturer_id = m.id
            WHERE mcd.code = 'b09'
        `);
        
        console.log('📋 Item b09 details:');
        catalogItems.forEach(item => {
            console.log(`  Item: ${item.code}`);
            console.log(`  Price: $${item.price}`);
            console.log(`  Manufacturer: ${item.manufacturer_name || 'N/A'}`);
            console.log(`  Manufacturer cost_multiplier: ${item.cost_multiplier || 'NULL'}`);
            
            if (item.cost_multiplier) {
                const multipliedPrice = parseFloat(item.price) * parseFloat(item.cost_multiplier);
                console.log(`  Price with manufacturer multiplier: $${item.price} × ${item.cost_multiplier} = $${multipliedPrice.toFixed(2)}`);
                
                if (Math.abs(multipliedPrice - 211) < 0.01) {
                    console.log('  🎯 FOUND! This matches the $211 total!');
                }
            }
            console.log('');
        });
        
        // Check if there are any manufacturer multipliers that could result in 2.11
        const [allManufacturers] = await connection.execute(`
            SELECT id, name, cost_multiplier 
            FROM manufacturers 
            WHERE cost_multiplier IS NOT NULL
            ORDER BY cost_multiplier DESC
        `);
        
        console.log('🏭 All manufacturers with cost multipliers:');
        allManufacturers.forEach(manu => {
            console.log(`  ${manu.name}: ${manu.cost_multiplier}`);
            if (Math.abs(parseFloat(manu.cost_multiplier) - 2.11) < 0.01) {
                console.log('    🎯 This multiplier is 2.11!');
            }
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await connection.end();
    }
}

debugManufacturerMultiplier();
