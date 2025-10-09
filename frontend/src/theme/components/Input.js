/**
 * Input Component Theme
 * Consistent, professional styling for all form inputs
 */

const activeLabelStyles = {
  transform: 'scale(0.85) translateY(-24px)',
}

export const Input = {
  baseStyle: (props) => ({
    field: {
      width: '100%',
      minWidth: 0,
      outline: 0,
      position: 'relative',
      appearance: 'none',
      transition: 'all 0.2s',
      fontSize: 'md',
      _placeholder: {
        color: props.colorMode === 'dark' ? 'gray.400' : 'gray.500',
        opacity: 1,
      },
      _disabled: {
        opacity: 0.6,
        cursor: 'not-allowed',
        bg: props.colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.50',
      },
      _invalid: {
        borderColor: 'red.500',
        boxShadow: '0 0 0 1px var(--chakra-colors-red-500)',
      },
      _focusVisible: {
        zIndex: 1,
        borderColor: 'blue.500',
        boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
      },
    },
    addon: {
      bg: props.colorMode === 'dark' ? 'gray.700' : 'gray.100',
      color: props.colorMode === 'dark' ? 'gray.300' : 'gray.600',
      borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
    },
  }),
  sizes: {
    xs: {
      field: {
        fontSize: 'xs',
        px: 2,
        h: 6,
        borderRadius: 'sm',
      },
      addon: {
        fontSize: 'xs',
        px: 2,
        h: 6,
        borderRadius: 'sm',
      },
    },
    sm: {
      field: {
        fontSize: 'sm',
        px: 3,
        h: 8,
        borderRadius: 'md',
      },
      addon: {
        fontSize: 'sm',
        px: 3,
        h: 8,
        borderRadius: 'md',
      },
    },
    md: {
      field: {
        fontSize: 'md',
        px: 4,
        h: 10,
        borderRadius: 'md',
      },
      addon: {
        fontSize: 'md',
        px: 4,
        h: 10,
        borderRadius: 'md',
      },
    },
    lg: {
      field: {
        fontSize: 'lg',
        px: 4,
        h: 12,
        borderRadius: 'md',
      },
      addon: {
        fontSize: 'lg',
        px: 4,
        h: 12,
        borderRadius: 'md',
      },
    },
  },
  variants: {
    outline: (props) => ({
      field: {
        border: '1px solid',
        borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.300',
        bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
        _hover: {
          borderColor: props.colorMode === 'dark' ? 'gray.500' : 'gray.400',
        },
        _focus: {
          borderColor: 'blue.500',
          boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
        },
        _invalid: {
          borderColor: 'red.500',
          boxShadow: '0 0 0 1px var(--chakra-colors-red-500)',
        },
      },
    }),
    filled: (props) => ({
      field: {
        border: '2px solid',
        borderColor: 'transparent',
        bg: props.colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.100',
        _hover: {
          bg: props.colorMode === 'dark' ? 'whiteAlpha.200' : 'gray.200',
        },
        _focus: {
          bg: props.colorMode === 'dark' ? 'whiteAlpha.50' : 'white',
          borderColor: 'blue.500',
        },
        _invalid: {
          borderColor: 'red.500',
        },
      },
    }),
    flushed: (props) => ({
      field: {
        borderBottom: '2px solid',
        borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.300',
        borderRadius: 0,
        px: 0,
        bg: 'transparent',
        _focus: {
          borderColor: 'blue.500',
          boxShadow: '0 1px 0 0 var(--chakra-colors-blue-500)',
        },
        _invalid: {
          borderColor: 'red.500',
          boxShadow: '0 1px 0 0 var(--chakra-colors-red-500)',
        },
      },
    }),
    unstyled: {
      field: {
        bg: 'transparent',
        px: 0,
        height: 'auto',
      },
      addon: {
        bg: 'transparent',
        px: 0,
        height: 'auto',
      },
    },
  },
  defaultProps: {
    size: 'md',
    variant: 'outline',
  },
}

// Textarea uses the same styling as Input
export const Textarea = {
  ...Input,
  baseStyle: (props) => ({
    ...Input.baseStyle(props).field,
    paddingY: 2,
    minHeight: 20,
    lineHeight: 'short',
    verticalAlign: 'top',
  }),
}

// Select component
export const Select = {
  ...Input,
  baseStyle: (props) => ({
    field: {
      ...Input.baseStyle(props).field,
      paddingEnd: 8,
      paddingInlineEnd: 8,
      appearance: 'none',
      paddingBottom: 1,
      lineHeight: 'normal',
      '> option, > optgroup': {
        bg: props.colorMode === 'dark' ? 'gray.700' : 'white',
      },
    },
    icon: {
      width: 6,
      height: '100%',
      insetEnd: 2,
      position: 'relative',
      color: 'currentColor',
      fontSize: 'xl',
      _disabled: {
        opacity: 0.5,
      },
    },
  }),
}
