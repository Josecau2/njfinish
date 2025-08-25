
const { UserGroupMultiplier, UserGroup } = require('../models');

// Get all manufacturers
exports.getAllMultiManufacturers = async (req, res) => {
  try {
    const manufacturers = await UserGroupMultiplier.findAll({
      include: [{
        model: UserGroup,
        as: 'user_group',
        required: false
      }]
    });
    return res.status(200).json({ message: 'Fetch Manufacturer', manufacturers });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch manufacturers', error: err });
  }
};

// Create new manufacturer multiplier
exports.createMultiManufacturer = async (req, res) => {
  let { user_group_id, multiplier, enabled } = req.body;
  multiplier = multiplier === '' ? null : multiplier;
  
  try {
    // Check if multiplier already exists for this user group
    const existingMultiplier = await UserGroupMultiplier.findOne({
      where: { user_group_id }
    });
    
    if (existingMultiplier) {
      return res.status(400).json({ message: 'Multiplier already exists for this user group' });
    }
    
    const manufacturer = await UserGroupMultiplier.create({ 
      user_group_id,
      multiplier: multiplier || 1.0, 
      enabled: enabled || 0 
    });
    
    // Fetch the created record with associations
    const createdManufacturer = await UserGroupMultiplier.findByPk(manufacturer.id, {
      include: [{
        model: UserGroup,
        as: 'user_group',
        required: false
      }]
    });
    
    return res.json({ message: 'UserGroupMultiplier created', manufacturer: createdManufacturer });
  } catch (err) {
    console.error('Error in createMultiManufacturer:', err);
    res.status(500).json({ message: 'Failed to create manufacturer', error: err.message });
  }
};

// Update manufacturer by ID or create if user_group_id is provided
// Update manufacturer by ID
exports.updateMultiManufacturer = async (req, res) => {
  const { id } = req.params;
  let { multiplier, enabled } = req.body;
  multiplier = multiplier === '' ? null : multiplier;
  
  try {   
    const manufacturer = await UserGroupMultiplier.findByPk(id, {
      include: [{
        model: UserGroup,
        as: 'user_group',
        required: false
      }]
    });
    
    if (!manufacturer) {
      return res.status(404).json({ message: 'UserGroupMultiplier not found' });
    }
    
    await manufacturer.update({ multiplier, enabled });
    
    // Fetch the updated record with associations
    const updatedManufacturer = await UserGroupMultiplier.findByPk(id, {
      include: [{
        model: UserGroup,
        as: 'user_group',
        required: false
      }]
    });
    
    return res.json({ message: 'UserGroupMultiplier updated', manufacturer: updatedManufacturer });
  } catch (err) {
    console.error('Error in updateMultiManufacturer:', err);
    res.status(500).json({ message: 'Failed to update manufacturer', error: err.message });
  }
};
