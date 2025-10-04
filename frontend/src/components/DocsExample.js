import PropTypes from 'prop-types'
import React from 'react'
import { Box, Flex, HStack, Icon, Link, useColorModeValue } from '@chakra-ui/react'
import { Code, Play } from 'lucide-react'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../constants/iconSizes'

const DocsExample = ({ children, href }) => {
  const documentationLink = href ? `https://coreui.io/react/docs/${href}` : null
  const bgWhite = useColorModeValue('white', 'gray.800')
  const bgGray50 = useColorModeValue('gray.50', 'gray.700')
  const borderGray = useColorModeValue('gray.100', 'gray.600')

  return (
    <Box borderWidth="1px" borderRadius="md" overflow="hidden" bg={bgWhite} boxShadow="sm">
      <Flex justify="flex-end" gap={4} px={4} py={3} bg={bgGray50} borderBottomWidth="1px" borderColor={borderGray}>
        <Link
          minH="44px"
          py={2}
          href="#"
          display="inline-flex"
          alignItems="center"
          color="brand.500"
          fontWeight="medium"
        >
          <HStack spacing={2}>
            <Icon as={Play} boxSize={ICON_BOX_MD} />
            <Box as="span">Preview</Box>
          </HStack>
        </Link>
        {documentationLink && (
          <Link
            minH="44px"
            py={2}
            href={documentationLink}
            target="_blank"
            rel="noopener noreferrer"
            display="inline-flex"
            alignItems="center"
            color="brand.500"
            fontWeight="medium"
          >
            <HStack spacing={2}>
              <Icon as={Code} boxSize={ICON_BOX_MD} />
              <Box as="span">Code</Box>
            </HStack>
          </Link>
        )}
      </Flex>
      <Box
        bg={bgWhite}
        p={4}
        borderTopWidth="1px"
        borderColor={borderGray}
      >
        {children}
      </Box>
    </Box>
  )
}

DocsExample.propTypes = {
  children: PropTypes.node,
  href: PropTypes.string,
}

export default React.memo(DocsExample)
