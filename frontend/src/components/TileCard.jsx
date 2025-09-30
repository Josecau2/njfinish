import React from 'react'
import {
  Box,
  Image,
  Text,
  VStack,
  useColorModeValue,
  AspectRatio
} from '@chakra-ui/react'

const TileCard = ({
  image,
  title,
  description,
  isSelected = false,
  onClick,
  children,
  ...props
}) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const selectedBorderColor = useColorModeValue('brand.500', 'brand.300')
  const selectedBg = useColorModeValue('brand.50', 'brand.900')
  const shadow = useColorModeValue('xs', 'dark-lg')

  return (
    <Box
      borderWidth="1px"
      borderColor={isSelected ? selectedBorderColor : borderColor}
      borderRadius="md"
      overflow="hidden"
      bg={isSelected ? selectedBg : 'white'}
      _dark={{ bg: isSelected ? selectedBg : 'gray.800' }}
      shadow={shadow}
      cursor={onClick ? 'pointer' : 'default'}
      onClick={onClick}
      transition="all 0.2s"
      _hover={onClick ? {
        shadow: 'md',
        transform: 'translateY(-1px)',
        borderColor: selectedBorderColor
      } : {}}
      p={4}
      {...props}
    >
      {image && (
        <AspectRatio ratio={4/3} mb={3}>
          <Image
            src={image}
            alt={title || 'Product image'}
            objectFit="cover"
            borderRadius="sm"
            fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='75' viewBox='0 0 100 75'%3E%3Crect width='100' height='75' fill='%23f7fafc'/%3E%3Ctext x='50' y='40' text-anchor='middle' fill='%23a0aec0' font-size='12'%3EImage%3C/text%3E%3C/svg%3E"
          />
        </AspectRatio>
      )}
      <VStack align="start" spacing={2}>
        {title && (
          <Text
            fontWeight="medium"
            fontSize="sm"
            lineHeight="1.2"
            noOfLines={2}
          >
            {title}
          </Text>
        )}
        {description && (
          <Text
            fontSize="xs"
            color="gray.600"
            _dark={{ color: 'gray.400' }}
            noOfLines={3}
          >
            {description}
          </Text>
        )}
        {children}
      </VStack>
    </Box>
  )
}

export default TileCard