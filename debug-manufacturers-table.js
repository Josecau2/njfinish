// Quick script to check manufacturers table structure
const mysql = require('mysql2/promise');

async function checkManufacturersTable() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'njcabinets_db'
    });
    
    console.log('🔍 Checking manufacturers table structure...\n');
    
    try {
        const [columns] = await connection.execute('DESCRIBE manufacturers');
        console.log('📋 Manufacturers table columns:');
        columns.forEach((column, index) => {
            console.log(`  ${index + 1}. ${column.Field} (${column.Type})`);
        });
        
        console.log('\n🔍 Sample manufacturers data:');
        const [manufacturers] = await connection.execute('SELECT * FROM manufacturers LIMIT 3');
        manufacturers.forEach((manu, index) => {
            console.log(`  ${index + 1}. ${JSON.stringify(manu, null, 2)}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await connection.end();
    }
}

checkManufacturersTable();
