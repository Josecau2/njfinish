/**
 * Card Component Theme
 * Professional card styling for content containers
 */

export const Card = {
  baseStyle: (props) => ({
    container: {
      bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
      boxShadow: props.colorMode === 'dark' ? 'dark-lg' : 'md',
      borderRadius: 'lg',
      overflow: 'hidden',
      borderWidth: '1px',
      borderColor: props.colorMode === 'dark' ? 'gray.700' : 'gray.200',
    },
    header: {
      px: 6,
      py: 4,
      borderBottomWidth: '1px',
      borderColor: props.colorMode === 'dark' ? 'gray.700' : 'gray.200',
      fontWeight: 'semibold',
      fontSize: 'lg',
    },
    body: {
      px: 6,
      py: 5,
      flex: 1,
    },
    footer: {
      px: 6,
      py: 4,
      borderTopWidth: '1px',
      borderColor: props.colorMode === 'dark' ? 'gray.700' : 'gray.200',
    },
  }),
  variants: {
    elevated: (props) => ({
      container: {
        boxShadow: props.colorMode === 'dark' ? 'dark-lg' : 'lg',
        borderWidth: 0,
      },
    }),
    outline: (props) => ({
      container: {
        borderWidth: '1px',
        borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.300',
        boxShadow: 'none',
      },
    }),
    filled: (props) => ({
      container: {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
        borderWidth: 0,
        boxShadow: 'none',
      },
    }),
    unstyled: {
      container: {
        bg: 'transparent',
        borderWidth: 0,
        boxShadow: 'none',
      },
      header: {
        px: 0,
        py: 0,
      },
      body: {
        px: 0,
        py: 0,
      },
      footer: {
        px: 0,
        py: 0,
      },
    },
  },
  sizes: {
    sm: {
      header: {
        px: 4,
        py: 3,
        fontSize: 'md',
      },
      body: {
        px: 4,
        py: 3,
      },
      footer: {
        px: 4,
        py: 3,
      },
    },
    md: {
      header: {
        px: 6,
        py: 4,
        fontSize: 'lg',
      },
      body: {
        px: 6,
        py: 5,
      },
      footer: {
        px: 6,
        py: 4,
      },
    },
    lg: {
      header: {
        px: 8,
        py: 5,
        fontSize: 'xl',
      },
      body: {
        px: 8,
        py: 6,
      },
      footer: {
        px: 8,
        py: 5,
      },
    },
  },
  defaultProps: {
    variant: 'elevated',
    size: 'md',
  },
}
