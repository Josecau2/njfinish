const { User, UserGroup } = require('./models');
const { Op } = require('sequelize');

async function checkUsers() {
    try {
        console.log('🔍 Checking existing users in the database...\n');
        
        // Get all admin users
        const adminUsers = await User.findAll({
            where: { 
                role: 'Admin',
                isDeleted: { [Op.not]: true }
            },
            attributes: ['id', 'name', 'email', 'role'],
            include: [{
                model: UserGroup,
                as: 'group',
                attributes: ['id', 'group_name', 'group_type']
            }]
        });
        
        console.log('👑 Admin Users:');
        if (adminUsers.length === 0) {
            console.log('   No admin users found!');
        } else {
            adminUsers.forEach(user => {
                console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
                if (user.group) {
                    console.log(`     Group: ${user.group.group_name} (${user.group.group_type})`);
                }
            });
        }
        
        console.log('');
        
        // Get all contractor users
        const contractorUsers = await User.findAll({
            where: { 
                isDeleted: { [Op.not]: true }
            },
            attributes: ['id', 'name', 'email', 'role'],
            include: [{
                model: UserGroup,
                as: 'group',
                attributes: ['id', 'group_name', 'group_type'],
                where: { group_type: 'contractor' },
                required: false
            }]
        });
        
        const contractorsWithGroup = contractorUsers.filter(u => u.group && u.group.group_type === 'contractor');
        
        console.log('🔨 Contractor Users:');
        if (contractorsWithGroup.length === 0) {
            console.log('   No contractor users found!');
        } else {
            contractorsWithGroup.forEach(user => {
                console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
                if (user.group) {
                    console.log(`     Group: ${user.group.group_name} (${user.group.group_type})`);
                }
            });
        }
        
        console.log('');
        
        // Get all user groups
        const groups = await UserGroup.findAll({
            attributes: ['id', 'group_name', 'group_type']
        });
        
        console.log('👥 User Groups:');
        groups.forEach(group => {
            console.log(`   - ${group.group_name} (${group.group_type}) - ID: ${group.id}`);
        });
        
        console.log('');
        
        if (adminUsers.length > 0 && contractorsWithGroup.length > 0) {
            console.log('✅ Found both admin and contractor users for testing');
            console.log('\n📝 Update test-admin-notifications.js with these credentials:');
            console.log(`   Admin: ${adminUsers[0].email}`);
            console.log(`   Contractor: ${contractorsWithGroup[0].email}`);
            console.log('   (You\'ll need to know their passwords)');
        } else {
            console.log('❌ Missing required users for testing');
            if (adminUsers.length === 0) {
                console.log('   - No admin users found');
            }
            if (contractorsWithGroup.length === 0) {
                console.log('   - No contractor users found');
            }
        }
        
    } catch (error) {
        console.error('Error checking users:', error.message);
    } finally {
        process.exit(0);
    }
}

checkUsers();
