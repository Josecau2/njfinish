import { extendTheme } from '@chakra-ui/react'

const brand = {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#2563eb',
  600: '#1d4ed8',
  700: '#1e40af',
  800: '#1e3a8a',
  900: '#172554',
}

const slate = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
}

const fonts = {
  heading: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  body: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}

const radii = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
}

const shadows = {
  xs: '0 1px 2px rgba(15, 23, 42, 0.06)',
  sm: '0 2px 4px rgba(15, 23, 42, 0.08)',
  md: '0 8px 20px rgba(15, 23, 42, 0.12)',
  lg: '0 16px 40px rgba(15, 23, 42, 0.16)',
}

const baseSemanticTokens = {
  colors: {
    // Base semantic colors
    background: { default: '#F8FAFC', _dark: '#0f172a' },
    surface: { default: '#FFFFFF', _dark: '#111827' },
    text: { default: '#0f172a', _dark: '#E2E8F0' },
    muted: { default: '#64748B', _dark: '#94A3B8' },
    border: { default: 'rgba(15, 23, 42, 0.08)', _dark: 'rgba(148, 163, 184, 0.24)' },
    focusRing: { default: 'rgba(37, 99, 235, 0.6)', _dark: 'rgba(59, 130, 246, 0.7)' },
    focusRingError: { default: 'rgba(220, 38, 38, 0.6)', _dark: 'rgba(248, 113, 113, 0.7)' },
    focusRingSuccess: { default: 'rgba(34, 197, 94, 0.6)', _dark: 'rgba(74, 222, 128, 0.7)' },

    // Additional semantic tokens for replacing hardcoded colors
    bgSubtle: { default: '#f8f9fa', _dark: '#1a1a1a' },
    bgHover: { default: '#e9ecef', _dark: '#2a2a2a' },
    bgActive: { default: '#dee2e6', _dark: '#3a3a3a' },
    textStrong: { default: '#212529', _dark: '#ffffff' },
    textSubtle: { default: '#6c757d', _dark: '#a0a0a0' },
    borderSubtle: { default: '#e9ecef', _dark: 'rgba(255, 255, 255, 0.1)' },
    borderStrong: { default: '#dee2e6', _dark: 'rgba(255, 255, 255, 0.2)' },

    // Status colors
    success: { default: '#28a745', _dark: '#4ade80' },
    successBg: { default: '#d4edda', _dark: 'rgba(74, 222, 128, 0.2)' },
    warning: { default: '#ffc107', _dark: '#fbbf24' },
    warningBg: { default: '#fff3cd', _dark: 'rgba(251, 191, 36, 0.2)' },
    error: { default: '#dc3545', _dark: '#f87171' },
    errorBg: { default: '#f8d7da', _dark: 'rgba(248, 113, 113, 0.2)' },
    info: { default: '#17a2b8', _dark: '#06b6d4' },
    infoBg: { default: '#d1ecf1', _dark: 'rgba(6, 182, 212, 0.2)' },

    // Component-specific colors (to replace hardcoded values)
    cardBg: { default: '#ffffff', _dark: '#1e293b' },
    cardBorder: { default: 'rgba(0, 0, 0, 0.125)', _dark: 'rgba(255, 255, 255, 0.1)' },
    modalOverlay: { default: 'rgba(0, 0, 0, 0.5)', _dark: 'rgba(0, 0, 0, 0.7)' },
    inputBg: { default: '#ffffff', _dark: '#1e293b' },
    inputBorder: { default: '#ced4da', _dark: 'rgba(255, 255, 255, 0.2)' },
    inputFocus: { default: '#80bdff', _dark: '#3b82f6' },

    // Legacy Bootstrap color replacements
    primary: { default: '#007bff', _dark: '#3b82f6' },
    primaryHover: { default: '#0056b3', _dark: '#2563eb' },
    secondary: { default: '#6c757d', _dark: '#94a3b8' },
    light: { default: '#f8f9fa', _dark: '#374151' },
    dark: { default: '#343a40', _dark: '#1f2937' },
  },
}

const Button = {
  baseStyle: {
    fontWeight: '600',
    borderRadius: 'md',
    _focusVisible: {
      boxShadow: '0 0 0 2px var(--chakra-colors-focusRing)',
      outline: 'none',
    },
    _active: {
      transform: 'scale(0.98)',
    },
    transitionProperty: 'transform, box-shadow, background-color, color, border-color',
    transitionDuration: '200ms',
  },
  sizes: {
    md: {
      h: '44px',
      minW: '44px',
      px: 5,
      fontSize: 'md',
      gap: 2,
    },
  },
  variants: {
    solid: {
      bg: 'brand.500',
      color: 'white',
      _hover: {
        bg: 'brand.600',
        _disabled: {
          bg: 'brand.300',
        },
      },
      _active: {
        bg: 'brand.700',
      },
    },
    outline: {
      borderWidth: '1px',
      borderColor: 'brand.500',
      color: 'brand.600',
      _hover: {
        bg: 'brand.50',
        _dark: {
          bg: 'whiteAlpha.100',
        },
      },
      _active: {
        borderColor: 'brand.700',
        color: 'brand.700',
        _dark: {
          borderColor: 'brand.400',
          color: 'brand.400',
        },
      },
      _dark: {
        borderColor: 'brand.400',
        color: 'brand.300',
      },
    },
    ghost: {
      color: 'brand.600',
      _hover: {
        bg: 'brand.50',
        _dark: {
          bg: 'whiteAlpha.100',
        },
      },
      _active: {
        color: 'brand.700',
        _dark: {
          color: 'brand.400',
        },
      },
      _dark: {
        color: 'brand.300',
      },
    },
  },
  defaultProps: {
    colorScheme: 'brand',
    size: 'md',
  },
}

const inputLikeComponent = {
  baseStyle: {
    field: {
      borderRadius: 'md',
      _focusVisible: {
        borderColor: 'brand.500',
        boxShadow: '0 0 0 2px var(--chakra-colors-focusRing)',
        outline: 'none',
      },
      _invalid: {
        borderColor: 'red.500',
        _focusVisible: {
          borderColor: 'red.500',
          boxShadow: '0 0 0 2px var(--chakra-colors-focusRingError)',
        },
      },
    },
  },
  sizes: {
    md: {
      field: {
        h: '44px',
        fontSize: 'sm',
        px: 3,
      },
    },
  },
  variants: {
    outline: {
      field: {
        borderWidth: '1px',
        borderColor: 'border',
        bg: 'surface',
        _hover: {
          borderColor: 'brand.300',
        },
        _focusVisible: {
          borderColor: 'brand.500',
        },
      },
    },
    filled: {
      field: {
        bg: 'slate.50',
        _hover: {
          bg: 'slate.100',
        },
        _focusVisible: {
          bg: 'surface',
        },
        _dark: {
          bg: 'gray.700',
          _hover: {
            bg: 'gray.600',
          },
          _focusVisible: {
            bg: 'gray.800',
          },
        },
      },
    },
  },
  defaultProps: {
    variant: 'outline',
    size: 'md',
  },
}

const Input = inputLikeComponent
const Select = inputLikeComponent
const Textarea = inputLikeComponent

const Modal = {
  baseStyle: {
    dialog: {
      borderRadius: { base: '0', md: 'lg' },  // Full-screen on mobile
      boxShadow: 'lg',
      border: '1px solid',
      borderColor: 'border',
      bg: 'surface',
      maxH: { base: '100vh', md: '90vh' },
      my: { base: 0, md: '3.75rem' },
    },
    dialogContainer: {
      alignItems: { base: 'stretch', md: 'center' },
    },
    closeButton: {
      minW: '44px',  // WCAG AA tap target
      minH: '44px',
    },
  },
}

const Drawer = {
  baseStyle: {
    dialog: {
      bg: 'surface',
      color: 'text',
      boxShadow: '2xl',
    },
  },
}

const Tabs = {
  baseStyle: {
    tab: {
      fontWeight: '600',
      _focusVisible: {
        boxShadow: '0 0 0 2px var(--chakra-colors-focusRing)',
        outline: 'none',
      },
    },
  },
  variants: {
    line: {
      tab: {
        _selected: {
          color: 'brand.600',
          borderColor: 'brand.500',
        },
      },
    },
  },
  defaultProps: {
    colorScheme: 'brand',
  },
}

const Badge = {
  baseStyle: {
    textTransform: 'none',
    borderRadius: 'full',
    fontWeight: '600',
    px: 2,
    py: 1,
  },
}

const Table = {
  baseStyle: {
    table: {
      borderSpacing: 0,
      width: '100%',
      minWidth: '100%',
      tableLayout: { base: 'fixed', xl: 'auto' },
      border: '1px solid',
      borderColor: 'borderStrong',
      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
      backgroundColor: 'surface',
    },
    thead: {
      th: {
        whiteSpace: 'normal',
        wordBreak: 'break-word',
      },
    },
    tbody: {
      td: {
        whiteSpace: 'normal',
        wordBreak: 'break-word',
      },
      tr: {
        _last: {
          td: {
            borderBottomWidth: 0,
          },
        },
      },
    },
    th: {
      fontWeight: '600',
      textTransform: 'none',
      fontSize: 'sm',
      color: 'muted',
      borderColor: 'border',
      borderBottomWidth: '1px',
      whiteSpace: 'normal',
      wordBreak: 'break-word',
    },
    td: {
      borderColor: 'border',
      borderBottomWidth: '1px',
      fontSize: 'sm',
      whiteSpace: 'normal',
      wordBreak: 'break-word',
    },
  },
  variants: {
    simple: {
      th: {
        bg: 'brand.50',
        _dark: {
          bg: 'gray.800',
        },
      },
      tbody: {
        tr: {
          _hover: {
            bg: 'brand.50',
            _dark: {
              bg: 'whiteAlpha.100',
            },
          },
        },
      },
    },
  },
  defaultProps: {
    variant: 'simple',
    size: 'md',
  },
}

const Menu = {
  baseStyle: {
    list: {
      borderRadius: 'md',
      border: '1px solid',
      borderColor: 'border',
      boxShadow: 'md',
      py: 2,
      bg: 'surface',
    },
    item: {
      fontWeight: '500',
      _hover: {
        bg: 'brand.50',
        color: 'brand.700',
        _dark: {
          bg: 'whiteAlpha.100',
          color: 'brand.300',
        },
      },
      _focusVisible: {
        bg: 'brand.50',
        color: 'brand.700',
        boxShadow: 'inset 0 0 0 2px var(--chakra-colors-focusRing)',
        outline: 'none',
        _dark: {
          bg: 'whiteAlpha.100',
          color: 'brand.300',
        },
      },
    },
    button: {
      _focusVisible: {
        boxShadow: '0 0 0 2px var(--chakra-colors-focusRing)',
        outline: 'none',
      },
    },
  },
}

const IconButton = {
  baseStyle: {
    _focusVisible: {
      boxShadow: '0 0 0 2px var(--chakra-colors-focusRing)',
      outline: 'none',
    },
  },
}

const Checkbox = {
  baseStyle: {
    control: {
      _focusVisible: {
        boxShadow: '0 0 0 2px var(--chakra-colors-focusRing)',
        outline: 'none',
      },
    },
  },
}

const Radio = {
  baseStyle: {
    control: {
      _focusVisible: {
        boxShadow: '0 0 0 2px var(--chakra-colors-focusRing)',
        outline: 'none',
      },
    },
  },
}

const Switch = {
  baseStyle: {
    track: {
      _focusVisible: {
        boxShadow: '0 0 0 2px var(--chakra-colors-focusRing)',
        outline: 'none',
      },
    },
  },
}

const Link = {
  baseStyle: {
    _focusVisible: {
      boxShadow: '0 0 0 2px var(--chakra-colors-focusRing)',
      outline: 'none',
      borderRadius: 'sm',
    },
  },
}

const components = {
  Button,
  Input,
  Select,
  Textarea,
  Modal,
  Drawer,
  Tabs,
  Badge,
  Table,
  Menu,
  IconButton,
  Checkbox,
  Radio,
  Switch,
  Link,
}

const buildBaseGlobalStyles = () => ({
  'html, body': {
    background: 'var(--chakra-colors-background)',
    color: 'var(--chakra-colors-text)',
    lineHeight: 1.5,
  },
  body: {
    fontFamily: fonts.body,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },
  '*, *::before, *::after': {
    borderColor: 'var(--chakra-colors-border)',
  },
  '::selection': {
    background: 'rgba(37, 99, 235, 0.2)',
    color: 'var(--chakra-colors-brand-700)',
  },
  '@media (prefers-reduced-motion: reduce)': {
    '*': {
      animation: 'none !important',
      transition: 'none !important',
    },
  },
  // Ensure focus is always visible for accessibility
  '*:focus': {
    outline: 'none',
  },
  '*:focus-visible': {
    outline: 'none',
  },
  // High contrast mode support
  '@media (prefers-contrast: high)': {
    ':root': {
      '--chakra-colors-focusRing': 'rgba(0, 0, 0, 0.8)',
    },
    '[data-theme="dark"]': {
      '--chakra-colors-focusRing': 'rgba(255, 255, 255, 0.9)',
    },
  },
})

const defaultBrandPalette = {
  headerBg: '#0f172a',
  headerText: '#ffffff',
  sidebarBg: '#101828',
  sidebarText: '#e2e8f0',
  surface: '#ffffff',
  background: '#F8FAFC',
  text: '#0f172a',
  accent: '#2563eb',
}

const createSemanticTokensWithBrand = (palette) => ({
  colors: {
    ...baseSemanticTokens.colors,
    background: {
      default: palette.background ?? baseSemanticTokens.colors.background.default,
      _dark: baseSemanticTokens.colors.background._dark,
    },
    surface: {
      default: palette.surface ?? baseSemanticTokens.colors.surface.default,
      _dark: baseSemanticTokens.colors.surface._dark,
    },
    text: {
      default: palette.text ?? baseSemanticTokens.colors.text.default,
      _dark: baseSemanticTokens.colors.text._dark,
    },
    accent: {
      default: palette.accent ?? defaultBrandPalette.accent,
      _dark: palette.accent ?? defaultBrandPalette.accent,
    },
    headerBg: {
      default: palette.headerBg ?? defaultBrandPalette.headerBg,
      _dark: palette.headerBg ?? defaultBrandPalette.headerBg,
    },
    headerText: {
      default: palette.headerText ?? defaultBrandPalette.headerText,
      _dark: palette.headerText ?? defaultBrandPalette.headerText,
    },
    sidebarBg: {
      default: palette.sidebarBg ?? defaultBrandPalette.sidebarBg,
      _dark: palette.sidebarBg ?? defaultBrandPalette.sidebarBg,
    },
    sidebarText: {
      default: palette.sidebarText ?? defaultBrandPalette.sidebarText,
      _dark: palette.sidebarText ?? defaultBrandPalette.sidebarText,
    },
  },
})

export const createThemeWithBrand = (brandConfig = {}) => {
  const palette = {
    ...defaultBrandPalette,
    ...(brandConfig.colors || {}),
  }
  const loginBrand = brandConfig.login || {}
  const globalStyles = () => {
    const base = buildBaseGlobalStyles()
    return {
      ...base,
      ':root': {
        '--header-bg': palette.headerBg,
        '--header-fg': palette.headerText,
        '--sidebar-bg': palette.sidebarBg,
        '--sidebar-fg': palette.sidebarText,
        '--login-bg': loginBrand.backgroundColor || palette.surface,
      },
    }
  }

  return extendTheme({
    colors: {
      brand,
      slate,
    },
    semanticTokens: createSemanticTokensWithBrand(palette),
    fonts,
    radii,
    shadows,
    components,
    styles: {
      global: globalStyles,
    },
    config: {
      initialColorMode: 'light',
      useSystemColorMode: false,
    },
  })
}

const theme = createThemeWithBrand()

export default theme
