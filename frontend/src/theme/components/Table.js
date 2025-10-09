/**
 * Table Component Theme
 * Professional table styling with hover effects and responsive design
 */

export const Table = {
  baseStyle: (props) => ({
    table: {
      fontVariantNumeric: 'lining-nums tabular-nums',
      borderCollapse: 'collapse',
      width: 'full',
    },
    th: {
      fontFamily: 'heading',
      fontWeight: 'semibold',
      textTransform: 'uppercase',
      letterSpacing: 'wider',
      fontSize: 'xs',
      textAlign: 'start',
      px: 4,
      py: 3,
      bg: props.colorMode === 'dark' ? 'gray.700' : 'gray.50',
      color: props.colorMode === 'dark' ? 'gray.300' : 'gray.600',
      borderBottomWidth: '1px',
      borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
    },
    td: {
      px: 4,
      py: 3,
      borderBottomWidth: '1px',
      borderColor: props.colorMode === 'dark' ? 'gray.700' : 'gray.100',
      transition: 'background-color 0.2s',
    },
    caption: {
      mt: 4,
      fontFamily: 'heading',
      textAlign: 'center',
      fontWeight: 'medium',
    },
    tbody: {
      tr: {
        transition: 'background-color 0.2s',
        _hover: {
          bg: props.colorMode === 'dark' ? 'whiteAlpha.50' : 'gray.50',
        },
      },
    },
    tfoot: {
      tr: {
        bg: props.colorMode === 'dark' ? 'gray.800' : 'gray.100',
        fontWeight: 'semibold',
        '&:last-of-type': {
          th: { borderBottomWidth: 0 },
          td: { borderBottomWidth: 0 },
        },
      },
    },
  }),
  variants: {
    simple: (props) => ({
      th: {
        borderBottomWidth: '1px',
        borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
      },
      td: {
        borderBottomWidth: '1px',
        borderColor: props.colorMode === 'dark' ? 'gray.700' : 'gray.100',
      },
      tbody: {
        tr: {
          _hover: {
            bg: props.colorMode === 'dark' ? 'whiteAlpha.50' : 'gray.50',
          },
        },
      },
    }),
    striped: (props) => ({
      tbody: {
        tr: {
          '&:nth-of-type(odd)': {
            bg: props.colorMode === 'dark' ? 'whiteAlpha.50' : 'gray.50',
          },
          _hover: {
            bg: props.colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.100',
          },
        },
      },
    }),
    bordered: (props) => ({
      table: {
        borderWidth: '1px',
        borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
        borderRadius: 'lg',
        overflow: 'hidden',
      },
      th: {
        borderWidth: '1px',
        borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
      },
      td: {
        borderWidth: '1px',
        borderColor: props.colorMode === 'dark' ? 'gray.700' : 'gray.100',
      },
    }),
    compact: {
      th: {
        px: 3,
        py: 2,
        fontSize: '2xs',
      },
      td: {
        px: 3,
        py: 2,
        fontSize: 'sm',
      },
    },
  },
  sizes: {
    sm: {
      th: {
        px: 3,
        py: 2,
        fontSize: 'xs',
        lineHeight: 4,
      },
      td: {
        px: 3,
        py: 2,
        fontSize: 'sm',
        lineHeight: 5,
      },
      caption: {
        px: 3,
        py: 2,
        fontSize: 'xs',
      },
    },
    md: {
      th: {
        px: 4,
        py: 3,
        fontSize: 'xs',
        lineHeight: 4,
      },
      td: {
        px: 4,
        py: 3,
        fontSize: 'sm',
        lineHeight: 5,
      },
      caption: {
        px: 4,
        py: 2,
        fontSize: 'sm',
      },
    },
    lg: {
      th: {
        px: 6,
        py: 4,
        fontSize: 'sm',
        lineHeight: 5,
      },
      td: {
        px: 6,
        py: 4,
        fontSize: 'md',
        lineHeight: 6,
      },
      caption: {
        px: 6,
        py: 2,
        fontSize: 'md',
      },
    },
  },
  defaultProps: {
    variant: 'simple',
    size: 'md',
    colorScheme: 'gray',
  },
}
