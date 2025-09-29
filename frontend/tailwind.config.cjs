const defaultTheme = require('tailwindcss/defaultTheme')

const brandPalette = {
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

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    screens: {
      ...defaultTheme.screens,
    },
    extend: {
      colors: {
        brand: brandPalette,
        background: '#F8FAFC',
        surface: '#FFFFFF',
        muted: '#64748B',
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        heading: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(15, 23, 42, 0.06)',
        soft: '0 4px 8px rgba(15, 23, 42, 0.08)',
        'elev-1': '0 8px 20px rgba(15, 23, 42, 0.12)',
      },
      borderRadius: {
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      spacing: {
        'safe-x': 'calc(1rem + env(safe-area-inset-left))',
      },
    },
  },
  plugins: [],
}
