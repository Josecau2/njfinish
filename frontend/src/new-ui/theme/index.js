import { extendTheme } from '@chakra-ui/react'
import { mode } from '@chakra-ui/theme-tools'

const brand = {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#2563EB',
  600: '#1D4ED8',
  700: '#1E40AF',
  800: '#1E3A8A',
  900: '#1E1B4B',
}

const slate = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5f5',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
}

const semanticColors = {
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#0EA5E9',
}

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  breakpoints: {
    sm: '40em',
    md: '48em',
    lg: '64em',
    xl: '80em',
    '2xl': '96em',
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  colors: {
    brand,
    slate,
    ...semanticColors,
  },
  space: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    6: '24px',
    8: '32px',
    12: '48px',
    16: '64px',
  },
  radii: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  shadows: {
    xs: '0 1px 1px rgba(15, 23, 42, 0.05)',
    sm: '0 1px 2px rgba(15, 23, 42, 0.1)',
    md: '0 4px 12px rgba(15, 23, 42, 0.12)',
    lg: '0 10px 24px rgba(15, 23, 42, 0.16)',
  },
  semanticTokens: {
    colors: {
      'bg.page': { default: 'slate.50' },
      'bg.surface': { default: 'white' },
      'bg.subtle': { default: 'slate.100' },
      'text.primary': { default: 'slate.900' },
      'text.muted': { default: 'slate.600' },
      'border.subtle': { default: 'slate.200' },
      'focus.ring': { default: 'rgba(37, 99, 235, 0.6)' },
    },
  },
  styles: {
    global: (props) => ({
      'html, body': {
        backgroundColor: mode('var(--chakra-colors-bg-page)', 'slate.900')(props),
        color: mode('slate.900', 'slate.50')(props),
        lineHeight: 1.5,
      },
      '*, *::before, *::after': {
        borderColor: 'var(--chakra-colors-border-subtle)',
      },
      h1: { fontSize: ['1.5rem', '1.75rem'], fontWeight: 600, lineHeight: 1.25 },
      h2: { fontSize: ['1.25rem', '1.375rem'], fontWeight: 600, lineHeight: 1.25 },
      h3: { fontSize: ['1.125rem', '1.25rem'], fontWeight: 600, lineHeight: 1.3 },
      p: { fontSize: '1rem', lineHeight: 1.5 },
    }),
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: '0.5rem',
        fontWeight: 600,
        transitionProperty: 'all',
        transitionDuration: '200ms',
        transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        _focusVisible: {
          boxShadow: '0 0 0 2px var(--chakra-colors-focus-ring)',
          outline: '2px solid transparent',
          outlineOffset: '2px',
        },
        _disabled: {
          opacity: 0.6,
          boxShadow: 'none',
          cursor: 'not-allowed',
        },
      },
      sizes: {
        md: {
          h: '44px',
          minW: '44px',
          fontSize: '0.95rem',
          px: '1.5rem',
        },
      },
      variants: {
        solid: (props) => ({
          background: mode('brand.500', 'brand.400')(props),
          color: 'white',
          _hover: {
            background: mode('brand.600', 'brand.300')(props),
            _disabled: { background: mode('brand.500', 'brand.400')(props) },
          },
          _active: {
            transform: 'scale(0.98)',
          },
        }),
        outline: (props) => ({
          borderColor: mode('slate.300', 'slate.600')(props),
          color: mode('slate.900', 'slate.100')(props),
          _hover: {
            background: mode('slate.100', 'slate.700')(props),
          },
          _active: {
            transform: 'scale(0.98)',
          },
        }),
        ghost: (props) => ({
          color: mode('slate.700', 'slate.100')(props),
          _hover: {
            background: mode('slate.100', 'slate.700')(props),
          },
        }),
        link: {
          color: 'brand.600',
          px: 0,
          height: 'auto',
        },
        destructive: {
          background: 'danger',
          color: 'white',
          _hover: {
            background: 'red.700',
          },
        },
      },
    },
    Tabs: {
      baseStyle: {
        tab: {
          fontWeight: 500,
          _selected: {
            color: 'brand.600',
          },
          _focusVisible: {
            boxShadow: '0 0 0 2px var(--chakra-colors-focus-ring)',
          },
        },
      },
    },
    FormLabel: {
      baseStyle: {
        fontWeight: 600,
        fontSize: '0.95rem',
      },
    },
    Input: {
      baseStyle: {
        field: {
          borderRadius: '0.5rem',
        },
      },
      sizes: {
        md: {
          field: {
            h: '44px',
          },
        },
      },
      variants: {
        outline: {
          field: {
            borderColor: 'slate.300',
            _hover: { borderColor: 'slate.400' },
            _focusVisible: {
              borderColor: 'brand.500',
              boxShadow: '0 0 0 2px var(--chakra-colors-focus-ring)',
            },
          },
        },
      },
    },
    Select: {
      baseStyle: {
        field: {
          borderRadius: '0.5rem',
        },
      },
      variants: {
        outline: {
          field: {
            borderColor: 'slate.300',
            _hover: { borderColor: 'slate.400' },
            _focusVisible: {
              borderColor: 'brand.500',
              boxShadow: '0 0 0 2px var(--chakra-colors-focus-ring)',
            },
          },
        },
      },
    },
    Textarea: {
      baseStyle: {
        borderRadius: '0.5rem',
      },
      variants: {
        outline: {
          borderColor: 'slate.300',
          _hover: { borderColor: 'slate.400' },
          _focusVisible: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 2px var(--chakra-colors-focus-ring)',
          },
        },
      },
    },
    Drawer: {
      baseStyle: {
        dialog: {
          borderRadius: '0.75rem 0 0 0.75rem',
        },
      },
    },
  },
})

export default theme
