import React from 'react'
import { Box, Button, Flex, Image, Link, Text, useColorModeValue } from '@chakra-ui/react'

import IconsImg from 'src/assets/images/icons.webp'

const DocsIcons = () => {
  const bgYellow = useColorModeValue('yellow.50', 'yellow.900')
  const borderYellow = useColorModeValue('yellow.400', 'yellow.600')

  return (
  <Box bg={bgYellow} borderWidth="2px" borderColor={borderYellow} borderRadius="md" mb={4}>
    <Flex
      align="center"
      direction={{ base: 'column', xl: 'row' }}
      gap={{ base: 4, xl: 6 }}
      px={{ base: 4, xl: 6 }}
      py={4}
    >
      <Box display={{ base: 'none', xl: 'block' }} flexShrink={0}>
        <Image
          src={IconsImg}
          alt="CoreUI Icons"
          w="160px"
          h="160px"
          objectFit="contain"
        />
      </Box>
      <Text flex="1" color={useColorModeValue("gray.700","gray.200")} textAlign={{ base: 'center', xl: 'left' }}>
        CoreUI Icons package ships with more than 1500 icons in multiple formats - SVG, PNG, and webfonts.
        They are carefully designed for common actions and items so you can reuse them across your web or
        mobile products. Visit the documentation to explore the full set.
      </Text>
      <Button
        as={Link}
        href="https://coreui.io/react/docs/components/icon/"
        target="_blank"
        rel="noopener noreferrer"
        colorScheme="yellow"
        variant="solid"
        whiteSpace="nowrap"
      >
        Explore Documentation
      </Button>
    </Flex>
  </Box>
)
}

export default DocsIcons
