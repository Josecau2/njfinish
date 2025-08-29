import React from 'react';
import { useSelector } from 'react-redux';
import { CRow, CCol, CCard, CCardBody, CBadge } from '@coreui/react';

/**
 * Universal Page Header Component with Automatic Contrast Detection
 * 
 * This component:
 * - Uses customization colors from Redux store
 * - Automatically calculates optimal contrast for text, buttons, and badges
 * - Provides consistent styling across all pages
 * - Supports children elements (buttons, badges, etc.) with smart contrast
 * - Offers mobile-responsive layouts
 * 
 * Mobile Layout Options:
 * - 'stack' (default): Title/content stacks vertically on mobile, horizontal on desktop
 * - 'inline': Keeps content inline even on mobile (for simple headers)
 * - 'compact': Minimal spacing, wrapping content for dense layouts
 * 
 * Usage:
 * <PageHeader 
 *   title="Page Title" 
 *   mobileLayout="stack"
 *   rightContent={<button>Action</button>}
 * />
 */
const PageHeader = ({ 
  title, 
  subtitle, 
  children, 
  rightContent,
  className = '', 
  cardClassName = '',
  icon: IconComponent,
  iconStyle = {},
  badge,
  badges,
  mobileLayout = 'stack' // 'stack', 'inline', 'compact'
}) => {
  const customization = useSelector((state) => state.customization);
  
  // Validate and sanitize props
  const sanitizedBadges = Array.isArray(badges) ? badges.filter(b => b && typeof b === 'object' && b.text) : [];
  const sanitizedBadge = badge && typeof badge === 'object' && badge.text ? badge : null;
  const validIconComponent = IconComponent && typeof IconComponent === 'function' ? IconComponent : null;
  
  // Enhanced contrast calculation function
  const getContrastColor = (backgroundColor) => {
    if (!backgroundColor) return '#ffffff';
    
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance using WCAG formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return high contrast colors
    return luminance > 0.5 ? '#2d3748' : '#ffffff';
  };

  // Get optimal colors for different elements
  const getOptimalColors = (backgroundColor) => {
    const textColor = getContrastColor(backgroundColor);
    const isLight = textColor === '#2d3748';
    
    return {
      text: textColor,
      subtitle: isLight ? 'rgba(45, 55, 72, 0.6)' : 'rgba(255, 255, 255, 0.6)',
      button: {
        light: {
          bg: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.15)',
          color: isLight ? '#2d3748' : textColor,
          border: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.3)',
          hover: {
            bg: isLight ? '#f7fafc' : 'rgba(255, 255, 255, 0.25)',
            color: isLight ? '#1a202c' : textColor
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
        }
      },
      badge: {
        light: {
          bg: isLight ? '#ffffff' : '#ffffff',
          color: isLight ? '#2d3748' : '#2d3748',
          border: isLight ? '#e2e8f0' : '#d1d5db'
        },
        info: {
          bg: isLight ? '#0dcaf0' : '#0ea5e9',
          color: '#ffffff',
          border: isLight ? '#0dcaf0' : '#0ea5e9'
        },
        secondary: {
          bg: isLight ? '#495057' : '#6c757d',
          color: '#ffffff',
          border: isLight ? '#495057' : '#6c757d'
        }
      },
      separator: isLight ? 'rgba(45, 55, 72, 0.2)' : 'rgba(255, 255, 255, 0.3)'
    };
  };

  const backgroundColor = customization.headerBg || '#ffffff';
  const optimalColors = getOptimalColors(backgroundColor);

  // Generate dynamic CSS for the component
  const dynamicStyles = `
    .page-header-dynamic {
      background-color: ${backgroundColor} !important;
      color: ${optimalColors.text} !important;
    }
    
    .page-header-dynamic .page-header-title {
      color: ${optimalColors.text} !important;
    }
    
    .page-header-dynamic .page-header-subtitle {
      color: ${optimalColors.subtitle} !important;
    }
    
    .page-header-dynamic .btn-light {
      background-color: ${optimalColors.button.light.bg} !important;
      border: 1px solid ${optimalColors.button.light.border} !important;
      color: ${optimalColors.button.light.color} !important;
    }
    
    .page-header-dynamic .btn-light:hover {
      background-color: ${optimalColors.button.light.hover.bg} !important;
      color: ${optimalColors.button.light.hover.color} !important;
      border: 1px solid ${optimalColors.button.light.border} !important;
    }
    
    .page-header-dynamic .btn-primary {
      background-color: ${optimalColors.button.primary.bg} !important;
      border: 1px solid ${optimalColors.button.primary.border} !important;
      color: ${optimalColors.button.primary.color} !important;
    }
    
    .page-header-dynamic .btn-primary:hover {
      background-color: ${optimalColors.button.primary.hover.bg} !important;
      color: ${optimalColors.button.primary.hover.color} !important;
      border: 1px solid ${optimalColors.button.primary.border} !important;
    }
    
    .page-header-dynamic .btn-success {
      background-color: ${optimalColors.button.success.bg} !important;
      border: 1px solid ${optimalColors.button.success.border} !important;
      color: ${optimalColors.button.success.color} !important;
    }
    
    .page-header-dynamic .btn-success:hover {
      background-color: ${optimalColors.button.success.hover.bg} !important;
      color: ${optimalColors.button.success.hover.color} !important;
      border: 1px solid ${optimalColors.button.success.border} !important;
    }
    
    /* Global button overrides for customized header color */
    .modal .btn-primary,
    .btn-primary.use-header-color {
      background-color: ${backgroundColor} !important;
      border-color: ${backgroundColor} !important;
      color: ${optimalColors.text} !important;
    }
    
    .modal .btn-primary:hover,
    .btn-primary.use-header-color:hover {
      background-color: ${backgroundColor} !important;
      border-color: ${backgroundColor} !important;
      color: ${optimalColors.text} !important;
      opacity: 0.9 !important;
    }
    
    .modal .btn-primary:focus,
    .btn-primary.use-header-color:focus {
      background-color: ${backgroundColor} !important;
      border-color: ${backgroundColor} !important;
      color: ${optimalColors.text} !important;
      box-shadow: 0 0 0 0.2rem ${backgroundColor}40 !important;
    }
    
    /* Override all primary and info buttons globally to use header color */
    .btn-primary:not(.btn-secondary):not(.btn-danger):not(.btn-warning):not(.btn-success):not(.btn-light):not(.btn-dark):not(.no-header-style),
    .btn-info:not(.no-header-style) {
      background-color: ${backgroundColor} !important;
      border-color: ${backgroundColor} !important;
      color: ${optimalColors.text} !important;
    }
    
    .btn-primary:hover:not(.btn-secondary):not(.btn-danger):not(.btn-warning):not(.btn-success):not(.btn-light):not(.btn-dark):not(.no-header-style),
    .btn-info:hover:not(.no-header-style) {
      background-color: ${backgroundColor} !important;
      border-color: ${backgroundColor} !important;
      color: ${optimalColors.text} !important;
      opacity: 0.9 !important;
      filter: brightness(0.95) !important;
    }
    
    .btn-primary:focus:not(.btn-secondary):not(.btn-danger):not(.btn-warning):not(.btn-success):not(.btn-light):not(.btn-dark):not(.no-header-style),
    .btn-info:focus:not(.no-header-style) {
      background-color: ${backgroundColor} !important;
      border-color: ${backgroundColor} !important;
      color: ${optimalColors.text} !important;
      box-shadow: 0 0 0 0.2rem ${backgroundColor}40 !important;
    }
    
    .btn-primary:active:not(.btn-secondary):not(.btn-danger):not(.btn-warning):not(.btn-success):not(.btn-light):not(.btn-dark):not(.no-header-style),
    .btn-info:active:not(.no-header-style) {
      background-color: ${backgroundColor} !important;
      border-color: ${backgroundColor} !important;
      color: ${optimalColors.text} !important;
      filter: brightness(0.9) !important;
    }
    
    /* Override specific hardcoded styles from main.css */
    .btn-success,
    .btn-primary,
    .btn-secondary {
      --cui-btn-color: ${optimalColors.text} !important;
      --cui-btn-bg: ${backgroundColor} !important;
      --cui-btn-border-color: ${backgroundColor} !important;
      --cui-btn-hover-color: ${optimalColors.text} !important;
      --cui-btn-hover-bg: ${backgroundColor} !important;
      --cui-btn-hover-border-color: ${backgroundColor} !important;
      --cui-btn-active-color: ${optimalColors.text} !important;
      --cui-btn-active-bg: ${backgroundColor} !important;
      --cui-btn-active-border-color: ${backgroundColor} !important;
      --cui-btn-disabled-color: ${optimalColors.text} !important;
      --cui-btn-disabled-bg: ${backgroundColor} !important;
      --cui-btn-disabled-border-color: ${backgroundColor} !important;
    }
    
    .btn-outline-primary {
      --cui-btn-color: ${backgroundColor} !important;
      --cui-btn-border-color: ${backgroundColor} !important;
      --cui-btn-hover-color: ${optimalColors.text} !important;
      --cui-btn-hover-bg: ${backgroundColor} !important;
      --cui-btn-hover-border-color: ${backgroundColor} !important;
      --cui-btn-active-color: ${optimalColors.text} !important;
      --cui-btn-active-bg: ${backgroundColor} !important;
      --cui-btn-active-border-color: ${backgroundColor} !important;
      --cui-btn-disabled-color: ${backgroundColor} !important;
      --cui-btn-disabled-border-color: ${backgroundColor} !important;
    }
    
    /* Additional aggressive overrides for any cyan buttons */
    button[style*="#0dcaf0"],
    .btn[style*="#0dcaf0"],
    button[style*="rgb(13, 202, 240)"],
    .btn[style*="rgb(13, 202, 240)"] {
      background-color: ${backgroundColor} !important;
      border-color: ${backgroundColor} !important;
      color: ${optimalColors.text} !important;
    }
    
    .page-header-dynamic .badge-light {
      background-color: ${optimalColors.badge.light.bg} !important;
      color: ${optimalColors.badge.light.color} !important;
      border: 1px solid ${optimalColors.badge.light.border} !important;
    }
    
    .page-header-dynamic .badge-info {
      background-color: ${optimalColors.badge.info.bg} !important;
      color: ${optimalColors.badge.info.color} !important;
      border: 1px solid ${optimalColors.badge.info.border} !important;
    }
    
    .page-header-dynamic .badge-secondary {
      background-color: ${optimalColors.badge.secondary.bg} !important;
      color: ${optimalColors.badge.secondary.color} !important;
      border: 1px solid ${optimalColors.badge.secondary.border} !important;
    }
    
    .page-header-dynamic .header-separator {
      background-color: ${optimalColors.separator} !important;
    }
    
    .page-header-dynamic .cicon svg {
      color: ${optimalColors.text} !important;
    }
    
    .page-header-dynamic .text-muted {
      color: ${optimalColors.subtitle} !important;
    }
    
    .page-header-dynamic .vr {
      background-color: ${optimalColors.separator} !important;
      opacity: 1 !important;
    }
    
    /* Mobile-specific optimizations */
    @media (max-width: 767px) {
      .page-header-dynamic .card-body {
        padding: 0.75rem !important;
      }
      
      .page-header-dynamic .page-header-title {
        font-size: 1.125rem !important;
        margin-bottom: 0.25rem !important;
      }
      
      .page-header-dynamic .page-header-subtitle {
        font-size: 0.875rem !important;
      }
      
      .page-header-dynamic .badge {
        font-size: 0.75rem !important;
        padding: 0.25rem 0.5rem !important;
      }
      
      .page-header-dynamic .btn {
        font-size: 0.875rem !important;
        padding: 0.375rem 0.75rem !important;
      }
      
      .page-header-dynamic .btn-sm {
        font-size: 0.75rem !important;
        padding: 0.25rem 0.5rem !important;
      }
    }
    
    @media (max-width: 575px) {
      .page-header-dynamic .card-body {
        padding: 0.5rem !important;
      }
      
      .page-header-dynamic .page-header-title {
        font-size: 1rem !important;
      }
      
      .page-header-dynamic .btn {
        font-size: 0.75rem !important;
        padding: 0.25rem 0.5rem !important;
      }
    }
  `;

  // Get mobile layout classes based on mobileLayout prop
  const getMobileLayoutClasses = () => {
    switch (mobileLayout) {
      case 'inline':
        return 'align-items-center';
      case 'compact':
        return 'align-items-start';
      case 'stack':
      default:
        return 'align-items-start align-items-md-center';
    }
  };

  const getContentLayoutClasses = () => {
    switch (mobileLayout) {
      case 'inline':
        return 'd-flex flex-row justify-content-between align-items-center';
      case 'compact':
        return 'd-flex flex-column flex-sm-row gap-2';
      case 'stack':
      default:
        return 'd-flex flex-column flex-md-row justify-content-between gap-2';
    }
  };

  return (
    <>
      <style>{dynamicStyles}</style>
      <CCard 
        className={`border-0 shadow-sm mb-2 page-header-dynamic ${cardClassName}`}
      >
        <CCardBody className="py-4 py-md-4 py-2">
          <div className={getContentLayoutClasses()}>
            {/* Title and Badge Section */}
            <div className="d-flex align-items-center gap-2 gap-md-3 flex-grow-1">
              {validIconComponent && (
                <div 
                  className="d-flex align-items-center justify-content-center flex-shrink-0 d-none d-md-flex"
                  style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: optimalColors.button.light.bg,
                    borderRadius: '12px',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: optimalColors.button.light.border,
                    ...iconStyle
                  }}
                >
                  {React.createElement(validIconComponent, {
                    style: { 
                      fontSize: '24px', 
                      color: optimalColors.text 
                    }
                  })}
                </div>
              )}
              {/* Mobile compact icon */}
              {validIconComponent && (
                <div 
                  className="d-flex align-items-center justify-content-center flex-shrink-0 d-md-none"
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: optimalColors.button.light.bg,
                    borderRadius: '8px',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: optimalColors.button.light.border,
                    ...iconStyle
                  }}
                >
                  {React.createElement(validIconComponent, {
                    style: { 
                      fontSize: '16px', 
                      color: optimalColors.text 
                    }
                  })}
                </div>
              )}
              <div className="flex-grow-1">
                <h3 className="page-header-title mb-1 fw-bold fs-5 fs-md-4">{title}</h3>
                <div className={`d-flex align-items-center gap-2 gap-md-3 ${mobileLayout === 'compact' ? 'flex-wrap' : ''}`}>
                  {subtitle && (
                    <p className="page-header-subtitle mb-0">{subtitle}</p>
                  )}
                  {/* Render single badge */}
                  {sanitizedBadge && (
                    <CBadge 
                      color={sanitizedBadge.variant || 'light'} 
                      className="px-3 py-2"
                      style={{ 
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      {sanitizedBadge.text}
                    </CBadge>
                  )}
                  {/* Render multiple badges */}
                  {sanitizedBadges.length > 0 && sanitizedBadges.map((badge, index) => (
                    <CBadge 
                      key={index}
                      color={badge.variant || 'light'} 
                      className="px-3 py-2"
                      style={{ 
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: badge.variant === 'success' ? optimalColors.badge.info.bg : 
                                         badge.variant === 'dark' ? optimalColors.badge.secondary.bg :
                                         optimalColors.badge.light.bg,
                        color: badge.variant === 'success' ? optimalColors.badge.info.color : 
                               badge.variant === 'dark' ? optimalColors.badge.secondary.color :
                               optimalColors.badge.light.color
                      }}
                    >
                      {badge.text}
                    </CBadge>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Action Buttons Section */}
            {(children || rightContent) && (
              <div className={`d-flex gap-1 gap-md-2 align-items-center ${mobileLayout === 'stack' ? 'align-self-stretch align-self-md-center mt-2 mt-md-0' : ''} ${mobileLayout === 'compact' ? 'flex-wrap' : ''}`}>
                {rightContent ? rightContent : children}
              </div>
            )}
          </div>
        </CCardBody>
      </CCard>
    </>
  );
};

export default PageHeader;
