const { ManufacturerSubType, CatalogSubTypeAssignment, ManufacturerCatalogData } = require('../models');

exports.getSubTypes = async (req, res) => {
  try {
    const { manufacturerId } = req.params;

    const subTypes = await ManufacturerSubType.findAll({
      where: { manufacturer_id: manufacturerId },
      order: [['name', 'ASC']]
    });

    res.json({ success: true, data: subTypes });
  } catch (error) {
    console.error('Error fetching sub-types:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sub-types' });
  }
};

exports.createSubType = async (req, res) => {
  try {
    const { manufacturerId } = req.params;
    const { name, description, requires_hinge_side, requires_exposed_side } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Sub-type name is required' });
    }

    const subType = await ManufacturerSubType.create({
      manufacturer_id: manufacturerId,
      name: name.trim(),
      description: description || null,
      requires_hinge_side: Boolean(requires_hinge_side),
      requires_exposed_side: Boolean(requires_exposed_side),
      created_by_user_id: req.user?.id || null
    });

    res.json({ success: true, data: subType });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'A sub-type with this name already exists for this manufacturer' });
    }
    console.error('Error creating sub-type:', error);
    res.status(500).json({ success: false, message: 'Failed to create sub-type' });
  }
};

exports.updateSubType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, requires_hinge_side, requires_exposed_side } = req.body;

    const subType = await ManufacturerSubType.findByPk(id);
    if (!subType) {
      return res.status(404).json({ success: false, message: 'Sub-type not found' });
    }

    await subType.update({
      name: name?.trim() || subType.name,
      description: description !== undefined ? description : subType.description,
      requires_hinge_side: requires_hinge_side !== undefined ? Boolean(requires_hinge_side) : subType.requires_hinge_side,
      requires_exposed_side: requires_exposed_side !== undefined ? Boolean(requires_exposed_side) : subType.requires_exposed_side
    });

    res.json({ success: true, data: subType });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'A sub-type with this name already exists for this manufacturer' });
    }
    console.error('Error updating sub-type:', error);
    res.status(500).json({ success: false, message: 'Failed to update sub-type' });
  }
};

exports.deleteSubType = async (req, res) => {
  try {
    const { id } = req.params;

    const subType = await ManufacturerSubType.findByPk(id);
    if (!subType) {
      return res.status(404).json({ success: false, message: 'Sub-type not found' });
    }

    // Delete all assignments first
    await CatalogSubTypeAssignment.destroy({ where: { sub_type_id: id } });

    // Delete the sub-type
    await subType.destroy();

    res.json({ success: true, message: 'Sub-type deleted successfully' });
  } catch (error) {
    console.error('Error deleting sub-type:', error);
    res.status(500).json({ success: false, message: 'Failed to delete sub-type' });
  }
};

exports.assignCatalogItems = async (req, res) => {
  try {
    const { subTypeId } = req.params;
    const { catalogItemIds } = req.body;

    if (!Array.isArray(catalogItemIds)) {
      return res.status(400).json({ success: false, message: 'catalogItemIds must be an array' });
    }

    const subType = await ManufacturerSubType.findByPk(subTypeId);
    if (!subType) {
      return res.status(404).json({ success: false, message: 'Sub-type not found' });
    }

    // Remove existing assignments for this sub-type
    await CatalogSubTypeAssignment.destroy({ where: { sub_type_id: subTypeId } });

    // Create new assignments
    const assignments = catalogItemIds.map(catalogId => ({
      catalog_data_id: catalogId,
      sub_type_id: subTypeId,
      assigned_by_user_id: req.user?.id || null
    }));

    if (assignments.length > 0) {
      await CatalogSubTypeAssignment.bulkCreate(assignments, { ignoreDuplicates: true });
    }

    res.json({ success: true, message: `Assigned ${catalogItemIds.length} items to sub-type` });
  } catch (error) {
    console.error('Error assigning catalog items:', error);
    res.status(500).json({ success: false, message: 'Failed to assign catalog items' });
  }
};

exports.getSubTypeAssignments = async (req, res) => {
  try {
    const { subTypeId } = req.params;

    const assignments = await CatalogSubTypeAssignment.findAll({
      where: { sub_type_id: subTypeId },
      include: [{
        model: ManufacturerCatalogData,
        as: 'catalogItem',
        attributes: ['id', 'code', 'description', 'type', 'style']
      }]
    });

    const assignedItems = assignments.map(assignment => assignment.catalogItem);
    res.json({ success: true, data: assignedItems });
  } catch (error) {
    console.error('Error fetching sub-type assignments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch assignments' });
  }
};

exports.getCatalogItemRequirements = async (req, res) => {
  try {
    const { catalogItemIds } = req.body;

    if (!Array.isArray(catalogItemIds)) {
      return res.status(400).json({ success: false, message: 'catalogItemIds must be an array' });
    }

    const assignments = await CatalogSubTypeAssignment.findAll({
      where: { catalog_data_id: catalogItemIds },
      include: [{
        model: ManufacturerSubType,
        as: 'subType',
        attributes: ['id', 'name', 'requires_hinge_side', 'requires_exposed_side']
      }]
    });

    const requirements = {};
    assignments.forEach(assignment => {
      const catalogId = assignment.catalog_data_id;
      const subType = assignment.subType;

      if (!requirements[catalogId]) {
        requirements[catalogId] = {
          requires_hinge_side: false,
          requires_exposed_side: false,
          sub_types: []
        };
      }

      requirements[catalogId].requires_hinge_side = requirements[catalogId].requires_hinge_side || subType.requires_hinge_side;
      requirements[catalogId].requires_exposed_side = requirements[catalogId].requires_exposed_side || subType.requires_exposed_side;
      requirements[catalogId].sub_types.push({
        id: subType.id,
        name: subType.name,
        requires_hinge_side: subType.requires_hinge_side,
        requires_exposed_side: subType.requires_exposed_side
      });
    });

    res.json({ success: true, data: requirements });
  } catch (error) {
    console.error('Error fetching catalog item requirements:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch requirements' });
  }
};

// Validate sub-type requirements for frontend
exports.validateSubTypeRequirements = async (req, res) => {
  try {
    const { items, manufacturerId } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'items must be an array' });
    }

    if (!manufacturerId) {
      return res.status(400).json({ success: false, message: 'manufacturerId is required' });
    }

    // Use the existing validation utility
    const { validateSubTypeRequirements } = require('../utils/subTypeValidation');
    const validation = await validateSubTypeRequirements(items, manufacturerId);

    res.json({
      success: true,
      isValid: validation.isValid,
      missingRequirements: validation.missingRequirements,
      allRequirements: validation.allRequirements
    });
  } catch (error) {
    console.error('Error validating sub-type requirements:', error);
    res.status(500).json({ success: false, message: 'Failed to validate requirements' });
  }
};
