// Script to check and fix admin user permissions
const sequelize = require('./config/db');

async function checkAdminPermissions() {
    try {
        console.log('=== Admin User Permission Check ===\n');
        
        // First, let's check what tables exist
        const [tables] = await sequelize.query(`SHOW TABLES`);
        console.log('📋 Available tables:', tables.map(t => Object.values(t)[0]));

        // Check user_roles table structure
        try {
            const [roleColumns] = await sequelize.query(`DESCRIBE user_roles`);
            console.log('\n📋 user_roles table structure:');
            roleColumns.forEach(col => {
                console.log(`   ${col.Field}: ${col.Type}`);
            });
        } catch (error) {
            console.log('\n❌ user_roles table does not exist');
            
            // Create the user_roles table
            console.log('🔧 Creating user_roles table...');
            await sequelize.query(`
                CREATE TABLE user_roles (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    permissions JSON,
                    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ user_roles table created!');
        }
        
        // Now check the admin user
        const [users] = await sequelize.query(`
            SELECT u.id, u.name, u.email, u.role, u.role_id
            FROM users u 
            WHERE u.email = 'joseca@symmetricalwolf.com'
        `);

        if (users.length === 0) {
            console.log('❌ Admin user not found!');
            return;
        }

        const user = users[0];
        console.log('\n👤 Admin User Info:');
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Role ID: ${user.role_id}`);

        // Check if we have an admin role with proper permissions
        const [adminRoles] = await sequelize.query(`
            SELECT * FROM user_roles WHERE name = 'Admin'
        `);

        let adminRoleId;
        if (adminRoles.length === 0) {
            // Create admin role
            console.log('\n🔧 Creating Admin role with full permissions...');
            const permissions = JSON.stringify([
                'admin:users',
                'admin:roles', 
                'admin:manufacturers',
                'admin:settings',
                'admin:reports',
                'admin:system',
                'proposals:create',
                'proposals:read',
                'proposals:update',
                'proposals:delete',
                'customers:create',
                'customers:read',
                'customers:update',
                'customers:delete',
                'resources:create',
                'resources:read',
                'resources:update',
                'resources:delete'
            ]);

            const [result] = await sequelize.query(`
                INSERT INTO user_roles (name, permissions, createdAt, updatedAt) 
                VALUES ('Admin', ?, NOW(), NOW())
            `, {
                replacements: [permissions]
            });

            adminRoleId = result.insertId;
            console.log('✅ Admin role created successfully!');
        } else {
            adminRoleId = adminRoles[0].id;
            
            // Update permissions to ensure all are included
            const permissions = JSON.stringify([
                'admin:users',
                'admin:roles', 
                'admin:manufacturers',
                'admin:settings',
                'admin:reports',
                'admin:system',
                'proposals:create',
                'proposals:read',
                'proposals:update',
                'proposals:delete',
                'customers:create',
                'customers:read',
                'customers:update',
                'customers:delete',
                'resources:create',
                'resources:read',
                'resources:update',
                'resources:delete'
            ]);

            console.log('\n🔧 Updating Admin role with full permissions...');
            await sequelize.query(`
                UPDATE user_roles SET permissions = ?, updatedAt = NOW() WHERE id = ?
            `, {
                replacements: [permissions, adminRoleId]
            });
            console.log('✅ Admin role updated successfully!');
        }

        // Update the admin user to use the admin role
        if (user.role_id !== adminRoleId) {
            console.log('\n🔧 Updating admin user role...');
            await sequelize.query(`
                UPDATE users SET role_id = ?, updatedAt = NOW() WHERE email = 'joseca@symmetricalwolf.com'
            `, {
                replacements: [adminRoleId]
            });
            console.log('✅ Admin user role updated successfully!');
        }

        // Verify the fix
        console.log('\n🔍 Verification:');
        const [updatedUsers] = await sequelize.query(`
            SELECT u.id, u.name, u.email, u.role, u.role_id, ur.name as role_name, ur.permissions 
            FROM users u 
            LEFT JOIN user_roles ur ON u.role_id = ur.id 
            WHERE u.email = 'joseca@symmetricalwolf.com'
        `);

        if (updatedUsers.length > 0) {
            const updatedUser = updatedUsers[0];
            console.log(`✅ Admin user now has role: ${updatedUser.role_name}`);
            console.log(`✅ Permissions: ${updatedUser.permissions}`);
        }

        console.log('\n🎉 Admin permissions have been fixed!');
        console.log('Please try saving the assembly cost again.');

    } catch (error) {
        console.error('❌ Error checking admin permissions:', error);
    } finally {
        process.exit(0);
    }
}

checkAdminPermissions();
