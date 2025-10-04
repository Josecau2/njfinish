import React from 'react'
import { Box, Image } from '@chakra-ui/react'
import { getBrand } from '../brand/useBrand'

const BrandLogo = ({ size = 48, alt = '' }) => {
  const brand = getBrand()
  const dataUri = brand?.logoDataURI || brand?.logo?.dataURI || ''
  const resolvedAlt = brand?.logoAlt || alt || ''

  if (!dataUri) {
    return (
      <Box
        display="inline-block"
        w={`${size}px`}
        h={`${size}px`}
        aria-hidden="true"
      />
    )
  }

  return (
    <Image
      src={dataUri}
      w={`${size}px`}
      h={`${size}px`}
      alt={resolvedAlt}
      decoding="sync"
      loading="eager"
      draggable={false}
    />
  )
}

export default BrandLogo
