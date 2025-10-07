/**
 * Premium Modal Component Styles
 *
 * Enhanced overlay, backdrop blur, sophisticated shadows
 * All styles use semantic tokens - no hardcoded colors
 * Compatible with customization system
 */

export const Modal = {
  // ============================================================================
  // BASE STYLES - Applied to all modals
  // ============================================================================
  baseStyle: {
    overlay: {
      bg: 'blackAlpha.600',
      backdropFilter: 'blur(8px)',
      zIndex: 'modal',
    },
    dialogContainer: {
      display: 'flex',
      zIndex: 'modal',
      justifyContent: 'center',
      alignItems: 'center',
    },
    dialog: {
      borderRadius: { base: '0', md: '2xl' },
      bgGradient: 'linear-gradient(135deg, var(--chakra-colors-modal-bg) 0%, var(--chakra-colors-surface-subtle) 100%)',
      color: 'text.primary',
      boxShadow: '2xl',
      border: '1px solid',
      borderColor: 'modal.border',
      maxHeight: { base: '100vh', md: 'calc(100vh - 4rem)' },
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      px: 6,
      py: 5,
      fontSize: 'xl',
      fontWeight: 'semibold',
      borderBottom: '1px solid',
      borderColor: 'modal.borderInternal',
      color: 'text.primary',
      flexShrink: 0,
    },
    closeButton: {
      position: 'absolute',
      top: 4,
      insetEnd: 4,
      borderRadius: 'lg',
      color: 'text.secondary',
      transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      minW: '44px',
      minH: '44px',

      _hover: {
        bg: 'surface.hover',
        color: 'text.primary',
      },

      _active: {
        bg: 'surface.active',
      },

      _focus: {
        boxShadow: '0 0 0 2px var(--chakra-colors-interactive-primary)',
      },
    },
    body: {
      px: 6,
      py: 5,
      flex: 1,
      overflow: 'auto',
    },
    footer: {
      px: 6,
      py: 4,
      borderTop: '1px solid',
      borderColor: 'modal.borderInternal',
      flexShrink: 0,
    },
  },

  // ============================================================================
  // SIZE VARIANTS
  // ============================================================================
  sizes: {
    xs: {
      dialog: {
        maxW: 'xs',
      },
      header: {
        px: 4,
        py: 4,
        fontSize: 'lg',
      },
      body: {
        px: 4,
        py: 4,
      },
      footer: {
        px: 4,
        py: 3,
      },
    },
    sm: {
      dialog: {
        maxW: 'sm',
      },
      header: {
        px: 5,
        py: 4,
        fontSize: 'lg',
      },
      body: {
        px: 5,
        py: 4,
      },
      footer: {
        px: 5,
        py: 4,
      },
    },
    md: {
      dialog: {
        maxW: 'md',
      },
    },
    lg: {
      dialog: {
        maxW: 'lg',
      },
      header: {
        px: 7,
        py: 6,
        fontSize: '2xl',
      },
      body: {
        px: 7,
        py: 6,
      },
      footer: {
        px: 7,
        py: 5,
      },
    },
    xl: {
      dialog: {
        maxW: 'xl',
      },
      header: {
        px: 8,
        py: 6,
        fontSize: '2xl',
      },
      body: {
        px: 8,
        py: 6,
      },
      footer: {
        px: 8,
        py: 5,
      },
    },
    '2xl': {
      dialog: {
        maxW: '2xl',
      },
      header: {
        px: 8,
        py: 6,
        fontSize: '2xl',
      },
      body: {
        px: 8,
        py: 6,
      },
      footer: {
        px: 8,
        py: 5,
      },
    },
    '3xl': {
      dialog: {
        maxW: '3xl',
      },
      header: {
        px: 8,
        py: 6,
        fontSize: '2xl',
      },
      body: {
        px: 8,
        py: 6,
      },
      footer: {
        px: 8,
        py: 5,
      },
    },
    '4xl': {
      dialog: {
        maxW: '4xl',
      },
      header: {
        px: 8,
        py: 6,
        fontSize: '2xl',
      },
      body: {
        px: 8,
        py: 6,
      },
      footer: {
        px: 8,
        py: 5,
      },
    },
    '5xl': {
      dialog: {
        maxW: '5xl',
      },
      header: {
        px: 8,
        py: 6,
        fontSize: '2xl',
      },
      body: {
        px: 8,
        py: 6,
      },
      footer: {
        px: 8,
        py: 5,
      },
    },
    '6xl': {
      dialog: {
        maxW: '6xl',
      },
      header: {
        px: 8,
        py: 6,
        fontSize: '2xl',
      },
      body: {
        px: 8,
        py: 6,
      },
      footer: {
        px: 8,
        py: 5,
      },
    },
    full: {
      dialog: {
        maxW: '100vw',
        minH: '100vh',
        my: 0,
        borderRadius: 0,
      },
    },
  },

  // ============================================================================
  // DEFAULT PROPS
  // ============================================================================
  defaultProps: {
    size: 'md',
    isCentered: true,
    scrollBehavior: 'inside',
  },
}

// AlertDialog extends Modal
export const AlertDialog = {
  ...Modal,
  baseStyle: {
    ...Modal.baseStyle,
    dialog: {
      ...Modal.baseStyle.dialog,
      // Alert dialogs typically don't need as much height
    },
  },
}

// Drawer component
export const Drawer = {
  baseStyle: {
    overlay: {
      bg: 'blackAlpha.600',
      backdropFilter: 'blur(8px)',
      zIndex: 'modal',
    },
    dialogContainer: {
      display: 'flex',
      zIndex: 'modal',
      justifyContent: 'flex-end',
    },
    dialog: {
      bgGradient: 'linear-gradient(180deg, var(--chakra-colors-modal-bg) 0%, var(--chakra-colors-surface-subtle) 100%)',
      color: 'text.primary',
      boxShadow: '2xl',
      borderLeft: '1px solid',
      borderColor: 'modal.border',
      maxHeight: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      px: 6,
      py: 5,
      fontSize: 'xl',
      fontWeight: 'semibold',
      borderBottom: '1px solid',
      borderColor: 'modal.borderInternal',
      flexShrink: 0,
    },
    closeButton: {
      position: 'absolute',
      top: 4,
      insetEnd: 4,
      borderRadius: 'lg',
      color: 'text.secondary',
      transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',

      _hover: {
        bg: 'surface.hover',
        color: 'text.primary',
      },

      _active: {
        bg: 'surface.active',
      },
    },
    body: {
      px: 6,
      py: 5,
      flex: 1,
      overflow: 'auto',
    },
    footer: {
      px: 6,
      py: 4,
      borderTop: '1px solid',
      borderColor: 'modal.borderInternal',
      flexShrink: 0,
    },
  },
  sizes: {
    xs: { dialog: { maxW: 'xs' } },
    sm: { dialog: { maxW: 'sm' } },
    md: { dialog: { maxW: 'md' } },
    lg: { dialog: { maxW: 'lg' } },
    xl: { dialog: { maxW: 'xl' } },
    full: {
      dialog: {
        maxW: '100vw',
        height: '100vh',
      },
    },
  },
  defaultProps: {
    size: 'md',
  },
}
