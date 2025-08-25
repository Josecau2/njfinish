// Debug script to check for assembly costs or modifications for item b09
const mysql = require('mysql2/promise');

async function debugB09Costs() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'njcabinets_db'
    });
    
    console.log('🔍 Checking all costs associated with item b09...\n');
    
    try {
        // First get the catalog item
        const [catalogItems] = await connection.execute(`
            SELECT * FROM manufacturer_catalog_data 
            WHERE code = 'b09'
        `);
        
        if (catalogItems.length === 0) {
            console.log('❌ No item found with code b09');
            return;
        }
        
        const item = catalogItems[0];
        console.log('📦 Base item b09:');
        console.log(`  ID: ${item.id}`);
        console.log(`  Code: ${item.code}`);
        console.log(`  Price: $${item.price}`);
        console.log(`  Description: ${item.description}`);
        
        // Check for assembly costs
        const [assemblyCosts] = await connection.execute(`
            SELECT * FROM manufacturer_assembly_costs 
            WHERE catalog_data_id = ?
        `, [item.id]);
        
        console.log('\n🔧 Assembly costs:');
        if (assemblyCosts.length === 0) {
            console.log('  None found');
        } else {
            assemblyCosts.forEach((cost, index) => {
                console.log(`  ${index + 1}. Type: ${cost.type}, Price: $${cost.price}`);
                const totalWithAssembly = parseFloat(item.price) + parseFloat(cost.price);
                console.log(`     $${item.price} + $${cost.price} = $${totalWithAssembly.toFixed(2)}`);
                
                if (Math.abs(totalWithAssembly - 211) < 0.01) {
                    console.log('     🎯 FOUND! This combination equals $211!');
                }
            });
        }
        
        // Check for modifications
        const [modifications] = await connection.execute(`
            SELECT * FROM manufacturer_modification_details 
            WHERE catalog_data_id = ?
        `, [item.id]);
        
        console.log('\n🔧 Modifications:');
        if (modifications.length === 0) {
            console.log('  None found');
        } else {
            modifications.forEach((mod, index) => {
                console.log(`  ${index + 1}. ${mod.modification_name}: $${mod.price}`);
                const totalWithMod = parseFloat(item.price) + parseFloat(mod.price);
                console.log(`     $${item.price} + $${mod.price} = $${totalWithMod.toFixed(2)}`);
                
                if (Math.abs(totalWithMod - 211) < 0.01) {
                    console.log('     🎯 FOUND! This combination equals $211!');
                }
            });
        }
        
        // Check for style collections
        const [styles] = await connection.execute(`
            SELECT * FROM manufacturer_style_collection 
            WHERE catalog_id = ?
        `, [item.id]);
        
        console.log('\n🎨 Style collections:');
        if (styles.length === 0) {
            console.log('  None found');
        } else {
            styles.forEach((style, index) => {
                console.log(`  ${index + 1}. ${style.shortName}: ${style.image || 'no image'}`);
            });
        }
        
        // Let's also check if maybe the quantity is wrong somewhere
        console.log('\n🔢 Possible quantity issues:');
        console.log(`  If qty was 2.11: $${item.price} × 2.11 = $${(parseFloat(item.price) * 2.11).toFixed(2)}`);
        console.log(`  If price was stored as $211: $211 × 1 = $211`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await connection.end();
    }
}

debugB09Costs();
