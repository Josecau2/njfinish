/**
 * Color Contrast Utilities
 * 
 * Provides utility functions for calculating optimal contrast colors
 * based on background colors from the customization system.
 */

/**
 * Calculate luminance of a color using WCAG formula
 * @param {string} color - Hex color string (e.g., '#ffffff')
 * @returns {number} - Luminance value between 0 and 1
 */
export const calculateLuminance = (color) => {
  if (!color) return 0;
  
  // Remove # if present
  const hex = color.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  // Apply gamma correction
  const rs = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gs = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bs = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  
  // Calculate luminance
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Get optimal text color for contrast against background
 * @param {string} backgroundColor - Hex color string
 * @returns {string} - Optimal text color (dark or light)
 */
export const getContrastColor = (backgroundColor) => {
  const luminance = calculateLuminance(backgroundColor);
  return luminance > 0.5 ? '#2d3748' : '#ffffff';
};

/**
 * Check if a color is considered "light" (luminance > 0.5)
 * @param {string} color - Hex color string
 * @returns {boolean} - True if color is light
 */
export const isLightColor = (color) => {
  return calculateLuminance(color) > 0.5;
};

/**
 * Get optimal colors for various UI elements based on background
 * @param {string} backgroundColor - Hex color string
 * @returns {object} - Object containing optimal colors for different elements
 */
export const getOptimalColors = (backgroundColor) => {
  const textColor = getContrastColor(backgroundColor);
  const isLight = isLightColor(backgroundColor);
  
  return {
    text: textColor,
    subtitle: isLight ? 'rgba(45, 55, 72, 0.6)' : 'rgba(255, 255, 255, 0.6)',
    button: {
      light: {
        bg: isLight ? 'rgba(45, 55, 72, 0.1)' : 'rgba(255, 255, 255, 0.15)',
        color: textColor,
        border: isLight ? 'rgba(45, 55, 72, 0.2)' : 'rgba(255, 255, 255, 0.3)',
        hover: {
          bg: isLight ? 'rgba(45, 55, 72, 0.2)' : 'rgba(255, 255, 255, 0.25)',
          color: textColor
        }
      },
      primary: {
        bg: isLight ? '#0d6efd' : '#ffffff',
        color: isLight ? '#ffffff' : backgroundColor,
        border: isLight ? '#0d6efd' : '#ffffff',
        hover: {
          bg: isLight ? '#0b5ed7' : 'rgba(255, 255, 255, 0.9)',
          color: isLight ? '#ffffff' : backgroundColor
        }
      },
      success: {
        bg: isLight ? '#198754' : '#10b981',
        color: '#ffffff',
        border: isLight ? '#198754' : '#10b981',
        hover: {
          bg: isLight ? '#157347' : '#059669',
          color: '#ffffff'
        }
      },
      warning: {
        bg: isLight ? '#ffc107' : '#f59e0b',
        color: isLight ? '#000000' : '#ffffff',
        border: isLight ? '#ffc107' : '#f59e0b',
        hover: {
          bg: isLight ? '#e0a800' : '#d97706',
          color: isLight ? '#000000' : '#ffffff'
        }
      },
      danger: {
        bg: isLight ? '#dc3545' : '#ef4444',
        color: '#ffffff',
        border: isLight ? '#dc3545' : '#ef4444',
        hover: {
          bg: isLight ? '#bb2d3b' : '#dc2626',
          color: '#ffffff'
        }
      }
    },
    badge: {
      light: {
        bg: isLight ? 'rgba(45, 55, 72, 0.1)' : 'rgba(255, 255, 255, 0.2)',
        color: textColor,
        border: isLight ? 'rgba(45, 55, 72, 0.2)' : 'rgba(255, 255, 255, 0.3)'
      },
      info: {
        bg: isLight ? '#0dcaf0' : '#06b6d4',
        color: isLight ? '#ffffff' : '#ffffff',
        border: isLight ? '#0dcaf0' : '#06b6d4'
      },
      secondary: {
        bg: isLight ? '#6c757d' : '#64748b',
        color: '#ffffff',
        border: isLight ? '#6c757d' : '#64748b'
      },
      warning: {
        bg: isLight ? '#ffc107' : '#f59e0b',
        color: isLight ? '#000000' : '#ffffff',
        border: isLight ? '#ffc107' : '#f59e0b'
      },
      success: {
        bg: isLight ? '#198754' : '#10b981',
        color: '#ffffff',
        border: isLight ? '#198754' : '#10b981'
      },
      danger: {
        bg: isLight ? '#dc3545' : '#ef4444',
        color: '#ffffff',
        border: isLight ? '#dc3545' : '#ef4444'
      }
    },
    separator: isLight ? 'rgba(45, 55, 72, 0.2)' : 'rgba(255, 255, 255, 0.3)',
    border: isLight ? 'rgba(45, 55, 72, 0.15)' : 'rgba(255, 255, 255, 0.15)',
    overlay: isLight ? 'rgba(45, 55, 72, 0.05)' : 'rgba(255, 255, 255, 0.05)'
  };
};

/**
 * Generate CSS custom properties for dynamic theming
 * @param {string} backgroundColor - Hex color string
 * @param {string} prefix - CSS custom property prefix (default: '--dynamic')
 * @returns {object} - Object containing CSS custom properties
 */
export const generateDynamicCSSProperties = (backgroundColor, prefix = '--dynamic') => {
  const colors = getOptimalColors(backgroundColor);
  
  return {
    [`${prefix}-bg`]: backgroundColor,
    [`${prefix}-text`]: colors.text,
    [`${prefix}-subtitle`]: colors.subtitle,
    [`${prefix}-btn-light-bg`]: colors.button.light.bg,
    [`${prefix}-btn-light-color`]: colors.button.light.color,
    [`${prefix}-btn-light-border`]: colors.button.light.border,
    [`${prefix}-btn-light-hover-bg`]: colors.button.light.hover.bg,
    [`${prefix}-btn-primary-bg`]: colors.button.primary.bg,
    [`${prefix}-btn-primary-color`]: colors.button.primary.color,
    [`${prefix}-btn-success-bg`]: colors.button.success.bg,
    [`${prefix}-badge-light-bg`]: colors.badge.light.bg,
    [`${prefix}-badge-light-color`]: colors.badge.light.color,
    [`${prefix}-separator`]: colors.separator,
    [`${prefix}-border`]: colors.border,
    [`${prefix}-overlay`]: colors.overlay
  };
};

/**
 * Apply dynamic CSS properties to document root
 * @param {string} backgroundColor - Hex color string
 * @param {string} prefix - CSS custom property prefix (default: '--dynamic')
 */
export const applyDynamicTheme = (backgroundColor, prefix = '--dynamic') => {
  const properties = generateDynamicCSSProperties(backgroundColor, prefix);
  const root = document.documentElement;
  
  Object.entries(properties).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
};

/**
 * React hook for using dynamic colors based on customization
 * @param {object} customization - Customization object from Redux store
 * @returns {object} - Object containing optimal colors and utilities
 */
export const useDynamicColors = (customization) => {
  const backgroundColor = customization?.headerBg || '#ffffff';
  const colors = getOptimalColors(backgroundColor);
  
  return {
    backgroundColor,
    colors,
    isLight: isLightColor(backgroundColor),
    getContrastColor: (bg) => getContrastColor(bg),
    applyTheme: () => applyDynamicTheme(backgroundColor)
  };
};

export default {
  calculateLuminance,
  getContrastColor,
  isLightColor,
  getOptimalColors,
  generateDynamicCSSProperties,
  applyDynamicTheme,
  useDynamicColors
};
