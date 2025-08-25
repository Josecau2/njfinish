// Quick script to check manufacturer_catalog_data table structure
const mysql = require('mysql2/promise');

async function checkCatalogTable() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'njcabinets_db'
    });
    
    console.log('🔍 Checking manufacturer_catalog_data table structure...\n');
    
    try {
        const [columns] = await connection.execute('DESCRIBE manufacturer_catalog_data');
        console.log('📋 manufacturer_catalog_data table columns:');
        columns.forEach((column, index) => {
            console.log(`  ${index + 1}. ${column.Field} (${column.Type})`);
        });
        
        console.log('\n🔍 Sample catalog data:');
        const [catalogData] = await connection.execute('SELECT * FROM manufacturer_catalog_data LIMIT 3');
        catalogData.forEach((item, index) => {
            console.log(`  ${index + 1}. ${JSON.stringify(item, null, 2)}`);
        });
        
        console.log('\n🔍 Looking for item b09 in any column:');
        const [b09Items] = await connection.execute(`
            SELECT * FROM manufacturer_catalog_data 
            WHERE cabinet_number = 'b09' OR item_id = 'b09' OR cabinet_style = 'b09' 
            OR description LIKE '%b09%'
            LIMIT 5
        `);
        if (b09Items.length > 0) {
            console.log('Found b09 items:');
            b09Items.forEach((item, index) => {
                console.log(`  ${index + 1}. ${JSON.stringify(item, null, 2)}`);
            });
        } else {
            console.log('No items found with b09 identifier');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await connection.end();
    }
}

checkCatalogTable();
