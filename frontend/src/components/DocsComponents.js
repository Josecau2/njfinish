import PropTypes from 'prop-types'
import React from 'react'
import { Box, Button, Flex, Image, Link, Text, useColorModeValue } from '@chakra-ui/react'

import ComponentsImg from 'src/assets/images/components.webp'

const DocsComponents = ({ href }) => {
  const documentationLink = href ? `https://coreui.io/react/docs/${href}` : null

  return (
    <Box bg={useColorModeValue("blue.50","blue.900")} borderWidth="2px" borderColor="blue.500" borderRadius="md" mb={4}>
      <Flex
        align="center"
        direction={{ base: 'column', xl: 'row' }}
        gap={{ base: 4, xl: 6 }}
        px={{ base: 4, xl: 6 }}
        py={4}
      >
        <Box display={{ base: 'none', xl: 'block' }} flexShrink={0}>
          <Image
            src={ComponentsImg}
            alt="CoreUI PRO hexagon"
            w="160px"
            h="160px"
            objectFit="contain"
          />
        </Box>
        <Text flex="1" color={useColorModeValue("gray.700","gray.200")} textAlign={{ base: 'center', xl: 'left' }}>
          Our Admin Panel is not simply a bundle of third-party pieces. It is the only open-source React
          dashboard built on a professional, enterprise-grade UI component library. This example shows the
          basic usage; for extended demos, detailed API docs, and customization guidance, visit the
          documentation.
        </Text>
        {documentationLink && (
          <Button
            as={Link}
            href={documentationLink}
            target="_blank"
            rel="noopener noreferrer"
            colorScheme="blue"
            variant="solid"
            whiteSpace="nowrap"
          >
            Explore Documentation
          </Button>
        )}
      </Flex>
    </Box>
  )
}

DocsComponents.propTypes = {
  href: PropTypes.string,
}

export default DocsComponents
