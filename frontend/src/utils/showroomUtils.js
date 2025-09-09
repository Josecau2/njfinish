// Showroom mode utilities for consistent handling across the application
export const getShowroomSettings = () => {
  try {
    const mode = localStorage.getItem('showroomMode') === 'true';
    const multiplier = parseFloat(localStorage.getItem('showroomMultiplier')) || 1.0;
    return { mode, multiplier };
  } catch (error) {
    console.warn('Failed to load showroom settings:', error);
    return { mode: false, multiplier: 1.0 };
  }
};

export const isShowroomModeActive = () => {
  return getShowroomSettings().mode;
};

export const getShowroomMultiplier = () => {
  return getShowroomSettings().multiplier;
};

export const applyShowroomMultiplier = (value, useShowroom = true) => {
  if (!useShowroom || !isShowroomModeActive()) {
    return value;
  }

  const multiplier = getShowroomMultiplier();
  return value * multiplier;
};

export const formatShowroomPrice = (value, useShowroom = true) => {
  const adjustedValue = applyShowroomMultiplier(value, useShowroom);
  return parseFloat(adjustedValue.toFixed(2));
};

// Event listeners for showroom settings changes
export const addShowroomSettingsListener = (callback) => {
  const handleChange = (event) => {
    callback(event.detail);
  };

  window.addEventListener('showroomSettingsChanged', handleChange);

  // Return cleanup function
  return () => {
    window.removeEventListener('showroomSettingsChanged', handleChange);
  };
};

// Enhanced pricing calculation that includes showroom mode
export const calculateShowroomAwarePricing = (items, manufacturerMultiplier = 1, userGroupMultiplier = 1, useShowroom = true) => {
  const showroomMultiplier = useShowroom && isShowroomModeActive() ? getShowroomMultiplier() : 1;

  const processedItems = items.map(item => {
    // Apply existing multiplier chain: base → manufacturer → user group → showroom
    const basePrice = parseFloat(item.price) || 0;
    const adjustedPrice = basePrice * manufacturerMultiplier * userGroupMultiplier * showroomMultiplier;

    // Apply assembly fees after all multipliers (as per existing architecture)
    const assemblyFee = item.includeAssemblyFee ? (parseFloat(item.assemblyFee) || 0) : 0;
    let assemblyTotal = 0;

    if (assemblyFee > 0) {
      if (item.assemblyFeeType === 'percentage') {
        // Percentage assembly fees are calculated on the final multiplied price
        assemblyTotal = adjustedPrice * (assemblyFee / 100);
      } else {
        // Fixed assembly fees are also affected by showroom multiplier
        assemblyTotal = assemblyFee * showroomMultiplier;
      }
    }

    const itemTotal = adjustedPrice + assemblyTotal;

    // Process modifications
    let modificationsTotal = 0;
    if (item.modifications && Array.isArray(item.modifications)) {
      modificationsTotal = item.modifications.reduce((sum, mod) => {
        const modPrice = (parseFloat(mod.price) || 0) * (mod.qty || 1);
        return sum + (modPrice * showroomMultiplier);
      }, 0);
    }

    return {
      ...item,
      adjustedPrice: formatShowroomPrice(adjustedPrice, false), // Already calculated
      assemblyTotal: formatShowroomPrice(assemblyTotal, false),
      modificationsTotal: formatShowroomPrice(modificationsTotal, false),
      total: formatShowroomPrice(itemTotal + modificationsTotal, false)
    };
  });

  return {
    items: processedItems,
    showroomMultiplier,
    isShowroomActive: useShowroom && isShowroomModeActive()
  };
};
