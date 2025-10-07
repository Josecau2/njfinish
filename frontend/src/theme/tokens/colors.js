/**
 * Semantic Color Tokens
 *
 * These tokens reference theme colors dynamically and work with your customization system.
 * Never use hardcoded color values - all colors reference brand/theme scales.
 *
 * Compatible with Redux customization state (headerBg, sidebarBg, etc.)
 */

export const semanticColors = {
  // ============================================================================
  // SURFACE COLORS - Backgrounds and container colors
  // ============================================================================
  surface: {
    base: {
      default: 'white',
      _dark: 'slate.900'
    },
    elevated: {
      default: 'white',
      _dark: 'slate.800'
    },
    overlay: {
      default: 'white',
      _dark: 'slate.850'
    },
    subtle: {
      default: 'slate.50',
      _dark: 'slate.900'
    },
    hover: {
      default: 'slate.50',
      _dark: 'slate.800'
    },
  },

  // ============================================================================
  // TEXT COLORS - All text throughout the app
  // ============================================================================
  text: {
    primary: {
      default: 'slate.900',
      _dark: 'slate.50'
    },
    secondary: {
      default: 'slate.600',
      _dark: 'slate.400'
    },
    tertiary: {
      default: 'slate.500',
      _dark: 'slate.500'
    },
    muted: {
      default: 'slate.400',
      _dark: 'slate.600'
    },
    inverse: {
      default: 'white',
      _dark: 'slate.900'
    },
    link: {
      default: 'brand.600',
      _dark: 'brand.400'
    },
  },

  // ============================================================================
  // BORDER COLORS - Lines, dividers, component borders
  // ============================================================================
  border: {
    default: {
      default: 'slate.200',
      _dark: 'slate.700'
    },
    strong: {
      default: 'slate.300',
      _dark: 'slate.600'
    },
    subtle: {
      default: 'slate.100',
      _dark: 'slate.800'
    },
    hover: {
      default: 'slate.400',
      _dark: 'slate.500'
    },
  },

  // ============================================================================
  // INTERACTIVE - Buttons, links, interactive elements
  // ============================================================================
  interactive: {
    primary: {
      default: 'brand.500',
      _dark: 'brand.400'
    },
    primaryHover: {
      default: 'brand.600',
      _dark: 'brand.500'
    },
    primaryActive: {
      default: 'brand.700',
      _dark: 'brand.600'
    },
    primarySubtle: {
      default: 'brand.50',
      _dark: 'brand.900'
    },
  },

  // ============================================================================
  // STATUS COLORS - Success, error, warning, info states
  // ============================================================================
  status: {
    success: {
      default: 'green.500',
      _dark: 'green.400'
    },
    successBg: {
      default: 'green.50',
      _dark: 'green.900'
    },
    successBorder: {
      default: 'green.200',
      _dark: 'green.800'
    },
    successText: {
      default: 'green.700',
      _dark: 'green.300'
    },

    error: {
      default: 'red.500',
      _dark: 'red.400'
    },
    errorBg: {
      default: 'red.50',
      _dark: 'red.900'
    },
    errorBorder: {
      default: 'red.200',
      _dark: 'red.800'
    },
    errorText: {
      default: 'red.700',
      _dark: 'red.300'
    },

    warning: {
      default: 'orange.500',
      _dark: 'orange.400'
    },
    warningBg: {
      default: 'orange.50',
      _dark: 'orange.900'
    },
    warningBorder: {
      default: 'orange.200',
      _dark: 'orange.800'
    },
    warningText: {
      default: 'orange.700',
      _dark: 'orange.300'
    },

    info: {
      default: 'blue.500',
      _dark: 'blue.400'
    },
    infoBg: {
      default: 'blue.50',
      _dark: 'blue.900'
    },
    infoBorder: {
      default: 'blue.200',
      _dark: 'blue.800'
    },
    infoText: {
      default: 'blue.700',
      _dark: 'blue.300'
    },
  },

  // ============================================================================
  // COMPONENT-SPECIFIC TOKENS
  // ============================================================================

  // Card colors
  card: {
    bg: {
      default: 'white',
      _dark: 'slate.800'
    },
    border: {
      default: 'slate.200',
      _dark: 'slate.700'
    },
    shadow: {
      default: 'blackAlpha.100',
      _dark: 'blackAlpha.400'
    },
  },

  // Modal colors
  modal: {
    overlay: {
      default: 'blackAlpha.600',
      _dark: 'blackAlpha.800'
    },
    bg: {
      default: 'white',
      _dark: 'slate.800'
    },
    headerBg: {
      default: 'slate.50',
      _dark: 'slate.900'
    },
  },

  // Input colors
  input: {
    bg: {
      default: 'white',
      _dark: 'slate.800'
    },
    border: {
      default: 'slate.300',
      _dark: 'slate.600'
    },
    borderHover: {
      default: 'slate.400',
      _dark: 'slate.500'
    },
    borderFocus: {
      default: 'brand.500',
      _dark: 'brand.400'
    },
    placeholder: {
      default: 'slate.400',
      _dark: 'slate.500'
    },
  },

  // Table colors
  table: {
    headerBg: {
      default: 'slate.50',
      _dark: 'slate.900'
    },
    rowEven: {
      default: 'white',
      _dark: 'slate.800'
    },
    rowOdd: {
      default: 'slate.50',
      _dark: 'slate.850'
    },
    rowHover: {
      default: 'brand.50',
      _dark: 'brand.900'
    },
    border: {
      default: 'slate.200',
      _dark: 'slate.700'
    },
  },

  // Badge colors
  badge: {
    neutral: {
      bg: { default: 'slate.100', _dark: 'slate.800' },
      text: { default: 'slate.700', _dark: 'slate.300' },
    },
    primary: {
      bg: { default: 'brand.100', _dark: 'brand.800' },
      text: { default: 'brand.700', _dark: 'brand.300' },
    },
  },
}
