import { extendTheme } from '@chakra-ui/react'

const brandPalette = {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#2563EB',
  600: '#1D4ED8',
  700: '#1E40AF',
  800: '#1E3A8A',
  900: '#172554',
}

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  colors: {
    brand: brandPalette,
    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
    info: '#0EA5E9',
    background: {
      page: '#f8fafc',
      surface: '#FFFFFF',
      subtle: '#f1f5f9',
    },
    text: {
      primary: '#0f172a',
      muted: '#475569',
    },
    gray: {
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
    },
  },
  radii: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '12px',
  },
  shadows: {
    sm: '0 1px 2px rgba(15, 23, 42, 0.1)',
    md: '0 4px 12px rgba(15, 23, 42, 0.12)',
    lg: '0 10px 24px rgba(15, 23, 42, 0.16)',
  },
  breakpoints: {
    sm: '40em',
    md: '48em',
    lg: '64em',
    xl: '80em',
    '2xl': '96em',
  },
  styles: {
    global: {
      'html, body': {
        backgroundColor: 'background.page',
        color: 'text.primary',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: '8px',
        fontWeight: 600,
        transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
        _focusVisible: {
          boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.6)',
        },
        _disabled: {
          opacity: 0.6,
          cursor: 'not-allowed',
          boxShadow: 'none',
        },
      },
      sizes: {
        md: {
          fontSize: '0.95rem',
          minHeight: '44px',
          paddingInline: '1rem',
        },
      },
    },
    Input: {
      baseStyle: {
        field: {
          borderRadius: '8px',
          borderColor: 'gray.200',
          transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
          _focusVisible: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.35)',
          },
        },
      },
      sizes: {
        md: {
          fontSize: '1rem',
          minHeight: '44px',
          paddingInline: '1rem',
        },
      },
    },
    Textarea: {
      baseStyle: {
        borderRadius: '8px',
        borderColor: 'gray.200',
        _focusVisible: {
          borderColor: 'brand.500',
          boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.35)',
        },
      },
    },
    FormLabel: {
      baseStyle: {
        fontWeight: 600,
        fontSize: '0.95rem',
        color: 'text.primary',
      },
    },
  },
})

export default theme
