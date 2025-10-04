import React from 'react'
import { Box } from '@chakra-ui/react'
import { useSelector } from 'react-redux'
import { getOptimalColors } from '../utils/colorUtils'

const buildContainerStyles = (backgroundColor, optimalColors) => `
  .dynamic-contrast-container {
    background-color: ${backgroundColor};
    color: ${optimalColors.text};
  }

  .dynamic-contrast-container .btn-light {
    background-color: ${optimalColors.button.light.bg} !important;
    border-color: ${optimalColors.button.light.border} !important;
    color: ${optimalColors.button.light.color} !important;
  }

  .dynamic-contrast-container .btn-light:hover {
    background-color: ${optimalColors.button.light.hover.bg} !important;
    color: ${optimalColors.button.light.hover.color} !important;
  }

  .dynamic-contrast-container .btn-primary {
    background-color: ${optimalColors.button.primary.bg} !important;
    border-color: ${optimalColors.button.primary.border} !important;
    color: ${optimalColors.button.primary.color} !important;
  }

  .dynamic-contrast-container .btn-primary:hover {
    background-color: ${optimalColors.button.primary.hover.bg} !important;
    color: ${optimalColors.button.primary.hover.color} !important;
  }

  .dynamic-contrast-container .btn-success {
    background-color: ${optimalColors.button.success.bg} !important;
    border-color: ${optimalColors.button.success.border} !important;
    color: ${optimalColors.button.success.color} !important;
  }

  .dynamic-contrast-container .btn-success:hover {
    background-color: ${optimalColors.button.success.hover.bg} !important;
    color: ${optimalColors.button.success.hover.color} !important;
  }

  .dynamic-contrast-container .btn-warning {
    background-color: ${optimalColors.button.warning.bg} !important;
    border-color: ${optimalColors.button.warning.border} !important;
    color: ${optimalColors.button.warning.color} !important;
  }

  .dynamic-contrast-container .btn-warning:hover {
    background-color: ${optimalColors.button.warning.hover.bg} !important;
    color: ${optimalColors.button.warning.hover.color} !important;
  }

  .dynamic-contrast-container .btn-danger {
    background-color: ${optimalColors.button.danger.bg} !important;
    border-color: ${optimalColors.button.danger.border} !important;
    color: ${optimalColors.button.danger.color} !important;
  }

  .dynamic-contrast-container .btn-danger:hover {
    background-color: ${optimalColors.button.danger.hover.bg} !important;
    color: ${optimalColors.button.danger.hover.color} !important;
  }

  .dynamic-contrast-container .badge-light {
    background-color: ${optimalColors.badge.light.bg} !important;
    color: ${optimalColors.badge.light.color} !important;
    border: 1px solid ${optimalColors.badge.light.border} !important;
  }

  .dynamic-contrast-container .badge-info {
    background-color: ${optimalColors.badge.info.bg} !important;
    color: ${optimalColors.badge.info.color} !important;
    border: 1px solid ${optimalColors.badge.info.border} !important;
  }

  .dynamic-contrast-container .badge-secondary {
    background-color: ${optimalColors.badge.secondary.bg} !important;
    color: ${optimalColors.badge.secondary.color} !important;
    border: 1px solid ${optimalColors.badge.secondary.border} !important;
  }

  .dynamic-contrast-container .badge-warning {
    background-color: ${optimalColors.badge.warning.bg} !important;
    color: ${optimalColors.badge.warning.color} !important;
    border: 1px solid ${optimalColors.badge.warning.border} !important;
  }

  .dynamic-contrast-container .badge-success {
    background-color: ${optimalColors.badge.success.bg} !important;
    color: ${optimalColors.badge.success.color} !important;
    border: 1px solid ${optimalColors.badge.success.border} !important;
  }

  .dynamic-contrast-container .badge-danger {
    background-color: ${optimalColors.badge.danger.bg} !important;
    color: ${optimalColors.badge.danger.color} !important;
    border: 1px solid ${optimalColors.badge.danger.border} !important;
  }

  .dynamic-contrast-container .text-muted {
    color: ${optimalColors.subtitle} !important;
  }

  .dynamic-contrast-container .border {
    border-color: ${optimalColors.border} !important;
  }

  .dynamic-contrast-container .vr {
    background-color: ${optimalColors.separator} !important;
  }

  .dynamic-contrast-container h1,
  .dynamic-contrast-container h2,
  .dynamic-contrast-container h3,
  .dynamic-contrast-container h4,
  .dynamic-contrast-container h5,
  .dynamic-contrast-container h6 {
    color: ${optimalColors.text} !important;
  }

  .dynamic-contrast-container .cicon svg {
    color: ${optimalColors.text} !important;
  }
`

const buildWrapperStyles = (backgroundColor, optimalColors, colorSource) => `
  .dynamic-contrast-wrapper-${colorSource} {
    background-color: ${backgroundColor};
    color: ${optimalColors.text};
  }

  .dynamic-contrast-wrapper-${colorSource} .btn-light {
    background-color: ${optimalColors.button.light.bg} !important;
    border-color: ${optimalColors.button.light.border} !important;
    color: ${optimalColors.button.light.color} !important;
  }

  .dynamic-contrast-wrapper-${colorSource} .btn-light:hover {
    background-color: ${optimalColors.button.light.hover.bg} !important;
    color: ${optimalColors.button.light.hover.color} !important;
  }

  .dynamic-contrast-wrapper-${colorSource} .btn-primary {
    background-color: ${optimalColors.button.primary.bg} !important;
    border-color: ${optimalColors.button.primary.border} !important;
    color: ${optimalColors.button.primary.color} !important;
  }

  .dynamic-contrast-wrapper-${colorSource} .btn-primary:hover {
    background-color: ${optimalColors.button.primary.hover.bg} !important;
    color: ${optimalColors.button.primary.hover.color} !important;
  }

  .dynamic-contrast-wrapper-${colorSource} .btn-success {
    background-color: ${optimalColors.button.success.bg} !important;
    border-color: ${optimalColors.button.success.border} !important;
    color: ${optimalColors.button.success.color} !important;
  }

  .dynamic-contrast-wrapper-${colorSource} .btn-success:hover {
    background-color: ${optimalColors.button.success.hover.bg} !important;
    color: ${optimalColors.button.success.hover.color} !important;
  }

  .dynamic-contrast-wrapper-${colorSource} .badge {
    background-color: ${optimalColors.badge.light.bg} !important;
    color: ${optimalColors.badge.light.color} !important;
    border: 1px solid ${optimalColors.badge.light.border} !important;
  }

  .dynamic-contrast-wrapper-${colorSource} .text-muted {
    color: ${optimalColors.subtitle} !important;
  }

  .dynamic-contrast-wrapper-${colorSource} h1,
  .dynamic-contrast-wrapper-${colorSource} h2,
  .dynamic-contrast-wrapper-${colorSource} h3,
  .dynamic-contrast-wrapper-${colorSource} h4,
  .dynamic-contrast-wrapper-${colorSource} h5,
  .dynamic-contrast-wrapper-${colorSource} h6 {
    color: ${optimalColors.text} !important;
  }
`

const withDynamicContrast = (WrappedComponent, options = {}) => {
  const { colorSource = 'headerBg', containerElement = 'div' } = options

  const DynamicContrastComponent = (props) => {
    const customization = useSelector((state) => state.customization)
    const backgroundColor = customization[colorSource] || "white"
    const optimalColors = getOptimalColors(backgroundColor)

    const ContainerElement = containerElement

    return (
      <>
        <style>{buildContainerStyles(backgroundColor, optimalColors)}</style>
        <Box
          as={ContainerElement}
          bg={backgroundColor}
          color={optimalColors.text}
          sx={{
            '.btn-light': {
              bg: `${optimalColors.button.light.bg} !important`,
              borderColor: `${optimalColors.button.light.border} !important`,
              color: `${optimalColors.button.light.color} !important`,
              '&:hover': {
                bg: `${optimalColors.button.light.hover.bg} !important`,
                color: `${optimalColors.button.light.hover.color} !important`,
              },
            },
            '.btn-primary': {
              bg: `${optimalColors.button.primary.bg} !important`,
              borderColor: `${optimalColors.button.primary.border} !important`,
              color: `${optimalColors.button.primary.color} !important`,
              '&:hover': {
                bg: `${optimalColors.button.primary.hover.bg} !important`,
                color: `${optimalColors.button.primary.hover.color} !important`,
              },
            },
            '.btn-success': {
              bg: `${optimalColors.button.success.bg} !important`,
              borderColor: `${optimalColors.button.success.border} !important`,
              color: `${optimalColors.button.success.color} !important`,
              '&:hover': {
                bg: `${optimalColors.button.success.hover.bg} !important`,
                color: `${optimalColors.button.success.hover.color} !important`,
              },
            },
            '.btn-warning': {
              bg: `${optimalColors.button.warning.bg} !important`,
              borderColor: `${optimalColors.button.warning.border} !important`,
              color: `${optimalColors.button.warning.color} !important`,
              '&:hover': {
                bg: `${optimalColors.button.warning.hover.bg} !important`,
                color: `${optimalColors.button.warning.hover.color} !important`,
              },
            },
            '.btn-danger': {
              bg: `${optimalColors.button.danger.bg} !important`,
              borderColor: `${optimalColors.button.danger.border} !important`,
              color: `${optimalColors.button.danger.color} !important`,
              '&:hover': {
                bg: `${optimalColors.button.danger.hover.bg} !important`,
                color: `${optimalColors.button.danger.hover.color} !important`,
              },
            },
            '.badge-light': {
              bg: `${optimalColors.badge.light.bg} !important`,
              color: `${optimalColors.badge.light.color} !important`,
              border: `1px solid ${optimalColors.badge.light.border} !important`,
            },
            '.badge-info': {
              bg: `${optimalColors.badge.info.bg} !important`,
              color: `${optimalColors.badge.info.color} !important`,
              border: `1px solid ${optimalColors.badge.info.border} !important`,
            },
            '.badge-secondary': {
              bg: `${optimalColors.badge.secondary.bg} !important`,
              color: `${optimalColors.badge.secondary.color} !important`,
              border: `1px solid ${optimalColors.badge.secondary.border} !important`,
            },
            '.badge-warning': {
              bg: `${optimalColors.badge.warning.bg} !important`,
              color: `${optimalColors.badge.warning.color} !important`,
              border: `1px solid ${optimalColors.badge.warning.border} !important`,
            },
            '.badge-success': {
              bg: `${optimalColors.badge.success.bg} !important`,
              color: `${optimalColors.badge.success.color} !important`,
              border: `1px solid ${optimalColors.badge.success.border} !important`,
            },
            '.badge-danger': {
              bg: `${optimalColors.badge.danger.bg} !important`,
              color: `${optimalColors.badge.danger.color} !important`,
              border: `1px solid ${optimalColors.badge.danger.border} !important`,
            },
            '.text-muted': {
              color: `${optimalColors.subtitle} !important`,
            },
            '.border': {
              borderColor: `${optimalColors.border} !important`,
            },
            '.vr': {
              bg: `${optimalColors.separator} !important`,
            },
            'h1, h2, h3, h4, h5, h6': {
              color: `${optimalColors.text} !important`,
            },
            '.cicon svg': {
              color: `${optimalColors.text} !important`,
            },
            ...props.style,
          }}
        >
          <WrappedComponent {...props} dynamicColors={optimalColors} backgroundColor={backgroundColor} />
        </Box>
      </>
    )
  }

  DynamicContrastComponent.displayName = `withDynamicContrast(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`

  return DynamicContrastComponent
}

export const DynamicContrastWrapper = ({
  children,
  colorSource = 'headerBg',
  element: Element = 'div',
  ...props
}) => {
  const customization = useSelector((state) => state.customization)
  const backgroundColor = customization[colorSource] || "white"
  const optimalColors = getOptimalColors(backgroundColor)

  return (
    <>
      <style>{buildWrapperStyles(backgroundColor, optimalColors, colorSource)}</style>
      <Box
        as={Element}
        bg={backgroundColor}
        color={optimalColors.text}
        sx={{
          '.btn-light': {
            bg: `${optimalColors.button.light.bg} !important`,
            borderColor: `${optimalColors.button.light.border} !important`,
            color: `${optimalColors.button.light.color} !important`,
            '&:hover': {
              bg: `${optimalColors.button.light.hover.bg} !important`,
              color: `${optimalColors.button.light.hover.color} !important`,
            },
          },
          '.btn-primary': {
            bg: `${optimalColors.button.primary.bg} !important`,
            borderColor: `${optimalColors.button.primary.border} !important`,
            color: `${optimalColors.button.primary.color} !important`,
            '&:hover': {
              bg: `${optimalColors.button.primary.hover.bg} !important`,
              color: `${optimalColors.button.primary.hover.color} !important`,
            },
          },
          '.btn-success': {
            bg: `${optimalColors.button.success.bg} !important`,
            borderColor: `${optimalColors.button.success.border} !important`,
            color: `${optimalColors.button.success.color} !important`,
            '&:hover': {
              bg: `${optimalColors.button.success.hover.bg} !important`,
              color: `${optimalColors.button.success.hover.color} !important`,
            },
          },
          '.badge': {
            bg: `${optimalColors.badge.light.bg} !important`,
            color: `${optimalColors.badge.light.color} !important`,
            border: `1px solid ${optimalColors.badge.light.border} !important`,
          },
          '.text-muted': {
            color: `${optimalColors.subtitle} !important`,
          },
          'h1, h2, h3, h4, h5, h6': {
            color: `${optimalColors.text} !important`,
          },
        }}
        {...props}
      >
        {children}
      </Box>
    </>
  )
}

export default withDynamicContrast
