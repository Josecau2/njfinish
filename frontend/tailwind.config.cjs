const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/new-ui/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        '2xl': '1200px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
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
          900: '#1E1B4B',
        },
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        info: '#0EA5E9',
      },
      borderRadius: {
        md: '0.5rem',
        xl: '0.75rem',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(15, 23, 42, 0.1)',
        md: '0 4px 12px rgba(15, 23, 42, 0.12)',
        lg: '0 10px 24px rgba(15, 23, 42, 0.16)',
      },
      spacing: {
        1.5: '0.375rem',
        3: '0.75rem',
        4.5: '1.125rem',
        7.5: '1.875rem',
        12: '3rem',
        16: '4rem',
      },
      transitionDuration: {
        ui: '200ms',
        overlay: '275ms',
        page: '350ms',
      },
      transitionTimingFunction: {
        emphasized: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
}
