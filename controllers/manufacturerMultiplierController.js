
const UserGroupMultiplier  = require('../models/UserGroupMultiplier');

// Get all manufacturers
exports.getAllMultiManufacturers = async (req, res) => {
  try {
    const manufacturers = await UserGroupMultiplier.findAll();
    return res.status(200).json({ message: 'Fetch Manufacturer', manufacturers });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch manufacturers', error: err });
  }
};

// Update manufacturer by ID
exports.updateMultiManufacturer = async (req, res) => {
  const { id } = req.params;
  let {multiplier, enabled } = req.body;
  multiplier = multiplier === '' ? null : multiplier;
  try {   
    let manufacturer = await UserGroupMultiplier.findByPk(id);

    if (manufacturer) {
      await manufacturer.update({  multiplier, enabled });
      return res.json({ message: 'UserGroupMultiplier updated', manufacturer });
    } 
  } catch (err) {
    console.error('Error in updateManufacturer:', err);
    res.status(500).json({ message: 'Failed to update or create manufacturer', error: err.message });
  }
};
