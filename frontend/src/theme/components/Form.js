/**
 * Form Component Theme
 * Professional form styling with labels, helpers, and error states
 */

export const Form = {
  parts: ['container', 'requiredIndicator', 'helperText'],
  baseStyle: (props) => ({
    container: {
      width: '100%',
      position: 'relative',
    },
    requiredIndicator: {
      marginStart: 1,
      color: 'red.500',
    },
    helperText: {
      mt: 2,
      color: props.colorMode === 'dark' ? 'gray.400' : 'gray.600',
      lineHeight: 'normal',
      fontSize: 'sm',
    },
  }),
}

export const FormLabel = {
  baseStyle: (props) => ({
    fontSize: 'sm',
    marginEnd: 3,
    mb: 2,
    fontWeight: 'medium',
    transitionProperty: 'common',
    transitionDuration: 'normal',
    opacity: 1,
    color: props.colorMode === 'dark' ? 'gray.200' : 'gray.700',
    _disabled: {
      opacity: 0.6,
    },
  }),
}

export const FormError = {
  parts: ['text', 'icon'],
  baseStyle: {
    text: {
      color: 'red.500',
      mt: 2,
      fontSize: 'sm',
      lineHeight: 'normal',
    },
    icon: {
      marginEnd: 2,
      color: 'red.500',
    },
  },
}
