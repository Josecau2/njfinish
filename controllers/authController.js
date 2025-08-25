const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, UserRole, UserGroup } = require('../models/index');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');
require('dotenv').config();

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
      userRole = 'contractor';
    }

    const token = jwt.sign({ 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      role: userRole, 
      role_id: user.role_id,
      group_id: user.group_id 
    }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ 
      token, 
      userId: user.id, 
      name: user.name, 
      role: userRole, 
      role_id: user.role_id,
      group_id: user.group_id,
      group: user.group
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
    res.json(user);
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
    const { name, email, password, isSalesRep, location, userGroup, force } = req.body;

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
      deletedUser.name = name;
      deletedUser.password = await bcrypt.hash(password, 10);
      deletedUser.isSalesRep = !!isSalesRep;
      deletedUser.location = location;
      deletedUser.group_id = userGroup;
      deletedUser.role_id = userGroup; // Also set role_id for contractor access
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

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      isSalesRep: !!isSalesRep,
      location,
      group_id: userGroup,
      role_id: userGroup // Also set role_id for contractor access
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
      role_id
    } = req.body;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Conditionally update fields
    if (name) user.name = name;
    if (location) user.location = location;
    if (userGroup) {
      user.group_id = userGroup;
      user.role_id = userGroup; // Also set role_id to match the group_id for contractor access
    }
    if (typeof isSalesRep === 'boolean') user.isSalesRep = isSalesRep;
    if (role_id !== undefined) user.role_id = role_id;

    if (password && password.trim() !== '') {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    if (userGroup) {
      const roleEntry = await UserRole.findOne({ where: { userId: user.id } });

      if (roleEntry) {
        if (roleEntry.role !== userGroup) {
          roleEntry.role = userGroup;
          await roleEntry.save();
        }
      } else {
        await UserRole.create({
          userId: user.id,
          role: userGroup
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