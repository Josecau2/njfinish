const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, UserRole, UserGroup } = require('../models/index');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');
require('dotenv').config();

// Centralized token lifetime (default to long-lived sessions)
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES || process.env.JWT_EXPIRES_IN || '8h';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

// Signup controller
exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: username,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });

  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Login controller
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
      include: [{
        model: UserGroup,
        as: 'group',
        attributes: ['id', 'name', 'group_type', 'modules']
      }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Determine user role - for contractors, use group_type as role
    let userRole = user.role;
    if (user.group && user.group.group_type === 'contractor' && (!userRole || userRole.trim() === '')) {
      userRole = 'Contractor';
    }

    const token = jwt.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      role: userRole,
      role_id: user.role_id,
      group_id: user.group_id
    }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });

    // Debug logging for development
    if (process.env.NODE_ENV === 'development') {
      const decoded = jwt.decode(token);
      console.log('Login Debug - Token created:', {
        userId: user.id,
        email: user.email,
        expiresIn: TOKEN_EXPIRES_IN,
        issuedAt: new Date(decoded.iat * 1000).toISOString(),
        expiresAt: new Date(decoded.exp * 1000).toISOString(),
        tokenLength: token.length
      });
    }

    // Parse modules if they exist and are stored as string
    let groupData = user.group;
    if (groupData && groupData.modules && typeof groupData.modules === 'string') {
      try {
        groupData = {
          ...groupData.toJSON(),
          modules: JSON.parse(groupData.modules)
        };
      } catch (err) {
        console.error('Error parsing group modules:', err);
        // Keep original if parsing fails
      }
    }

    res.json({
      token,
      userId: user.id,
      name: user.name,
      role: userRole,
      role_id: user.role_id,
      group_id: user.group_id,
      group: groupData
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current authenticated user (self)
exports.getCurrentUser = async (req, res) => {
  try {
    const id = req.user?.id;
    if (!id) return res.status(401).json({ message: 'Unauthenticated' });

    const user = await User.findByPk(id, {
      attributes: ['id', 'name', 'email', 'role', 'group_id', 'role_id', 'location', 'isSalesRep'],
      include: [{ model: UserGroup, as: 'group', attributes: ['id', 'name', 'group_type', 'modules'], required: false }]
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Parse modules if they exist and are stored as string
    let userData = user.toJSON();
    if (userData.group && userData.group.modules && typeof userData.group.modules === 'string') {
      try {
        userData.group.modules = JSON.parse(userData.group.modules);
      } catch (err) {
        console.error('Error parsing group modules in getCurrentUser:', err);
        // Keep original if parsing fails
      }
    }

    res.json(userData);
  } catch (err) {
    console.error('getCurrentUser error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update current authenticated user (self)
exports.updateCurrentUser = async (req, res) => {
  try {
    const id = req.user?.id;
    if (!id) return res.status(401).json({ message: 'Unauthenticated' });

    const { name, password } = req.body; // Contractors cannot change location/group via self-update

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (password && password.trim() !== '') {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    res.json({ message: 'Profile updated successfully', status: 200, id: user.id, name: user.name, email: user.email });
  } catch (err) {
    console.error('updateCurrentUser error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// -------------------- Forgot Password --------------------
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + 3600000; // 1 hour

    user.resetToken = token;
    user.resetTokenExpiry = new Date(expiry);
    await user.save();

    const resetLink = `${process.env.APP_URL}/reset-password/${token}`;

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <p>You requested a password reset.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link is valid for 1 hour.</p>
      `,
    });

    res.json({ message: 'Password reset link sent to your email.' });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// -------------------- Reset Password --------------------
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: { [Op.gt]: new Date() },
      },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all users
exports.fetchUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { isDeleted: false },
      attributes: ['id', 'name', 'email', 'role', 'group_id', 'role_id', 'location', 'isSalesRep'],
      include: [
        {
          model: UserGroup,
          as: 'group',
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });

    return res.status(200).json({ message: 'Fetch User', users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error', err: err });
  }
};

// Get single user by id
exports.fetchSingleUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'name', 'email', 'role', 'group_id', 'role_id', 'location', 'isSalesRep'],
      include: [
        {
          model: UserGroup,
          as: 'group',
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add user
exports.addUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      isSalesRep,
      location,
      userGroup,
      force,
      role,
      // Personal address fields
      street_address,
      city,
      state,
      zip_code,
      country,
      // Company information
      company_name,
      company_street_address,
      company_city,
      company_state,
      company_zip_code,
      company_country
    } = req.body;

    const existingUser = await User.findOne({
      where: {
        email,
        isDeleted: false
      }
    });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const deletedUser = await User.findOne({
      where: {
        email,
        isDeleted: true
      }
    });

    if (deletedUser && !force) {
      return res.status(409).json({
        message: "This email belongs to a previously deleted user.",
        email_exists_but_deleted: true
      });
    }

    if (deletedUser && force) {
      // Determine user role based on group type for restoration
      let userRole = role || 'User'; // Use provided role or default to 'User'
      let roleId = 0; // Default role_id

      if (userGroup) {
        const group = await UserGroup.findByPk(userGroup);
        if (group) {
          if (group.group_type === 'contractor') {
            userRole = 'Contractor'; // Set role to Contractor for contractor groups
            roleId = parseInt(userGroup); // Set role_id to group_id for contractors
          } else if (group.name.toLowerCase() === 'admin' || group.group_type === 'admin') {
            userRole = 'Admin'; // Set role to Admin for admin groups
            roleId = 2; // Set role_id to 2 for admin users
            roleId = 2; // Set role_id to 2 for admin users
            // Note: Admin users don't need group modules - they have access to everything by role
          }
        }
      }

      deletedUser.name = name;
      deletedUser.password = await bcrypt.hash(password, 10);
      deletedUser.isSalesRep = !!isSalesRep;
      deletedUser.location = location;
      // Update personal address fields
      deletedUser.street_address = street_address;
      deletedUser.city = city;
      deletedUser.state = state;
      deletedUser.zip_code = zip_code;
      deletedUser.country = country;
      // Update company information
      deletedUser.company_name = company_name;
      deletedUser.company_street_address = company_street_address;
      deletedUser.company_city = company_city;
      deletedUser.company_state = company_state;
      deletedUser.company_zip_code = company_zip_code;
      deletedUser.company_country = company_country;
      deletedUser.role = userRole; // Set the role field properly
      deletedUser.group_id = userGroup;
      deletedUser.role_id = roleId; // Set role_id properly based on group type
      deletedUser.isDeleted = false;
      await deletedUser.save();

      // await UserRole.create({
      //   userId: deletedUser.id,
      //   role: userGroup
      // });

      return res.status(200).json({
        message: "User restored successfully",
        status: 200,
        user: {
          id: deletedUser.id,
          name: deletedUser.name,
          email: deletedUser.email,
          isSalesRep: deletedUser.isSalesRep,
          location: deletedUser.location,
          role: deletedUser.role
        },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine user role - use explicitly provided role or determine from group type
    let userRole = role || 'User'; // Use provided role or default to 'User'
    let roleId = 0; // Default role_id

    // Only override the role if userGroup is provided and role is not explicitly set
    if (userGroup && !role) {
      const group = await UserGroup.findByPk(userGroup);
      if (group) {
        if (group.group_type === 'contractor') {
          userRole = 'Contractor'; // Set role to Contractor for contractor groups
          roleId = parseInt(userGroup); // Set role_id to group_id for contractors
        } else if (group.name.toLowerCase() === 'admin' || group.group_type === 'admin') {
          userRole = 'Admin'; // Set role to Admin for admin groups
          roleId = 2; // Set role_id to 2 for admin users (standard admin role_id)
          // Note: Admin users don't need group modules - they have access to everything by role
        }
      }
    }    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      isSalesRep: !!isSalesRep,
      location,
      // Personal address fields
      street_address,
      city,
      state,
      zip_code,
      country,
      // Company information
      company_name,
      company_street_address,
      company_city,
      company_state,
      company_zip_code,
      company_country,
      role: userRole, // Set the role field properly
      group_id: parseInt(userGroup) || null,
      role_id: roleId // Set role_id properly based on group type
    });

    // await UserRole.create({
    //   userId: newUser.id,
    //   role: userGroup
    // });

    res.status(201).json({
      message: "User added successfully",
      status: 200,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        isSalesRep: newUser.isSalesRep,
        location: newUser.location,
        role: newUser.role
      },
    });
  } catch (err) {
    console.error('Add User Error:', err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      password,
      location,
      userGroup,
      isSalesRep,
      role_id,
      // Personal address fields
      street_address,
      city,
      state,
      zip_code,
      country,
      // Company information
      company_name,
      company_street_address,
      company_city,
      company_state,
      company_zip_code,
      company_country
    } = req.body;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Declare userRole at function scope
    let userRole = 'User'; // Default role
    let roleId = 0; // Default role_id

    // Conditionally update fields
    if (name) user.name = name;
    if (location) user.location = location;

    // Update personal address fields if provided
    if (street_address !== undefined) user.street_address = street_address;
    if (city !== undefined) user.city = city;
    if (state !== undefined) user.state = state;
    if (zip_code !== undefined) user.zip_code = zip_code;
    if (country !== undefined) user.country = country;

    // Update company information if provided
    if (company_name !== undefined) user.company_name = company_name;
    if (company_street_address !== undefined) user.company_street_address = company_street_address;
    if (company_city !== undefined) user.company_city = company_city;
    if (company_state !== undefined) user.company_state = company_state;
    if (company_zip_code !== undefined) user.company_zip_code = company_zip_code;
    if (company_country !== undefined) user.company_country = company_country;

    if (userGroup) {
      // Determine user role based on group type for updates
      const group = await UserGroup.findByPk(userGroup);
      if (group) {
        if (group.group_type === 'contractor') {
          userRole = 'Contractor'; // Set role to Contractor for contractor groups
          roleId = parseInt(userGroup); // Set role_id to group_id for contractors
        } else if (group.name.toLowerCase() === 'admin' || group.group_type === 'admin') {
          userRole = 'Admin'; // Set role to Admin for admin groups
          roleId = 2; // Set role_id to 2 for admin users
          // Note: Admin users don't need group modules - they have access to everything by role
        }
      }

      user.role = userRole; // Set the role field properly
      user.group_id = parseInt(userGroup) || null;
      user.role_id = roleId; // Set role_id properly based on group type
    }
    if (typeof isSalesRep === 'boolean') user.isSalesRep = isSalesRep;
    if (role_id !== undefined) user.role_id = parseInt(role_id) || 0;

    if (password && password.trim() !== '') {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    if (userGroup) {
      const roleEntry = await UserRole.findOne({ where: { userId: user.id } });

      if (roleEntry) {
        if (roleEntry.role !== userRole) {
          roleEntry.role = userRole;
          await roleEntry.save();
        }
      } else {
        await UserRole.create({
          userId: user.id,
          role: userRole
        });
      }
    }

    res.json({
      message: 'User updated successfully',
      user,
      status: 200
    });

  } catch (err) {
    console.error('Update User Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isDeleted = true;
    await user.save();
    await UserRole.destroy({ where: { userId: id } });

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all user roles
exports.getUserRole = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        userId: userId,
        error: 'USER_NOT_FOUND'
      });
    }

    res.json({ role: user.role_id });
  } catch (err) {
    console.error('Error in getUserRole:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
};
