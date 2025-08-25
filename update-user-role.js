const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateUserRole() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  try {
    // Update the user role_id
    const [updateResult] = await connection.execute(
      'UPDATE Users SET role_id = ? WHERE email = ?',
      [2, 'joseca@symmetricalwolf.com']
    );
    
    console.log('Update result:', updateResult);
    
    // Verify the update
    const [rows] = await connection.execute(
      'SELECT id, name, email, role, role_id FROM Users WHERE email = ?',
      ['joseca@symmetricalwolf.com']
    );
    
    console.log('Updated user:', rows[0]);
    
  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    await connection.end();
  }
}

updateUserRole();
