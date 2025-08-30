// Check what users exist in the database
const mysql = require('mysql2/promise');

async function checkUsers() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'njcabinets_db'
    });

    try {
        console.log('🔍 Checking users table structure...\n');
        
        const [structure] = await connection.execute('DESCRIBE users');
        console.log('📋 Users table columns:');
        structure.forEach(col => {
            console.log(`  ${col.Field} (${col.Type})`);
        });
        
        console.log('\n🔍 Checking users in database...\n');
        
        const [users] = await connection.execute(`
            SELECT 
                u.*,
                ug.name as role,
                ug.id as role_id
            FROM users u
            LEFT JOIN user_groups ug ON u.role_id = ug.id
            ORDER BY u.id
        `);
        
        if (users.length === 0) {
            console.log('❌ No users found in database');
        } else {
            console.log('👥 Users in database:');
            users.forEach(user => {
                console.log(`  ID: ${user.id} | Email: ${user.email} | Role: ${user.role} (ID: ${user.role_id})`);
                console.log(`    All fields:`, user);
            });
        }
        
        console.log('\n🔍 Checking user_groups...\n');
        const [groups] = await connection.execute('SELECT * FROM user_groups ORDER BY id');
        
        if (groups.length === 0) {
            console.log('❌ No user groups found');
        } else {
            console.log('🏷️ User groups:');
            groups.forEach(group => {
                console.log(`  ID: ${group.id} | Name: ${group.name}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Database error:', error.message);
    } finally {
        await connection.end();
    }
}

checkUsers();
