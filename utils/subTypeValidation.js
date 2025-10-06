const { ManufacturerSubType, CatalogSubTypeAssignment } = require('../models');

/**
 * Validates that all catalog items with sub-type requirements have the required selections
 * @param {Array} items - Array of catalog items from proposal manufacturersData
 * @param {number} manufacturerId - ID of the manufacturer
 * @returns {Object} - { isValid: boolean, missingRequirements: Array }
 */
async function validateSubTypeRequirements(items, manufacturerId) {
  if (!Array.isArray(items) || items.length === 0) {
    return { isValid: true, missingRequirements: [] };
  }

  const missingRequirements = [];

  try {
    // Get all catalog item IDs from the items array
    const catalogItemIds = items
      .map(item => item.id || item.catalog_data_id)
      .filter(id => id);

    if (catalogItemIds.length === 0) {
      return { isValid: true, missingRequirements: [], allRequirements: [] };
    }

    // Find all sub-type assignments for these catalog items
    const assignments = await CatalogSubTypeAssignment.findAll({
      where: {
        catalog_data_id: catalogItemIds
      },
      include: [{
        model: ManufacturerSubType,
        as: 'subType',
        where: {
          manufacturer_id: manufacturerId
        },
        required: true
      }]
    });

    // Create a map of catalog_data_id to its required sub-types
    const itemRequirements = {};
    assignments.forEach(assignment => {
      const catalogId = assignment.catalog_data_id;
      const subType = assignment.subType;

      if (!itemRequirements[catalogId]) {
        itemRequirements[catalogId] = {
          requiresHingeSide: false,
          requiresExposedSide: false,
          subTypeNames: []
        };
      }

      if (subType.requires_hinge_side) {
        itemRequirements[catalogId].requiresHingeSide = true;
      }
      if (subType.requires_exposed_side) {
        itemRequirements[catalogId].requiresExposedSide = true;
      }
      itemRequirements[catalogId].subTypeNames.push(subType.name);
    });

    // Check each item against its requirements
    items.forEach((item, index) => {
      const catalogId = item.id || item.catalog_data_id;
      const requirements = itemRequirements[catalogId];

      if (!requirements) {
        // Item has no sub-type requirements, skip validation
        return;
      }

      const itemName = item.name || item.code || item.description || `Item ${index + 1}`;
      const hingeSide = item.hingeSide;
      const exposedSide = item.exposedSide;

      // Check hinge side requirement
      if (requirements.requiresHingeSide && (!hingeSide || hingeSide === 'N/A' || hingeSide.trim() === '')) {
        missingRequirements.push({
          itemName,
          itemCode: item.code,
          requirement: 'hinge side',
          subTypes: requirements.subTypeNames.join(', '),
          itemIndex: index
        });
      }

      // Check exposed side requirement
      if (requirements.requiresExposedSide && (!exposedSide || exposedSide === 'N/A' || exposedSide.trim() === '')) {
        missingRequirements.push({
          itemName,
          itemCode: item.code,
          requirement: 'exposed side',
          subTypes: requirements.subTypeNames.join(', '),
          itemIndex: index
        });
      }
    });

    // Also create a list of all requirements (not just missing ones) for frontend column display
    const allRequirements = [];
    Object.keys(itemRequirements).forEach(catalogId => {
      const requirements = itemRequirements[catalogId];
      const item = items.find(item => (item.id || item.catalog_data_id) == catalogId);
      const itemIndex = items.findIndex(item => (item.id || item.catalog_data_id) == catalogId);
      const itemName = item ? (item.name || item.code || item.description || `Item ${itemIndex + 1}`) : 'Unknown Item';

      if (requirements.requiresHingeSide) {
        allRequirements.push({
          itemName,
          itemCode: item?.code,
          requirement: 'hinge side',
          subTypes: requirements.subTypeNames.join(', '),
          itemIndex: itemIndex
        });
      }

      if (requirements.requiresExposedSide) {
        allRequirements.push({
          itemName,
          itemCode: item?.code,
          requirement: 'exposed side',
          subTypes: requirements.subTypeNames.join(', '),
          itemIndex: itemIndex
        });
      }
    });

    return {
      isValid: missingRequirements.length === 0,
      missingRequirements,
      allRequirements
    };

  } catch (error) {
    console.error('Error validating sub-type requirements:', error);
    // Return as valid to avoid blocking orders due to validation errors
    // Log the error for investigation
    return { isValid: true, missingRequirements: [] };
  }
}

module.exports = {
  validateSubTypeRequirements
};
