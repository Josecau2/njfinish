// Quick script to check what tables exist in the database
const mysql = require('mysql2/promise');

async function checkTables() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'njcabinets_db'
    });
    
    console.log('🔍 Checking what tables exist in the database...\n');
    
    try {
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('📋 Available tables:');
        tables.forEach((row, index) => {
            const tableName = Object.values(row)[0];
            console.log(`  ${index + 1}. ${tableName}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await connection.end();
    }
}

checkTables();
