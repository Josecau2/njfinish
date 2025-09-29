/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
    },
    extend: {
      colors: {
        brand: {
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
        },
        gray: require('tailwindcss/colors').slate,
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        info: '#0EA5E9',
        text: {
          primary: '#0f172a',
          muted: '#475569',
        },
        background: {
          page: '#f8fafc',
          surface: '#FFFFFF',
          subtle: '#f1f5f9',
        },
      },
      borderRadius: {
        xl: '12px',
        lg: '12px',
        md: '8px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(15, 23, 42, 0.1)',
        md: '0 4px 12px rgba(15, 23, 42, 0.12)',
        lg: '0 10px 24px rgba(15, 23, 42, 0.16)',
      },
      transitionTimingFunction: {
        brand: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      transitionDuration: {
        150: '150ms',
        200: '200ms',
        250: '250ms',
        300: '300ms',
        350: '350ms',
        400: '400ms',
      },
    },
  },
  plugins: [],
}
