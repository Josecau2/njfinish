import PropTypes from 'prop-types'
import React from 'react'
import { Box, Link, Text, useColorModeValue } from '@chakra-ui/react'

const DocsLink = (props) => {
  const { href, name, text, ...rest } = props
  const textColor = useColorModeValue('gray.600', 'gray.400')

  const _href = name ? `https://coreui.io/react/docs/components/${name}` : href

  return (
    <Box float="right">
      <Link
        minH="44px"
        py={2}
        {...rest}
        href={_href}
        rel="noreferrer noopener"
        target="_blank"
      >
        <Text as="small" color={textColor}>{text || 'docs'}</Text>
      </Link>
    </Box>
  )
}

DocsLink.propTypes = {
  href: PropTypes.string,
  name: PropTypes.string,
  text: PropTypes.string,
}

export default React.memo(DocsLink)
