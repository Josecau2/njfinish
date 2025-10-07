/**
 * Premium Card Component Styles
 *
 * Multiple variants for different visual hierarchies
 * All styles use semantic tokens - no hardcoded colors
 * Compatible with customization system
 */

export const Card = {
  // ============================================================================
  // BASE STYLES - Applied to all cards
  // ============================================================================
  baseStyle: {
    container: {
      borderRadius: 'xl',
      overflow: 'hidden',
      transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
    },
    header: {
      px: 6,
      py: 5,
      borderBottomWidth: '1px',
      borderBottomColor: 'border.subtle',
    },
    body: {
      px: 6,
      py: 5,
    },
    footer: {
      px: 6,
      py: 4,
      borderTopWidth: '1px',
      borderTopColor: 'border.subtle',
    },
  },

  // ============================================================================
  // SIZE VARIANTS
  // ============================================================================
  sizes: {
    sm: {
      container: {
        borderRadius: 'lg',
      },
      header: { px: 4, py: 3 },
      body: { px: 4, py: 3 },
      footer: { px: 4, py: 3 },
    },
    md: {
      container: {
        borderRadius: 'xl',
      },
      header: { px: 6, py: 5 },
      body: { px: 6, py: 5 },
      footer: { px: 6, py: 4 },
    },
    lg: {
      container: {
        borderRadius: '2xl',
      },
      header: { px: 8, py: 6 },
      body: { px: 8, py: 6 },
      footer: { px: 8, py: 5 },
    },
  },

  // ============================================================================
  // STYLE VARIANTS
  // ============================================================================
  variants: {
    // ELEVATED - Standard card with shadow
    elevated: {
      container: {
        bgGradient: 'linear-gradient(135deg, var(--chakra-colors-surface-elevated) 0%, var(--chakra-colors-surface-subtle) 100%)',
        shadow: 'md',
        border: '1px solid',
        borderColor: 'border.subtle',
        
        _hover: {
          shadow: 'lg',
          transform: 'translateY(-2px)',
          bgGradient: 'linear-gradient(135deg, var(--chakra-colors-surface-base) 0%, var(--chakra-colors-surface-subtle) 100%)',
        },
      },
    },

    // OUTLINE - Flat card with border
    outline: {
      container: {
        bg: 'surface.base',
        border: '1px solid',
        borderColor: 'border.default',
        shadow: 'none',
        
        _hover: {
          borderColor: 'border.strong',
          shadow: 'sm',
          bgGradient: 'linear-gradient(135deg, var(--chakra-colors-surface-base) 0%, var(--chakra-colors-surface-hover) 100%)',
        },
      },
    },

    // FILLED - Subtle background, no border
    filled: {
      container: {
        bgGradient: 'linear-gradient(135deg, var(--chakra-colors-surface-subtle) 0%, var(--chakra-colors-surface-hover) 100%)',
        border: 'none',
        shadow: 'none',
        
        _hover: {
          bgGradient: 'linear-gradient(135deg, var(--chakra-colors-surface-hover) 0%, var(--chakra-colors-surface-active) 100%)',
        },
      },
    },    // GLASS - Modern glassmorphism
    glass: {
      container: {
        bg: 'whiteAlpha.100',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid',
        borderColor: 'whiteAlpha.200',
        shadow: 'lg',

        _dark: {
          bg: 'whiteAlpha.50',
          borderColor: 'whiteAlpha.100',
        },

        _hover: {
          bg: 'whiteAlpha.150',
          borderColor: 'whiteAlpha.300',
          shadow: 'xl',
          transform: 'translateY(-2px)',
          _dark: {
            bg: 'whiteAlpha.100',
            borderColor: 'whiteAlpha.200',
          },
        },
      },
    },

    // GRADIENT BORDER - Ultra premium look
    gradientBorder: {
      container: {
        bg: 'surface.elevated',
        position: 'relative',
        shadow: 'md',

        _before: {
          content: '""',
          position: 'absolute',
          inset: '-2px',
          borderRadius: 'inherit',
          padding: '2px',
          background: 'linear-gradient(135deg, var(--chakra-colors-brand-400), var(--chakra-colors-purple-400), var(--chakra-colors-pink-400))',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          zIndex: -1,
        },

        _hover: {
          shadow: 'lg',
          transform: 'translateY(-2px)',
        },
      },
    },

    // INTERACTIVE - Clickable card
    interactive: {
      container: {
        bg: 'surface.elevated',
        shadow: 'md',
        border: '1px solid',
        borderColor: 'border.subtle',
        cursor: 'pointer',
        userSelect: 'none',

        _hover: {
          bg: 'surface.hover',
          borderColor: 'border.default',
          shadow: 'lg',
          transform: 'translateY(-2px)',
        },

        _active: {
          transform: 'translateY(0)',
          shadow: 'md',
        },
      },
    },

    // FLAT - No shadow, minimal styling
    flat: {
      container: {
        bg: 'transparent',
        border: 'none',
        shadow: 'none',
      },
    },

    // STATUS VARIANTS
    success: {
      container: {
        bg: 'status.successBg',
        border: '1px solid',
        borderColor: 'status.successBorder',
        shadow: 'sm',
      },
      header: {
        borderBottomColor: 'status.successBorder',
      },
      footer: {
        borderTopColor: 'status.successBorder',
      },
    },

    error: {
      container: {
        bg: 'status.errorBg',
        border: '1px solid',
        borderColor: 'status.errorBorder',
        shadow: 'sm',
      },
      header: {
        borderBottomColor: 'status.errorBorder',
      },
      footer: {
        borderTopColor: 'status.errorBorder',
      },
    },

    warning: {
      container: {
        bg: 'status.warningBg',
        border: '1px solid',
        borderColor: 'status.warningBorder',
        shadow: 'sm',
      },
      header: {
        borderBottomColor: 'status.warningBorder',
      },
      footer: {
        borderTopColor: 'status.warningBorder',
      },
    },

    info: {
      container: {
        bg: 'status.infoBg',
        border: '1px solid',
        borderColor: 'status.infoBorder',
        shadow: 'sm',
      },
      header: {
        borderBottomColor: 'status.infoBorder',
      },
      footer: {
        borderTopColor: 'status.infoBorder',
      },
    },
  },

  // ============================================================================
  // DEFAULT PROPS
  // ============================================================================
  defaultProps: {
    size: 'md',
    variant: 'elevated',
  },
}
