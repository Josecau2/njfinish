/**
 * Premium Button Component Styles
 *
 * Multiple variants for different use cases
 * All styles use semantic tokens - no hardcoded colors
 * Compatible with customization system
 */

export const Button = {
  // ============================================================================
  // BASE STYLES - Applied to all buttons
  // ============================================================================
  baseStyle: {
    fontWeight: 'semibold',
    borderRadius: 'lg',
    minH: '44px',  // WCAG AA touch target
    minW: '44px',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    whiteSpace: 'normal', // Allow text wrapping for long labels
    textAlign: 'center',
    wordBreak: 'break-word', // Break long words if needed
    lineHeight: '1.4', // Comfortable line height for multi-line text
    py: 2, // Vertical padding to accommodate wrapped text

    _focusVisible: {
      outline: 'none',
      ring: 3,
      ringColor: 'interactive.primary',
      ringOpacity: 0.3,
    },

    _hover: {
      transform: 'translateY(-1px)',
      _disabled: {
        transform: 'none',
      },
    },

    _active: {
      transform: 'translateY(0)',
    },

    _disabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },

  // ============================================================================
  // SIZE VARIANTS
  // ============================================================================
  sizes: {
    sm: {
      minH: '36px',
      minW: '36px',
      fontSize: 'sm',
      px: 4,
      py: 2,
      gap: 2,
    },
    md: {
      minH: '44px',
      minW: '44px',
      fontSize: 'md',
      px: 6,
      py: 2.5,
      gap: 2,
    },
    lg: {
      minH: '52px',
      minW: '52px',
      fontSize: 'lg',
      px: 8,
      py: 3,
      gap: 3,
    },
    xl: {
      minH: '60px',
      minW: '60px',
      fontSize: 'xl',
      px: 10,
      py: 3.5,
      gap: 3,
    },
  },

  // ============================================================================
  // STYLE VARIANTS
  // ============================================================================
  variants: {
    // PRIMARY - Main brand button
    solid: {
      bg: 'interactive.primary',
      color: 'text.inverse',
      shadow: 'sm',

      _hover: {
        bg: 'interactive.primaryHover',
        shadow: 'md',
        _disabled: {
          bg: 'interactive.primary',
          shadow: 'sm',
        },
      },

      _active: {
        bg: 'interactive.primaryActive',
        shadow: 'xs',
      },
    },

    // OUTLINE - Secondary actions
    outline: {
      borderWidth: '2px',
      borderColor: 'interactive.primary',
      color: 'interactive.primary',
      bg: 'transparent',

      _hover: {
        bg: 'interactive.primarySubtle',
        borderColor: 'interactive.primaryHover',
        color: 'interactive.primaryHover',
      },

      _active: {
        bg: 'interactive.primarySubtle',
        borderColor: 'interactive.primaryActive',
        color: 'interactive.primaryActive',
      },
    },

    // GHOST - Tertiary actions
    ghost: {
      color: 'interactive.primary',
      bg: 'transparent',

      _hover: {
        bg: 'interactive.primarySubtle',
        color: 'interactive.primaryHover',
      },

      _active: {
        bg: 'interactive.primarySubtle',
        color: 'interactive.primaryActive',
      },
    },

    // GRADIENT - Premium CTA button with customization color
    gradient: {
      bgGradient: 'linear(135deg, var(--chakra-colors-brand-500), var(--chakra-colors-brand-600))',
      color: 'text.inverse',
      shadow: 'md',
      position: 'relative',
      overflow: 'hidden',

      _before: {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgGradient: 'linear(135deg, var(--chakra-colors-brand-400), var(--chakra-colors-brand-500))',
        opacity: 0,
        transition: 'opacity 300ms',
      },

      _hover: {
        shadow: 'lg',
        transform: 'translateY(-2px)',
        
        _before: {
          opacity: 1,
        },
      },

      _active: {
        transform: 'translateY(-1px)',
        shadow: 'md',
      },
    },

    // GLASS - Modern glassmorphism effect
    glass: {
      bg: 'whiteAlpha.200',
      backdropFilter: 'blur(10px) saturate(180%)',
      border: '1px solid',
      borderColor: 'whiteAlpha.300',
      color: 'text.primary',
      shadow: 'sm',

      _dark: {
        bg: 'whiteAlpha.100',
        borderColor: 'whiteAlpha.200',
      },

      _hover: {
        bg: 'whiteAlpha.300',
        borderColor: 'whiteAlpha.400',
        shadow: 'md',
        _dark: {
          bg: 'whiteAlpha.200',
          borderColor: 'whiteAlpha.300',
        },
      },

      _active: {
        bg: 'whiteAlpha.400',
        shadow: 'xs',
        _dark: {
          bg: 'whiteAlpha.300',
        },
      },
    },

    // ELEVATED - Card-like button
    elevated: {
      bg: 'surface.elevated',
      color: 'text.primary',
      border: '1px solid',
      borderColor: 'border.default',
      shadow: 'md',

      _hover: {
        bg: 'surface.hover',
        borderColor: 'border.hover',
        shadow: 'lg',
      },

      _active: {
        bg: 'surface.base',
        shadow: 'sm',
      },
    },

    // LINK - Text-only button
    link: {
      color: 'text.link',
      textDecoration: 'none',
      minW: 'auto',
      h: 'auto',
      p: 0,

      _hover: {
        textDecoration: 'underline',
        transform: 'none',
      },

      _active: {
        opacity: 0.7,
      },
    },

    // STATUS VARIANTS
    success: {
      bg: 'status.success',
      color: 'white',

      _hover: {
        bg: 'green.600',
        _dark: { bg: 'green.500' },
      },

      _active: {
        bg: 'green.700',
        _dark: { bg: 'green.600' },
      },
    },

    error: {
      bg: 'status.error',
      color: 'white',

      _hover: {
        bg: 'red.600',
        _dark: { bg: 'red.500' },
      },

      _active: {
        bg: 'red.700',
        _dark: { bg: 'red.600' },
      },
    },

    warning: {
      bg: 'status.warning',
      color: 'white',

      _hover: {
        bg: 'orange.600',
        _dark: { bg: 'orange.500' },
      },

      _active: {
        bg: 'orange.700',
        _dark: { bg: 'orange.600' },
      },
    },
  },

  // ============================================================================
  // DEFAULT PROPS
  // ============================================================================
  defaultProps: {
    size: 'md',
    variant: 'solid',
    colorScheme: 'brand',
  },
}
