// Frontend utility for validating sub-type requirements
import axiosInstance from './axiosInstance';

/**
 * Formats validation errors for sub-type requirements into a user-friendly message
 * @param {Array} items - Array of proposal items with their selections
 * @param {string} manufacturerId - ID of the manufacturer
 * @returns {Promise<{isValid: boolean, missingRequirements: Array}>}
 */
export const validateProposalSubTypeRequirements = async (items, manufacturerId) => {
  try {
    // Transform items to match backend expectation
    const catalogItems = items.map(item => ({
      id: item.catalogDataId || item.id,
      name: item.name || item.description,
      code: item.code,
      hingeSide: item.hingeSide,
      exposedSide: item.exposedSide
    }));

    // Call backend validation
    const response = await axiosInstance.post('/api/sub-types/validate-requirements', {
      items: catalogItems,
      manufacturerId: manufacturerId
    });

    return {
      isValid: response.data.isValid,
      missingRequirements: response.data.missingRequirements || []
    };

  } catch (error) {
    if (import.meta?.env?.DEV) console.error('Error validating sub-type requirements:', error);

    // If validation fails, assume valid to not block acceptance
    // (Backend will still validate and block if needed)
    return {
      isValid: true,
      missingRequirements: []
    };
  }
};

/**
 * Formats missing requirements into user-friendly error messages
 * @param {Array} missingRequirements - Array of missing requirement objects
 * @returns {string} Formatted error message
 */
export const formatSubTypeValidationErrors = (missingRequirements) => {
  if (!missingRequirements || missingRequirements.length === 0) {
    return '';
  }

  const errorMessages = missingRequirements.map(req => {
    const itemName = req.itemName || 'Unknown Item';
    const itemCode = req.itemCode ? `(${req.itemCode})` : '';
    const requirement = req.requirement || 'selection';

    return `• ${itemName} ${itemCode}: ${requirement} selection required`;
  });

  return `The following items have missing requirements:\n\n${errorMessages.join('\n')}\n\nPlease complete all required selections before accepting the quote.`;
};

/**
 * Shows a user-friendly error dialog for sub-type validation failures
 * @param {Array} missingRequirements - Array of missing requirement objects
 * @param {Function} Swal - SweetAlert2 instance
 */
export const showSubTypeValidationError = (missingRequirements, Swal) => {
  const errorMessage = formatSubTypeValidationErrors(missingRequirements);

  return Swal.fire({
    title: 'Missing Required Selections',
    text: errorMessage,
    icon: 'warning',
    confirmButtonText: 'OK',
    confirmButtonColor: '#d33'
  });
};

/**
 * Checks if any items in the current proposal require sub-type selections
 * @param {Array} items - Array of proposal items
 * @param {string} manufacturerId - ID of the manufacturer
 * @returns {Promise<{requiresHinge: boolean, requiresExposed: boolean, itemRequirements: Object}>}
 */
export const checkSubTypeRequirements = async (items, manufacturerId) => {
  try {
    if (!Array.isArray(items) || items.length === 0 || !manufacturerId) {
      return {
        requiresHinge: false,
        requiresExposed: false,
        itemRequirements: {}
      };
    }

    // Transform items to match backend expectation
    const catalogItems = items.map(item => ({
      id: item.catalogDataId || item.id,
      name: item.name || item.description,
      code: item.code,
      hingeSide: item.hingeSide,
      exposedSide: item.exposedSide
    }));

    // Call backend to get requirements info
    const response = await axiosInstance.post('/api/sub-types/validate-requirements', {
      items: catalogItems,
      manufacturerId: manufacturerId
    });

    // Analyze the response to determine what columns are needed
    // Check both missing requirements AND all requirements to keep columns visible
    let requiresHinge = false;
    let requiresExposed = false;

    // Check missing requirements (for items that need selection)
    if (response.data.missingRequirements) {
      requiresHinge = response.data.missingRequirements.some(req => req.requirement === 'hinge side');
      requiresExposed = response.data.missingRequirements.some(req => req.requirement === 'exposed side');
    }

    // Also check all requirements to ensure columns stay visible even after selection
    if (response.data.allRequirements) {
      requiresHinge = requiresHinge || response.data.allRequirements.some(req => req.requirement === 'hinge side');
      requiresExposed = requiresExposed || response.data.allRequirements.some(req => req.requirement === 'exposed side');
    }

    // If the backend doesn't provide allRequirements, we need to infer from the items themselves
    // by checking if any item has sub-type requirements (we'll assume they do if we got any response)
    if (!response.data.allRequirements && (response.data.missingRequirements || response.data.validRequirements)) {
      // Check if any items in our catalog have hinge/exposed requirements based on the response structure
      const allResponseRequirements = [
        ...(response.data.missingRequirements || []),
        ...(response.data.validRequirements || [])
      ];

      requiresHinge = requiresHinge || allResponseRequirements.some(req => req.requirement === 'hinge side');
      requiresExposed = requiresExposed || allResponseRequirements.some(req => req.requirement === 'exposed side');
    }

    // Create a map of item requirements for conditional styling
    const itemRequirements = {};
    if (response.data.missingRequirements) {
      response.data.missingRequirements.forEach(req => {
        const itemIndex = req.itemIndex;
        if (itemIndex !== undefined) {
          if (!itemRequirements[itemIndex]) {
            itemRequirements[itemIndex] = {};
          }
          if (req.requirement === 'hinge side') {
            itemRequirements[itemIndex].requiresHinge = true;
          }
          if (req.requirement === 'exposed side') {
            itemRequirements[itemIndex].requiresExposed = true;
          }
        }
      });
    }

    return {
      requiresHinge,
      requiresExposed,
      itemRequirements
    };

  } catch (error) {
    if (import.meta?.env?.DEV) console.error('Error checking sub-type requirements:', error);

    // Return false to not show columns if there's an error
    return {
      requiresHinge: false,
      requiresExposed: false,
      itemRequirements: {}
    };
  }
};
