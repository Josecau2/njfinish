// Import professional component themes
import { Modal as ModalTheme } from './components/Modal'
import { Table as TableTheme } from './components/Table'
import { Input as InputTheme, Textarea as TextareaTheme, Select as SelectTheme } from './components/Input'
import { Form, FormLabel, FormError } from './components/Form'
import { Card as CardTheme } from './components/Card'

import { extendTheme } from '@chakra-ui/react'

const NAMED_COLOR_MAP = {
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
}

const expandShortHex = (hex) => {
  if (!hex || hex[0] !== '#' || hex.length !== 4) {
    return hex
  }
  const r = hex[1]
  const g = hex[2]
  const b = hex[3]
  return '#' + r + r + g + g + b + b
}

const resolveScaleColor = (value) => {
  if (typeof value !== 'string') {
    return value
  }
  const trimmed = value.trim()
  const parts = trimmed.split('.')
  if (parts.length === 2) {
    const scale = parts[0]
    const shade = parts[1]
    if (scale === 'brand' && brand[shade]) {
      return brand[shade]
    }
    if (scale === 'slate' && slate[shade]) {
      return slate[shade]
    }
  }
  return trimmed
}

const normalizeColor = (value, fallback) => {
  const candidate = resolveScaleColor(value) || resolveScaleColor(fallback) || null
  if (!candidate || typeof candidate !== 'string') {
    const resolvedFallback = resolveScaleColor(fallback)
    return resolvedFallback || '#000000'
  }
  const trimmed = candidate.trim()
  const lower = trimmed.toLowerCase()
  if (NAMED_COLOR_MAP[lower]) {
    return NAMED_COLOR_MAP[lower]
  }
  if (lower === 'transparent') {
    return 'transparent'
  }
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    return expandShortHex(trimmed)
  }
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) {
    return trimmed.toLowerCase()
  }
  if (/^rgba?\(/i.test(trimmed)) {
    return lower
  }
  const resolvedFallback = resolveScaleColor(fallback)
  if (typeof resolvedFallback === 'string') {
    return resolvedFallback
  }
  return '#000000'
}

const hexToRgbComponents = (value) => {
  const normalized = normalizeColor(value)
  if (!normalized) {
    return null
  }
  if (normalized === 'transparent') {
    return { r: 0, g: 0, b: 0 }
  }
  if (normalized.startsWith('#') && normalized.length === 7) {
    const parsed = parseInt(normalized.slice(1), 16)
    return {
      r: (parsed >> 16) & 255,
      g: (parsed >> 8) & 255,
      b: parsed & 255,
    }
  }
  if (/^rgba?\(/i.test(normalized)) {
    const matches = normalized.match(/[\d.]+/g)
    if (matches && matches.length >= 3) {
      const r = Number(matches[0])
      const g = Number(matches[1])
      const b = Number(matches[2])
      if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
        return { r, g, b }
      }
    }
  }
  return null
}

const componentToHex = (value) => {
  const clamped = Math.max(0, Math.min(255, Math.round(value)))
  const hex = clamped.toString(16)
  return hex.length === 1 ? '0' + hex : hex
}

const mixHex = (base, mix, ratio) => {
  const baseRgb = hexToRgbComponents(base)
  const mixRgb = hexToRgbComponents(mix)
  if (!baseRgb || !mixRgb) {
    return normalizeColor(base) || base
  }
  const weight = Math.max(0, Math.min(1, ratio))
  const channel = (from, to) => from + (to - from) * weight
  const r = componentToHex(channel(baseRgb.r, mixRgb.r))
  const g = componentToHex(channel(baseRgb.g, mixRgb.g))
  const b = componentToHex(channel(baseRgb.b, mixRgb.b))
  return '#' + r + g + b
}

const lightenHex = (color, ratio = 0.1) => {
  const normalized = normalizeColor(color)
  if (!normalized || normalized === 'transparent') {
    return normalized || color
  }
  if (!normalized.startsWith('#')) {
    return normalized
  }
  return mixHex(normalized, '#ffffff', ratio)
}

const darkenHex = (color, ratio = 0.1) => {
  const normalized = normalizeColor(color)
  if (!normalized || normalized === 'transparent') {
    return normalized || color
  }
  if (!normalized.startsWith('#')) {
    return normalized
  }
  return mixHex(normalized, '#000000', ratio)
}

const toRgbString = (value, fallback = '0, 0, 0') => {
  const normalized = normalizeColor(value)
  if (!normalized) {
    return fallback
  }
  if (normalized.startsWith('#')) {
    const rgb = hexToRgbComponents(normalized)
    if (rgb) {
      return Math.round(rgb.r) + ', ' + Math.round(rgb.g) + ', ' + Math.round(rgb.b)
    }
  }
  if (/^rgba?\(/i.test(normalized)) {
    const matches = normalized.match(/[\d.]+/g)
    if (matches && matches.length >= 3) {
      const r = Number(matches[0])
      const g = Number(matches[1])
      const b = Number(matches[2])
      if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
        return Math.round(r) + ', ' + Math.round(g) + ', ' + Math.round(b)
      }
    }
  }
  return fallback
}

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
    background: { default: '#F8FAFC', _dark: '#0f172a' },
    surface: { default: '#FFFFFF', _dark: '#111827' },
    text: { default: '#0f172a', _dark: '#E2E8F0' },
    muted: { default: '#64748B', _dark: '#94A3B8' },
    border: { default: 'rgba(15, 23, 42, 0.08)', _dark: 'rgba(148, 163, 184, 0.24)' },
    focusRing: { default: 'rgba(37, 99, 235, 0.6)', _dark: 'rgba(37, 99, 235, 0.7)' },
    focusRingError: { default: 'rgba(239, 68, 68, 0.6)', _dark: 'rgba(248, 113, 113, 0.7)' },
    focusRingSuccess: { default: 'rgba(34, 197, 94, 0.6)', _dark: 'rgba(74, 222, 128, 0.7)' },

    bgSubtle: { default: '#f8fafc', _dark: '#1a1a1a' },
    bgHover: { default: '#e2e8f0', _dark: '#2a2a2a' },
    bgActive: { default: '#cbd5e1', _dark: '#3a3a3a' },
    textStrong: { default: '#1e293b', _dark: '#ffffff' },
    textSubtle: { default: '#64748b', _dark: '#a0aec0' },
    borderSubtle: { default: '#e2e8f0', _dark: 'rgba(255, 255, 255, 0.12)' },
    borderStrong: { default: '#cbd5e1', _dark: 'rgba(255, 255, 255, 0.24)' },

    success: { default: '#22c55e', _dark: '#4ade80' },
    successBg: { default: '#dcfce7', _dark: 'rgba(74, 222, 128, 0.2)' },
    warning: { default: '#f97316', _dark: '#fbbf24' },
    warningBg: { default: '#ffedd5', _dark: 'rgba(251, 191, 36, 0.2)' },
    error: { default: '#ef4444', _dark: '#f87171' },
    errorBg: { default: '#fee2e2', _dark: 'rgba(248, 113, 113, 0.2)' },
    info: { default: '#3b82f6', _dark: '#38bdf8' },
    infoBg: { default: '#dbeafe', _dark: 'rgba(59, 130, 246, 0.2)' },

    cardBg: { default: '#ffffff', _dark: '#1e293b' },
    cardBorder: { default: 'rgba(15, 23, 42, 0.08)', _dark: 'rgba(148, 163, 184, 0.24)' },
    modalOverlay: { default: 'rgba(15, 23, 42, 0.48)', _dark: 'rgba(0, 0, 0, 0.72)' },
    inputBg: { default: '#ffffff', _dark: '#1e293b' },
    inputBorder: { default: '#cbd5e1', _dark: 'rgba(148, 163, 184, 0.4)' },
    inputFocus: { default: '#2563eb', _dark: '#3b82f6' },

    primary: { default: '#2563eb', _dark: '#2563eb' },
    primaryHover: { default: '#1d4ed8', _dark: '#1d4ed8' },
    secondary: { default: '#64748b', _dark: '#94a3b8' },
    light: { default: '#f8fafc', _dark: '#1f2937' },
    dark: { default: '#111827', _dark: '#e2e8f0' },
  },
}

const Button = {
  baseStyle: {
    fontWeight: '600',
    borderRadius: 'md',
    minH: '44px',
    minW: '44px',
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

// Use professional input themes
const Input = InputTheme
const Select = SelectTheme
const Textarea = TextareaTheme

// Use professional theme components
const Modal = ModalTheme
const Table = TableTheme
const Card = CardTheme

// Keep legacy drawer and tabs
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

// Table theme is imported from components/Table.js

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
    minH: '44px',
    minW: '44px',
    h: '44px',
    w: '44px',
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
  Card,
  Menu,
  IconButton,
  Checkbox,
  Radio,
  Switch,
  Link,
  Form,
  FormLabel,
  FormError,
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
  accentHover: '#1d4ed8',
  secondary: '#64748b',
  success: '#22c55e',
  successBg: '#dcfce7',
  successText: '#166534',
  warning: '#f97316',
  info: '#3b82f6',
  danger: '#ef4444',
}

const buildAppCssVariables = (palette, loginBrand = {}) => {
  const accent = normalizeColor(palette.accent, defaultBrandPalette.accent)
  const accentHover = normalizeColor(
    palette.accentHover || palette.accentDark || darkenHex(accent, 0.18),
    defaultBrandPalette.accentHover
  )
  const accentRgb = toRgbString(accent, '37, 99, 235')
  const secondary = normalizeColor(palette.secondary, defaultBrandPalette.secondary)
  const secondaryRgb = toRgbString(secondary, '100, 116, 139')
  const success = normalizeColor(palette.success, defaultBrandPalette.success)
  const successRgb = toRgbString(success, '34, 197, 94')
  const successBgSubtle = normalizeColor(
    palette.successBg || lightenHex(success, 0.75),
    defaultBrandPalette.successBg
  )
  const successText = normalizeColor(
    palette.successText || darkenHex(success, 0.35),
    defaultBrandPalette.successText
  )
  const warning = normalizeColor(palette.warning, defaultBrandPalette.warning)
  const warningRgb = toRgbString(warning, '249, 115, 22')
  const danger = normalizeColor(palette.danger, defaultBrandPalette.danger)
  const dangerRgb = toRgbString(danger, '239, 68, 68')
  const info = normalizeColor(palette.info, defaultBrandPalette.info)
  const infoRgb = toRgbString(info, '59, 130, 246')
  const headerBg = normalizeColor(palette.headerBg, defaultBrandPalette.headerBg)
  const headerText = normalizeColor(palette.headerText, defaultBrandPalette.headerText)
  const sidebarBg = normalizeColor(palette.sidebarBg, defaultBrandPalette.sidebarBg)
  const sidebarText = normalizeColor(palette.sidebarText, defaultBrandPalette.sidebarText)
  const surface = normalizeColor(palette.surface, defaultBrandPalette.surface)
  const loginBg = normalizeColor(loginBrand.backgroundColor, surface)
  const boxShadow = '0 1px 3px rgba(15, 23, 42, 0.1), 0 1px 2px -1px rgba(15, 23, 42, 0.08)'
  const boxShadowLg = '0 12px 30px -6px rgba(15, 23, 42, 0.28), 0 8px 16px -8px rgba(15, 23, 42, 0.18)'

  return {
    '--app-primary': accent,
    '--app-primary-rgb': accentRgb,
    '--app-primary-dark': accentHover,
    '--app-secondary': secondary,
    '--app-secondary-rgb': secondaryRgb,
    '--app-success': success,
    '--app-success-rgb': successRgb,
    '--app-success-bg-subtle': successBgSubtle,
    '--app-success-text-emphasis': successText,
    '--app-warning': warning,
    '--app-warning-rgb': warningRgb,
    '--app-danger': danger,
    '--app-danger-rgb': dangerRgb,
    '--app-info': info,
    '--app-info-rgb': infoRgb,
    '--app-gray-50': slate[50],
    '--app-gray-100': slate[100],
    '--app-gray-200': slate[200],
    '--app-gray-300': slate[300],
    '--app-gray-400': slate[400],
    '--app-gray-500': slate[500],
    '--app-gray-600': slate[600],
    '--app-gray-700': slate[700],
    '--app-gray-800': slate[800],
    '--app-gray-900': slate[900],
    '--app-white': '#ffffff',
    '--app-body-bg': 'var(--chakra-colors-background)',
    '--app-body-color': 'var(--chakra-colors-text)',
    '--app-heading-color': 'var(--chakra-colors-textStrong, var(--chakra-colors-gray-900))',
    '--app-link-color': accent,
    '--app-link-hover-color': accentHover,
    '--app-border-color': 'var(--chakra-colors-border)',
    '--app-border-color-subtle': 'rgba(148, 163, 184, 0.24)',
    '--app-border-color-translucent': 'rgba(148, 163, 184, 0.32)',
    '--app-border-radius': radii.sm,
    '--app-border-radius-sm': '4px',
    '--app-border-radius-lg': radii.md,
    '--app-border-radius-xl': radii.lg,
    '--app-border-radius-2xl': radii.xl,
    '--app-border-radius-pill': '9999px',
    '--app-box-shadow-sm': shadows.xs,
    '--app-box-shadow': boxShadow,
    '--app-box-shadow-lg': boxShadowLg,
    '--app-header-bg': headerBg,
    '--app-header-fg': headerText,
    '--app-sidebar-bg': sidebarBg,
    '--app-sidebar-fg': sidebarText,
    '--app-surface': surface,
    '--app-background': 'var(--chakra-colors-background)',
    '--app-focus-ring': 'rgba(' + accentRgb + ', 0.6)',
    '--login-bg': loginBg,
    '--header-bg': headerBg,
    '--header-fg': headerText,
    '--sidebar-bg': sidebarBg,
    '--sidebar-fg': sidebarText,
    '--cui-light': 'var(--app-gray-50)',
    '--cui-spacer-1': '0.25rem',
    '--cui-spacer-2': '0.5rem',
    '--cui-spacer-3': '1rem',
    '--cui-spacer-4': '1.5rem',
    '--cui-spacer-5': '3rem',
    '--cui-sidebar-nav-link-color': 'var(--app-gray-300)',
    '--cui-sidebar-nav-link-hover-color': 'var(--app-white)',
    '--cui-sidebar-nav-link-hover-bg': 'var(--app-gray-700)',
    '--cui-sidebar-nav-link-active-color': 'var(--app-white)',
    '--cui-sidebar-nav-link-active-bg': 'var(--app-primary)',
  }
}

const createSemanticTokensWithBrand = (palette) => {
  const accent = normalizeColor(palette.accent, defaultBrandPalette.accent)
  const accentHover = normalizeColor(
    palette.accentHover || palette.accentDark || darkenHex(accent, 0.18),
    defaultBrandPalette.accentHover
  )
  const accentRgb = toRgbString(accent, '37, 99, 235')
  const background = normalizeColor(palette.background, defaultBrandPalette.background)
  const surface = normalizeColor(palette.surface, defaultBrandPalette.surface)
  const textColor = normalizeColor(palette.text, defaultBrandPalette.text)
  const secondary = normalizeColor(palette.secondary, defaultBrandPalette.secondary)
  const success = normalizeColor(palette.success, defaultBrandPalette.success)
  const successBg = normalizeColor(palette.successBg, defaultBrandPalette.successBg)
  const warning = normalizeColor(palette.warning, defaultBrandPalette.warning)
  const danger = normalizeColor(palette.danger, defaultBrandPalette.danger)
  const info = normalizeColor(palette.info, defaultBrandPalette.info)
  const successRgb = toRgbString(success, '34, 197, 94')
  const dangerRgb = toRgbString(danger, '239, 68, 68')
  const warningBgLight = lightenHex(warning, 0.78)
  const infoBgLight = lightenHex(info, 0.78)
  const errorBgLight = lightenHex(danger, 0.82)
  const headerBg = normalizeColor(palette.headerBg, defaultBrandPalette.headerBg)
  const headerText = normalizeColor(palette.headerText, defaultBrandPalette.headerText)
  const sidebarBg = normalizeColor(palette.sidebarBg, defaultBrandPalette.sidebarBg)
  const sidebarText = normalizeColor(palette.sidebarText, defaultBrandPalette.sidebarText)

  return {
    colors: {
      ...baseSemanticTokens.colors,
      background: {
        default: background,
        _dark: baseSemanticTokens.colors.background._dark,
      },
      surface: {
        default: surface,
        _dark: baseSemanticTokens.colors.surface._dark,
      },
      text: {
        default: textColor,
        _dark: baseSemanticTokens.colors.text._dark,
      },
      accent: {
        default: accent,
        _dark: accent,
      },
      primary: {
        default: accent,
        _dark: accent,
      },
      primaryHover: {
        default: accentHover,
        _dark: accentHover,
      },
      secondary: {
        default: secondary,
        _dark: '#94a3b8',
      },
      focusRing: {
        default: 'rgba(' + accentRgb + ', 0.6)',
        _dark: 'rgba(' + accentRgb + ', 0.7)',
      },
      focusRingError: {
        default: 'rgba(' + dangerRgb + ', 0.6)',
        _dark: 'rgba(' + dangerRgb + ', 0.7)',
      },
      focusRingSuccess: {
        default: 'rgba(' + successRgb + ', 0.6)',
        _dark: 'rgba(' + successRgb + ', 0.7)',
      },
      success: {
        default: success,
        _dark: '#4ade80',
      },
      successBg: {
        default: successBg,
        _dark: 'rgba(' + successRgb + ', 0.18)',
      },
      warning: {
        default: warning,
        _dark: '#fbbf24',
      },
      warningBg: {
        default: warningBgLight,
        _dark: 'rgba(251, 191, 36, 0.2)',
      },
      error: {
        default: danger,
        _dark: '#f87171',
      },
      errorBg: {
        default: errorBgLight,
        _dark: 'rgba(' + dangerRgb + ', 0.2)',
      },
      info: {
        default: info,
        _dark: '#38bdf8',
      },
      infoBg: {
        default: infoBgLight,
        _dark: 'rgba(59, 130, 246, 0.2)',
      },
      cardBg: {
        default: surface,
        _dark: baseSemanticTokens.colors.cardBg._dark,
      },
      cardBorder: {
        default: 'rgba(15, 23, 42, 0.08)',
        _dark: 'rgba(148, 163, 184, 0.24)',
      },
      headerBg: {
        default: headerBg,
        _dark: headerBg,
      },
      headerText: {
        default: headerText,
        _dark: headerText,
      },
      sidebarBg: {
        default: sidebarBg,
        _dark: sidebarBg,
      },
      sidebarText: {
        default: sidebarText,
        _dark: sidebarText,
      },
    },
  }
}

export const createThemeWithBrand = (brandConfig = {}) => {
  const palette = {
    ...defaultBrandPalette,
    ...(brandConfig.colors || {}),
  }
  const loginBrand = brandConfig.login || {}
  const cssVariables = buildAppCssVariables(palette, loginBrand)

  const globalStyles = () => {
    const base = buildBaseGlobalStyles()
    return {
      ...base,
      ':root': {
        ...(base[':root'] || {}),
        ...cssVariables,
      },
      body: {
        ...(base.body || {}),
        background: 'var(--chakra-colors-background)',
        color: 'var(--chakra-colors-text)',
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
      initialColorMode: 'system',
      useSystemColorMode: true,
    },
  })
}


const theme = createThemeWithBrand()

export default theme
