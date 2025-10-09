/**
 * Modal Component Theme
 * Professional, sleek styling for all modal dialogs
 */

export const Modal = {
  baseStyle: (props) => ({
    overlay: {
      bg: 'blackAlpha.600',
      backdropFilter: 'blur(4px)',
    },
    dialog: {
      borderRadius: 'xl',
      boxShadow: '2xl',
      bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
      mx: 4,
    },
    header: {
      fontWeight: 'semibold',
      fontSize: 'lg',
      borderBottomWidth: '1px',
      borderColor: props.colorMode === 'dark' ? 'whiteAlpha.200' : 'gray.200',
      px: 6,
      py: 4,
    },
    closeButton: {
      borderRadius: 'md',
      top: 4,
      right: 4,
      _hover: {
        bg: props.colorMode === 'dark' ? 'whiteAlpha.200' : 'blackAlpha.100',
      },
    },
    body: {
      px: 6,
      py: 5,
    },
    footer: {
      borderTopWidth: '1px',
      borderColor: props.colorMode === 'dark' ? 'whiteAlpha.200' : 'gray.200',
      px: 6,
      py: 4,
      gap: 3,
    },
  }),
  sizes: {
    xs: {
      dialog: { maxW: 'xs' },
    },
    sm: {
      dialog: { maxW: 'sm' },
    },
    md: {
      dialog: { maxW: 'md' },
    },
    lg: {
      dialog: { maxW: 'lg' },
    },
    xl: {
      dialog: { maxW: 'xl' },
    },
    '2xl': {
      dialog: { maxW: '2xl' },
    },
    '3xl': {
      dialog: { maxW: '3xl' },
    },
    '4xl': {
      dialog: { maxW: '4xl' },
    },
    '5xl': {
      dialog: { maxW: '5xl' },
    },
    '6xl': {
      dialog: { maxW: '6xl' },
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
  defaultProps: {
    size: 'md',
    isCentered: true,
    scrollBehavior: 'inside',
  },
}
