import React, { forwardRef } from 'react'
import PropTypes from 'prop-types'
import { Button, IconButton, Box } from '@chakra-ui/react'

const MIN_TAP_TARGET = 44
const px = (value) => (typeof value === 'number' ? `${value}px` : value)

export const AppButton = forwardRef(({ minH, minHeight, h, height, size, ...props }, ref) => {
  const resolvedMinH = px(minH || minHeight || MIN_TAP_TARGET)
  const resolvedH = h || height

  return (
    <Button
      ref={ref}
      size={size ?? 'md'}
      minH={resolvedMinH}
      {...(resolvedH ? { h: px(resolvedH) } : {})}
      {...props}
    />
  )
})

AppButton.displayName = 'AppButton'

AppButton.propTypes = {
  minH: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  minHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  h: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  size: PropTypes.string,
}

export const AppIconButton = forwardRef(
  (
    {
      icon,
      children,
      minH,
      minW,
      minWidth,
      h,
      height,
      w,
      width,
      size,
      'aria-label': ariaLabel,
      ...props
    },
    ref,
  ) => {
    const content = icon || children
    const resolvedSize = px(minH || minW || minWidth || h || height || w || width || MIN_TAP_TARGET)

    return (
      <IconButton
        ref={ref}
        size={size || 'md'}
        icon={typeof content === 'string' ? <Box as="span" aria-hidden>{content}</Box> : content}
        minH={px(minH || h || height || MIN_TAP_TARGET)}
        minW={px(minW || minWidth || w || width || MIN_TAP_TARGET)}
        h={px(h || height || MIN_TAP_TARGET)}
        w={px(w || width || MIN_TAP_TARGET)}
        aria-label={ariaLabel}
        {...props}
      />
    )
  },
)

AppIconButton.displayName = 'AppIconButton'

AppIconButton.propTypes = {
  icon: PropTypes.node,
  children: PropTypes.node,
  minH: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  minW: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  minWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  h: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  w: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  size: PropTypes.string,
  'aria-label': PropTypes.string.isRequired,
}

export const ensureIconLabel = (label, fallback) => label || fallback

export default AppButton
