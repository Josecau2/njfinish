const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { UserGroup, UserRole, UserGroupMultiplier ,User} = require('../models/index');
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







// Get all users
exports.fetchUsers = async (req, res) => {
  try {
    const users = await UserGroupMultiplier.findAll({
      attributes: ['id', 'name']
    });
    return res.status(200).json({ message: 'Fetch User', users });
  } catch (err) {
    res.status(500).json({ message: 'Server error', err: err });
  }
};

exports.fetchUsersGroupMultiplier = async (req, res) => {
  try {
    const users = await UserGroupMultiplier.findAll({
      include: [
        {
          model: UserGroup,
          where: {
            id: {
              [require('sequelize').Op.ne]: 2, // Exclude role_id 2 (Admins)
            }
          },
        },
      ],
    });

    res.status(200).json({ message: 'Fetch User', users });
  } catch (err) {
    res.status(500).json({ message: 'Server error', err: err.message });
  }
};

// Get single user by id
exports.fetchSingleUser = async (req, res) => {
  try {
    const user = await UserGroup.findByPk(req.params.id, {
      attributes: ['id', 'name', 'email', 'role', 'location', 'isSalesRep']
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Add user
exports.addUser = async (req, res) => {
  try {
    const { name, force } = req.body;

    const existingUser = await UserGroup.findOne({
      where: {
        name,
      }
    });
    if (existingUser) {
      return res.status(400).json({ message: "User Group already exists" });
    }
    const newUser = await UserGroup.create({
      name
    });
    // Add corresponding multiplier row with 'N/A'
    await UserGroupMultiplier.create({
      user_group_id: newUser.id,
      multiplier: 'N/A',
      enabled: 0
    });



    res.status(201).json({
      message: "User Group added successfully",
      status: 200,
      user: {
        id: newUser.id,
        name: newUser.name,
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
      name
    } = req.body;

    const user = await UserGroup.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Conditionally update fields
    if (name) user.name = name;

    await user.save();



    res.json({
      message: 'User Group updated successfully',
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

    const user = await UserGroup.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isDeleted = true;
    await user.save();


    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all user roles
exports.getUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const role = await UserRole.findOne({ where: { userId } });

    if (!role) return res.status(404).json({ message: 'Role not found' });

    res.json({ role: role.role });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getDesingers = async (req, res) => {
  try {
      const users = await User.findAll();
      return res.status(200).json({ message: 'Fetch User', users });
  } catch (error) {
     res.status(500).json({ message: 'Server error' });
  }
}