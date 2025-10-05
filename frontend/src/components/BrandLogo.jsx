import React from 'react'
import { Box, Image } from '@chakra-ui/react'
import { getBrand } from '../brand/useBrand'

const BrandLogo = ({ size = 48, alt = '', maxWidth = '100%', containerProps = {}, imageProps = {} }) => {
  const brand = getBrand()
  const dataUri = brand?.logoDataURI || brand?.logo?.dataURI || ''
  const resolvedAlt = brand?.logoAlt || alt || ''

  const resolvedHeight = typeof size === 'number' ? `${size}px` : size
  const resolvedMaxWidth = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth

  if (!dataUri) {
    return (
      <Box
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        h={resolvedHeight}
        maxH={resolvedHeight}
        maxW={resolvedMaxWidth}
        aria-hidden="true"
        {...containerProps}
      />
    )
  }

  return (
    <Box
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      h={resolvedHeight}
      maxH={resolvedHeight}
      maxW={resolvedMaxWidth}
      {...containerProps}
    >
      <Image
        src={dataUri}
        alt={resolvedAlt}
        h="100%"
        w="auto"
        maxW="100%"
        objectFit="contain"
        decoding="sync"
        loading="eager"
        draggable={false}
        {...imageProps}
      />
    </Box>
  )
}

export default BrandLogo
