/**
 * Premium Input Component Styles
 *
 * Covers Input, Select, and Textarea
 * All styles use semantic tokens - no hardcoded colors
 * Compatible with customization system
 */

export const Input = {
  // ============================================================================
  // BASE STYLES - Applied to all inputs
  // ============================================================================
  baseStyle: {
    field: {
      width: '100%',
      minWidth: 0,
      outline: 0,
      position: 'relative',
      appearance: 'none',
      transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      color: 'text.primary',
      bg: 'input.bg',
      borderColor: 'input.border',

      _placeholder: {
        color: 'text.tertiary',
      },

      _hover: {
        borderColor: 'input.borderHover',
      },

      _focus: {
        borderColor: 'interactive.primary',
        boxShadow: '0 0 0 1px var(--chakra-colors-interactive-primary)',
        bg: 'input.bgFocus',
      },

      _disabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
        bg: 'surface.disabled',
      },

      _invalid: {
        borderColor: 'status.error',
        boxShadow: '0 0 0 1px var(--chakra-colors-status-error)',
      },

      _readOnly: {
        boxShadow: 'none !important',
        userSelect: 'all',
      },
    },
    addon: {
      borderColor: 'input.border',
      bg: 'surface.subtle',
      color: 'text.secondary',
    },
  },

  // ============================================================================
  // SIZE VARIANTS
  // ============================================================================
  sizes: {
    xs: {
      field: {
        fontSize: 'xs',
        px: 2,
        h: 8,
        borderRadius: 'md',
      },
      addon: {
        fontSize: 'xs',
        px: 2,
        h: 8,
      },
    },
    sm: {
      field: {
        fontSize: 'sm',
        px: 3,
        h: 10,
        borderRadius: 'md',
      },
      addon: {
        fontSize: 'sm',
        px: 3,
        h: 10,
      },
    },
    md: {
      field: {
        fontSize: 'md',
        px: 4,
        h: '44px',  // WCAG AA touch target
        borderRadius: 'lg',
      },
      addon: {
        fontSize: 'md',
        px: 4,
        h: '44px',
      },
    },
    lg: {
      field: {
        fontSize: 'lg',
        px: 5,
        h: 14,
        borderRadius: 'lg',
      },
      addon: {
        fontSize: 'lg',
        px: 5,
        h: 14,
      },
    },
  },

  // ============================================================================
  // STYLE VARIANTS
  // ============================================================================
  variants: {
    // OUTLINE - Standard bordered input
    outline: {
      field: {
        border: '1px solid',
        borderColor: 'input.border',
        bg: 'input.bg',

        _hover: {
          borderColor: 'input.borderHover',
        },

        _focus: {
          borderColor: 'interactive.primary',
          boxShadow: '0 0 0 1px var(--chakra-colors-interactive-primary)',
        },
      },
    },

    // FILLED - Subtle background fill
    filled: {
      field: {
        border: '1px solid transparent',
        bg: 'surface.subtle',

        _hover: {
          bg: 'surface.hover',
        },

        _focus: {
          bg: 'input.bgFocus',
          borderColor: 'interactive.primary',
          boxShadow: '0 0 0 1px var(--chakra-colors-interactive-primary)',
        },
      },
    },

    // ELEVATED - Card-like input with shadow
    elevated: {
      field: {
        border: '1px solid',
        borderColor: 'border.subtle',
        bgGradient: 'linear-gradient(135deg, var(--chakra-colors-surface-elevated) 0%, var(--chakra-colors-surface-subtle) 100%)',
        shadow: 'sm',
        
        _hover: {
          shadow: 'md',
          borderColor: 'border.default',
          bgGradient: 'linear-gradient(135deg, var(--chakra-colors-surface-base) 0%, var(--chakra-colors-surface-subtle) 100%)',
        },
        
        _focus: {
          borderColor: 'interactive.primary',
          boxShadow: '0 0 0 1px var(--chakra-colors-interactive-primary), 0 4px 12px rgba(0, 0, 0, 0.1)',
          transform: 'translateY(-1px)',
          bg: 'input.bgFocus',
        },
      },
    },    // FLUSHED - Minimal bottom border only
    flushed: {
      field: {
        px: 0,
        border: 'none',
        borderBottom: '2px solid',
        borderColor: 'border.default',
        borderRadius: 0,
        bg: 'transparent',

        _focus: {
          borderColor: 'interactive.primary',
          boxShadow: 'none',
        },
      },
    },

    // UNSTYLED - No visible styling
    unstyled: {
      field: {
        bg: 'transparent',
        px: 0,
        h: 'auto',
        border: 'none',

        _focus: {
          boxShadow: 'none',
        },
      },
    },

    // GLASS - Modern glassmorphism
    glass: {
      field: {
        bg: 'whiteAlpha.100',
        backdropFilter: 'blur(12px) saturate(180%)',
        border: '1px solid',
        borderColor: 'whiteAlpha.200',

        _dark: {
          bg: 'whiteAlpha.50',
          borderColor: 'whiteAlpha.100',
        },

        _hover: {
          bg: 'whiteAlpha.150',
          borderColor: 'whiteAlpha.300',
          _dark: {
            bg: 'whiteAlpha.100',
            borderColor: 'whiteAlpha.200',
          },
        },

        _focus: {
          bg: 'whiteAlpha.200',
          borderColor: 'interactive.primary',
          boxShadow: '0 0 0 1px var(--chakra-colors-interactive-primary)',
          _dark: {
            bg: 'whiteAlpha.150',
          },
        },
      },
    },
  },

  // ============================================================================
  // DEFAULT PROPS
  // ============================================================================
  defaultProps: {
    size: 'md',
    variant: 'outline',
    focusBorderColor: 'interactive.primary',
    errorBorderColor: 'status.error',
  },
}

// Select extends Input styles
export const Select = {
  ...Input,
  baseStyle: {
    ...Input.baseStyle,
    field: {
      ...Input.baseStyle.field,
      paddingRight: 8,

      _placeholder: {
        color: 'text.tertiary',
      },
    },
    icon: {
      color: 'text.secondary',
      fontSize: '1.25rem',
    },
  },
}

// Textarea extends Input styles
export const Textarea = {
  ...Input,
  baseStyle: {
    ...Input.baseStyle.field,
    paddingY: 3,
    minHeight: 20,
    lineHeight: 'short',
    verticalAlign: 'top',
  },
}
