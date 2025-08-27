import React from 'react';
import { useSelector } from 'react-redux';
import { getOptimalColors } from '../utils/colorUtils';

/**
 * Higher-Order Component that provides automatic contrast styling
 * based on the customization header background color.
 * 
 * This HOC can wrap any component to automatically apply contrast-aware styling.
 * 
 * @param {React.Component} WrappedComponent - Component to enhance with contrast styling
 * @param {object} options - Configuration options
 * @param {string} options.colorSource - Which customization color to use ('headerBg', 'sidebarBg', etc.)
 * @param {boolean} options.applyToChildren - Whether to apply styling to all children
 * @param {string} options.className - Additional CSS class to apply
 * 
 * @returns {React.Component} - Enhanced component with automatic contrast
 */
const withDynamicContrast = (WrappedComponent, options = {}) => {
  const {
    colorSource = 'headerBg',
    applyToChildren = true,
    className = '',
    containerElement = 'div'
  } = options;

  const DynamicContrastComponent = (props) => {
    const customization = useSelector((state) => state.customization);
    const backgroundColor = customization[colorSource] || '#ffffff';
    const optimalColors = getOptimalColors(backgroundColor);

    // Generate dynamic CSS for the component
    const dynamicStyles = `
      .dynamic-contrast-container {
        background-color: ${backgroundColor};
        color: ${optimalColors.text};
      }
      
      .dynamic-contrast-container .btn-light {
        background-color: ${optimalColors.button.light.bg} !important;
        border-color: ${optimalColors.button.light.border} !important;
        color: ${optimalColors.button.light.color} !important;
      }
      
      .dynamic-contrast-container .btn-light:hover {
        background-color: ${optimalColors.button.light.hover.bg} !important;
        color: ${optimalColors.button.light.hover.color} !important;
      }
      
      .dynamic-contrast-container .btn-primary {
        background-color: ${optimalColors.button.primary.bg} !important;
        border-color: ${optimalColors.button.primary.border} !important;
        color: ${optimalColors.button.primary.color} !important;
      }
      
      .dynamic-contrast-container .btn-primary:hover {
        background-color: ${optimalColors.button.primary.hover.bg} !important;
        color: ${optimalColors.button.primary.hover.color} !important;
      }
      
      .dynamic-contrast-container .btn-success {
        background-color: ${optimalColors.button.success.bg} !important;
        border-color: ${optimalColors.button.success.border} !important;
        color: ${optimalColors.button.success.color} !important;
      }
      
      .dynamic-contrast-container .btn-success:hover {
        background-color: ${optimalColors.button.success.hover.bg} !important;
        color: ${optimalColors.button.success.hover.color} !important;
      }
      
      .dynamic-contrast-container .btn-warning {
        background-color: ${optimalColors.button.warning.bg} !important;
        border-color: ${optimalColors.button.warning.border} !important;
        color: ${optimalColors.button.warning.color} !important;
      }
      
      .dynamic-contrast-container .btn-warning:hover {
        background-color: ${optimalColors.button.warning.hover.bg} !important;
        color: ${optimalColors.button.warning.hover.color} !important;
      }
      
      .dynamic-contrast-container .btn-danger {
        background-color: ${optimalColors.button.danger.bg} !important;
        border-color: ${optimalColors.button.danger.border} !important;
        color: ${optimalColors.button.danger.color} !important;
      }
      
      .dynamic-contrast-container .btn-danger:hover {
        background-color: ${optimalColors.button.danger.hover.bg} !important;
        color: ${optimalColors.button.danger.hover.color} !important;
      }
      
      .dynamic-contrast-container .badge-light {
        background-color: ${optimalColors.badge.light.bg} !important;
        color: ${optimalColors.badge.light.color} !important;
        border: 1px solid ${optimalColors.badge.light.border} !important;
      }
      
      .dynamic-contrast-container .badge-info {
        background-color: ${optimalColors.badge.info.bg} !important;
        color: ${optimalColors.badge.info.color} !important;
        border: 1px solid ${optimalColors.badge.info.border} !important;
      }
      
      .dynamic-contrast-container .badge-secondary {
        background-color: ${optimalColors.badge.secondary.bg} !important;
        color: ${optimalColors.badge.secondary.color} !important;
        border: 1px solid ${optimalColors.badge.secondary.border} !important;
      }
      
      .dynamic-contrast-container .badge-warning {
        background-color: ${optimalColors.badge.warning.bg} !important;
        color: ${optimalColors.badge.warning.color} !important;
        border: 1px solid ${optimalColors.badge.warning.border} !important;
      }
      
      .dynamic-contrast-container .badge-success {
        background-color: ${optimalColors.badge.success.bg} !important;
        color: ${optimalColors.badge.success.color} !important;
        border: 1px solid ${optimalColors.badge.success.border} !important;
      }
      
      .dynamic-contrast-container .badge-danger {
        background-color: ${optimalColors.badge.danger.bg} !important;
        color: ${optimalColors.badge.danger.color} !important;
        border: 1px solid ${optimalColors.badge.danger.border} !important;
      }
      
      .dynamic-contrast-container .text-muted {
        color: ${optimalColors.subtitle} !important;
      }
      
      .dynamic-contrast-container .border {
        border-color: ${optimalColors.border} !important;
      }
      
      .dynamic-contrast-container .vr {
        background-color: ${optimalColors.separator} !important;
      }
      
      .dynamic-contrast-container h1,
      .dynamic-contrast-container h2,
      .dynamic-contrast-container h3,
      .dynamic-contrast-container h4,
      .dynamic-contrast-container h5,
      .dynamic-contrast-container h6 {
        color: ${optimalColors.text} !important;
      }
      
      .dynamic-contrast-container .cicon svg {
        color: ${optimalColors.text} !important;
      }
    `;

    const containerProps = {
      className: `dynamic-contrast-container ${className}`,
      style: {
        backgroundColor,
        color: optimalColors.text,
        ...props.style
      }
    };

    const ContainerElement = containerElement;

    return (
      <>
        <style>{dynamicStyles}</style>
        <ContainerElement {...containerProps}>
          <WrappedComponent 
            {...props} 
            dynamicColors={optimalColors}
            backgroundColor={backgroundColor}
          />
        </ContainerElement>
      </>
    );
  };

  DynamicContrastComponent.displayName = `withDynamicContrast(${WrappedComponent.displayName || WrappedComponent.name})`;

  return DynamicContrastComponent;
};

/**
 * Simple component wrapper for applying dynamic contrast without HOC
 */
export const DynamicContrastWrapper = ({ 
  children, 
  colorSource = 'headerBg', 
  className = '',
  style = {},
  element: Element = 'div',
  ...props 
}) => {
  const customization = useSelector((state) => state.customization);
  const backgroundColor = customization[colorSource] || '#ffffff';
  const optimalColors = getOptimalColors(backgroundColor);

  const dynamicStyles = `
    .dynamic-contrast-wrapper-${colorSource} {
      background-color: ${backgroundColor};
      color: ${optimalColors.text};
    }
    
    .dynamic-contrast-wrapper-${colorSource} .btn-light {
      background-color: ${optimalColors.button.light.bg} !important;
      border-color: ${optimalColors.button.light.border} !important;
      color: ${optimalColors.button.light.color} !important;
    }
    
    .dynamic-contrast-wrapper-${colorSource} .btn-light:hover {
      background-color: ${optimalColors.button.light.hover.bg} !important;
      color: ${optimalColors.button.light.hover.color} !important;
    }
    
    .dynamic-contrast-wrapper-${colorSource} .btn-primary {
      background-color: ${optimalColors.button.primary.bg} !important;
      border-color: ${optimalColors.button.primary.border} !important;
      color: ${optimalColors.button.primary.color} !important;
    }
    
    .dynamic-contrast-wrapper-${colorSource} .btn-primary:hover {
      background-color: ${optimalColors.button.primary.hover.bg} !important;
      color: ${optimalColors.button.primary.hover.color} !important;
    }
    
    .dynamic-contrast-wrapper-${colorSource} .btn-success {
      background-color: ${optimalColors.button.success.bg} !important;
      border-color: ${optimalColors.button.success.border} !important;
      color: ${optimalColors.button.success.color} !important;
    }
    
    .dynamic-contrast-wrapper-${colorSource} .btn-success:hover {
      background-color: ${optimalColors.button.success.hover.bg} !important;
      color: ${optimalColors.button.success.hover.color} !important;
    }
    
    .dynamic-contrast-wrapper-${colorSource} .badge {
      background-color: ${optimalColors.badge.light.bg} !important;
      color: ${optimalColors.badge.light.color} !important;
      border: 1px solid ${optimalColors.badge.light.border} !important;
    }
    
    .dynamic-contrast-wrapper-${colorSource} .text-muted {
      color: ${optimalColors.subtitle} !important;
    }
    
    .dynamic-contrast-wrapper-${colorSource} h1,
    .dynamic-contrast-wrapper-${colorSource} h2,
    .dynamic-contrast-wrapper-${colorSource} h3,
    .dynamic-contrast-wrapper-${colorSource} h4,
    .dynamic-contrast-wrapper-${colorSource} h5,
    .dynamic-contrast-wrapper-${colorSource} h6 {
      color: ${optimalColors.text} !important;
    }
  `;

  return (
    <>
      <style>{dynamicStyles}</style>
      <Element 
        className={`dynamic-contrast-wrapper-${colorSource} ${className}`}
        style={{
          backgroundColor,
          color: optimalColors.text,
          ...style
        }}
        {...props}
      >
        {children}
      </Element>
    </>
  );
};

export default withDynamicContrast;
