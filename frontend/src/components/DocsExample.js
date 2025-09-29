import PropTypes from 'prop-types'
import React from 'react'
import { Box, Flex, HStack, Icon, Link } from '@chakra-ui/react'
import { Code, Play } from 'lucide-react'

const DocsExample = ({ children, href, tabContentClassName }) => {
  const documentationLink = href ? `https://coreui.io/react/docs/${href}` : null

  return (
    <Box className="example" borderWidth="1px" borderRadius="md" overflow="hidden" bg="white" boxShadow="sm">
      <Flex justify="flex-end" gap={4} px={4} py={3} bg="gray.50" borderBottomWidth="1px" borderColor="gray.100">
        <Link
          href="#"
          display="inline-flex"
          alignItems="center"
          color="brand.500"
          fontWeight="medium"
        >
          <HStack spacing={2}>
            <Icon as={Play} boxSize={4} />
            <Box as="span">Preview</Box>
          </HStack>
        </Link>
        {documentationLink && (
          <Link
            href={documentationLink}
            target="_blank"
            rel="noopener noreferrer"
            display="inline-flex"
            alignItems="center"
            color="brand.500"
            fontWeight="medium"
          >
            <HStack spacing={2}>
              <Icon as={Code} boxSize={4} />
              <Box as="span">Code</Box>
            </HStack>
          </Link>
        )}
      </Flex>
      <Box
        bg="white"
        p={4}
        borderTopWidth="1px"
        borderColor="gray.100"
        className={tabContentClassName || ''}
      >
        {children}
      </Box>
    </Box>
  )
}

DocsExample.propTypes = {
  children: PropTypes.node,
  href: PropTypes.string,
  tabContentClassName: PropTypes.string,
}

export default React.memo(DocsExample)
