const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { UserGroup, UserRole, UserGroupMultiplier ,User} = require('../models/index');
const { logActivity } = require('../utils/activityLogger');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { getGroupPermissions } = require('../constants/permissions');
require('dotenv').config();







// Get all user groups
exports.fetchUsers = async (req, res) => {
  try {
    const users = await UserGroup.findAll({
      attributes: ['id', 'name', 'group_type', 'modules']
    });
    
    // Add computed permissions to each group and ensure modules has default values
    const usersWithPermissions = users.map(user => {
      const userJson = user.toJSON();
      
      // Ensure modules is always a proper object
      let modules;
      if (typeof userJson.modules === 'string') {
        try {
          modules = JSON.parse(userJson.modules);
        } catch (e) {
          console.error('Failed to parse modules for user:', userJson.name, userJson.modules);
          modules = {
            dashboard: false,
            proposals: false,
            customers: false,
            resources: false
          };
        }
      } else if (userJson.modules && typeof userJson.modules === 'object') {
        modules = userJson.modules;
      } else {
        modules = {
          dashboard: false,
          proposals: false,
          customers: false,
          resources: false
        };
      }
      
      userJson.modules = modules;
      userJson.permissions = getGroupPermissions(userJson.group_type, userJson.modules);
      
      return userJson;
    });
    
    return res.status(200).json({ message: 'Fetch User Groups', users: usersWithPermissions });
  } catch (err) {
    res.status(500).json({ message: 'Server error', err: err });
  }
};

// Get single user group
exports.fetchSingleUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserGroup.findByPk(id, {
      attributes: ['id', 'name', 'group_type', 'modules']
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User Group not found' });
    }
    
    // Add computed permissions and ensure modules is properly parsed
    const userJson = user.toJSON();
    
    // Ensure modules is always a proper object
    let modules;
    if (typeof userJson.modules === 'string') {
      try {
        modules = JSON.parse(userJson.modules);
      } catch (e) {
        console.error('Failed to parse modules for user:', userJson.name, userJson.modules);
        modules = {
          dashboard: false,
          proposals: false,
          customers: false,
          resources: false
        };
      }
    } else if (userJson.modules && typeof userJson.modules === 'object') {
      modules = userJson.modules;
    } else {
      modules = {
        dashboard: false,
        proposals: false,
        customers: false,
        resources: false
      };
    }
    
    userJson.modules = modules;
    userJson.permissions = getGroupPermissions(userJson.group_type, userJson.modules);
    
    return res.status(200).json({ message: 'User Group found', user: userJson });
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

// Add user
exports.addUser = async (req, res) => {
  try {
    const { name, group_type = 'standard', modules } = req.body;

    const existingUser = await UserGroup.findOne({
      where: {
        name,
      }
    });
    if (existingUser) {
      return res.status(400).json({ message: "User Group already exists" });
    }

    // Set default modules based on group type
    let defaultModules = {
      dashboard: false,
      proposals: false,
      customers: false,
      resources: false
    };

    // For contractor groups, start with all modules disabled unless explicitly provided
    if (group_type === 'contractor' && modules) {
      defaultModules = { ...defaultModules, ...modules };
    } else if (group_type === 'standard') {
      // For standard groups, you might want different defaults
      defaultModules = modules || defaultModules;
    }

    const newUser = await UserGroup.create({
      name,
      group_type,
      modules: defaultModules
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
        group_type: newUser.group_type,
        modules: newUser.modules,
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
      group_type,
      modules
    } = req.body;

    const user = await UserGroup.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Conditionally update fields
    const before = user.toJSON();
    if (name) user.name = name;
    if (group_type) user.group_type = group_type;
    if (modules !== undefined) user.modules = modules; // Changed condition to check for undefined instead of truthy

    await user.save();

    // Audit: module toggles or group updates
    await logActivity({
      actorId: req.user?.id,
      action: modules !== undefined ? 'group.modules.update' : 'group.update',
      targetType: 'UserGroup',
      targetId: user.id,
      diff: { before: before, after: user.toJSON() }
    });

    res.json({
      message: 'User Group updated successfully',
      user: {
        id: user.id,
        name: user.name,
        group_type: user.group_type,
        modules: user.modules,
      },
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

// Get current user's group multiplier
exports.getCurrentUserMultiplier = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get the user with their group information
    const user = await User.findByPk(userId, {
      include: [
        {
          model: UserGroup,
          as: 'group',
          attributes: ['id', 'name', 'group_type']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If user has no group_id, default to Admin behavior (1.0 multiplier)
    if (!user.group_id) {
      return res.status(200).json({ 
        message: 'User multiplier fetched', 
        multiplier: 1.0,
        groupName: 'Default (No Group)',
        note: 'User not assigned to group, using default multiplier'
      });
    }

    // Get the group multiplier
    const groupMultiplier = await UserGroupMultiplier.findOne({
      where: {
        user_group_id: user.group_id,
        enabled: 1
      }
    });

    const multiplier = groupMultiplier && groupMultiplier.multiplier !== 'N/A' 
      ? parseFloat(groupMultiplier.multiplier) 
      : 1.0;

    return res.status(200).json({ 
      message: 'User multiplier fetched', 
      multiplier: multiplier,
      groupName: user.group?.name || 'Unknown',
      groupId: user.group_id,
      hasGroupMultiplier: !!groupMultiplier
    });
  } catch (error) {
    console.error('Error fetching user multiplier:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
