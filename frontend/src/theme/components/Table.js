/**
 * Premium Table Component Styles
 *
 * Enhanced rows, hover states, zebra striping
 * All styles use semantic tokens - no hardcoded colors
 * Compatible with customization system
 */

export const Table = {
  // ============================================================================
  // BASE STYLES - Applied to all tables
  // ============================================================================
  baseStyle: {
    table: {
      fontVariantNumeric: 'lining-nums tabular-nums',
      borderCollapse: 'separate',
      borderSpacing: 0,
      width: 'full',
      fontSize: 'sm',
    },
    thead: {
      bgGradient: 'linear-gradient(180deg, var(--chakra-colors-table-headerBg) 0%, var(--chakra-colors-surface-subtle) 100%)',
      position: 'sticky',
      top: 0,
      zIndex: 1,
    },
    th: {
      fontWeight: 'semibold',
      textTransform: 'uppercase',
      letterSpacing: 'wider',
      fontSize: 'xs',
      color: 'text.secondary',
      textAlign: 'start',
      px: 4,
      py: 3,
      borderBottom: '2px solid',
      borderColor: 'table.border',
      whiteSpace: 'nowrap',
    },
    tbody: {
      bg: 'table.bg',
    },
    tr: {
      transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
    td: {
      px: 4,
      py: 3,
      borderBottom: '1px solid',
      borderColor: 'table.border',
      color: 'text.primary',
    },
    tfoot: {
      tr: {
        bg: 'table.footerBg',
        '&:last-of-type': {
          th: { borderBottomWidth: 0 },
        },
      },
    },
    caption: {
      mt: 4,
      fontWeight: 'medium',
      fontSize: 'sm',
      color: 'text.secondary',
    },
  },

  // ============================================================================
  // SIZE VARIANTS
  // ============================================================================
  sizes: {
    sm: {
      th: {
        px: 3,
        py: 2,
        fontSize: '2xs',
      },
      td: {
        px: 3,
        py: 2,
        fontSize: 'xs',
      },
      caption: {
        fontSize: 'xs',
      },
    },
    md: {
      th: {
        px: 4,
        py: 3,
        fontSize: 'xs',
      },
      td: {
        px: 4,
        py: 3,
        fontSize: 'sm',
      },
      caption: {
        fontSize: 'sm',
      },
    },
    lg: {
      th: {
        px: 5,
        py: 4,
        fontSize: 'sm',
      },
      td: {
        px: 5,
        py: 4,
        fontSize: 'md',
      },
      caption: {
        fontSize: 'md',
      },
    },
  },

  // ============================================================================
  // STYLE VARIANTS
  // ============================================================================
  variants: {
    // SIMPLE - Basic table with borders
    simple: {
      th: {
        borderBottom: '2px solid',
        borderColor: 'table.border',
      },
      td: {
        borderBottom: '1px solid',
        borderColor: 'table.border',
      },
      tbody: {
        tr: {
          _hover: {
            bg: 'table.rowHover',
          },
        },
      },
    },

    // STRIPED - Zebra striping
    striped: {
      thead: {
        bg: 'table.headerBg',
      },
      tbody: {
        tr: {
          _odd: {
            bg: 'table.rowStriped',
          },
          _hover: {
            bg: 'table.rowHover',
          },
        },
      },
      td: {
        borderBottom: '1px solid',
        borderColor: 'table.border',
      },
    },

    // ELEVATED - Card-like table with shadow
    elevated: {
      table: {
        bg: 'surface.elevated',
        borderRadius: 'xl',
        overflow: 'hidden',
        shadow: 'md',
      },
      thead: {
        bg: 'table.headerBg',
      },
      th: {
        borderColor: 'table.border',
        _first: {
          borderTopLeftRadius: 'xl',
        },
        _last: {
          borderTopRightRadius: 'xl',
        },
      },
      tbody: {
        tr: {
          _hover: {
            bg: 'table.rowHover',
          },
          _last: {
            td: {
              borderBottomWidth: 0,
              _first: {
                borderBottomLeftRadius: 'xl',
              },
              _last: {
                borderBottomRightRadius: 'xl',
              },
            },
          },
        },
      },
    },

    // INTERACTIVE - Clickable rows
    interactive: {
      tbody: {
        tr: {
          cursor: 'pointer',
          userSelect: 'none',

          _hover: {
            bg: 'table.rowHover',
            transform: 'translateY(-1px)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          },

          _active: {
            transform: 'translateY(0)',
          },
        },
      },
      td: {
        borderBottom: '1px solid',
        borderColor: 'table.border',
      },
    },

    // BORDERED - Full borders on all cells
    bordered: {
      table: {
        border: '1px solid',
        borderColor: 'table.border',
        borderRadius: 'lg',
        overflow: 'hidden',
      },
      th: {
        borderBottom: '2px solid',
        borderColor: 'table.border',
        borderRight: '1px solid',
        borderRightColor: 'table.border',
        _last: {
          borderRight: 'none',
        },
      },
      td: {
        borderBottom: '1px solid',
        borderColor: 'table.border',
        borderRight: '1px solid',
        borderRightColor: 'table.border',
        _last: {
          borderRight: 'none',
        },
      },
      tbody: {
        tr: {
          _hover: {
            bg: 'table.rowHover',
          },
        },
      },
    },

    // UNSTYLED - No styling
    unstyled: {
      th: {
        borderBottom: 'none',
      },
      td: {
        borderBottom: 'none',
      },
    },

    // MINIMAL - Clean, minimal styling
    minimal: {
      thead: {
        bg: 'transparent',
      },
      th: {
        borderBottom: '1px solid',
        borderColor: 'border.subtle',
        textTransform: 'none',
        letterSpacing: 'normal',
        fontWeight: 'medium',
      },
      td: {
        borderBottom: 'none',
      },
      tbody: {
        tr: {
          borderBottom: '1px solid',
          borderColor: 'border.subtle',
          _last: {
            borderBottom: 'none',
          },
          _hover: {
            bg: 'surface.hover',
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
    variant: 'simple',
    colorScheme: 'gray',
  },
}

// TableContainer component
export const TableContainer = {
  baseStyle: {
    overflowX: 'auto',
    position: 'relative',

    // Fade indicators for overflow
    _before: {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      width: '40px',
      background: 'linear-gradient(90deg, var(--chakra-colors-surface-base) 0%, transparent 100%)',
      pointerEvents: 'none',
      zIndex: 1,
      opacity: 0,
      transition: 'opacity 200ms',
    },

    _after: {
      content: '""',
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      width: '40px',
      background: 'linear-gradient(-90deg, var(--chakra-colors-surface-base) 0%, transparent 100%)',
      pointerEvents: 'none',
      zIndex: 1,
      opacity: 0,
      transition: 'opacity 200ms',
    },
  },
}
