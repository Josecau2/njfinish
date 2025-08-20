const bcrypt = require('bcrypt');
const sequelize = require('./config/db');
const { User } = require('./models/index');

async function createAdminUser() {
  try {
    // Ensure database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('Password hashed successfully');
    
    // Check if user exists
    const existingUser = await User.findOne({ where: { email: 'joseca@symmetricalwolf.com' } });
    
    if (existingUser) {
      // Update existing user
      await existingUser.update({
        password: hashedPassword,
        role: 'Admin',
        role_id: 2,
        isActive: 'true'
      });
      console.log('✅ User password updated successfully for joseca@symmetricalwolf.com');
      console.log('   New password: admin123');
    } else {
      // Create new user
      const newUser = await User.create({
        name: 'Joseca Admin',
        email: 'joseca@symmetricalwolf.com',
        password: hashedPassword,
        role: 'Admin',
        role_id: 2,
        location: '1',
        isSalesRep: false,
        isDeleted: false,
        isActive: 'true'
      });
      console.log('✅ New admin user created successfully:', newUser.email);
      console.log('   Email: joseca@symmetricalwolf.com');
      console.log('   Password: admin123');
      console.log('   Role: Admin');
    }
  } catch (error) {
    console.error('❌ Error creating/updating user:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

createAdminUser();
