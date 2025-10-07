import React, { useState } from 'react'
import { Flex, Text, Button, useColorModeValue } from '@chakra-ui/react'
import { useSelector } from 'react-redux'
import TermsModal from './TermsModal'

const AppFooter = () => {
  const currentYear = new Date().getFullYear()
  const customization = useSelector((state) => state.customization)

  const [showTerms, setShowTerms] = useState(false)

  // More pronounced gradient background
  const footerBg = useColorModeValue(
    'linear-gradient(180deg, rgba(248, 250, 252, 0.8) 0%, rgba(226, 232, 240, 0.95) 100%)',
    'linear-gradient(180deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)'
  )
  
  const borderColor = useColorModeValue('gray.300', 'gray.600')
  const textColor = useColorModeValue('gray.700', 'gray.300')
  const linkColor = useColorModeValue('brand.600', 'brand.400')

  return (
    <>
      <Flex
        as="footer"
        py={{ base: 3, md: 2 }}
        px={{ base: 4, md: 4 }}
        fontSize={{ base: 'sm', md: 'md' }}
        justify="space-between"
        align="center"
        wrap="wrap"
        gap={2}
        bgGradient={footerBg}
        borderTop="2px solid"
        borderTopColor={borderColor}
        backdropFilter="blur(10px)"
        boxShadow="0 -2px 10px rgba(0, 0, 0, 0.05)"
        position="sticky"
        bottom={0}
        zIndex="sticky"
      >
        <Text fontSize="inherit" fontWeight="medium" color={textColor}>
          &copy; {currentYear} {customization.logoText || 'NJ Cabinets'}. All rights reserved.
        </Text>
        <Button
          variant="link"
          size="sm"
          minH="36px"
          onClick={() => setShowTerms(true)}
          fontSize="inherit"
          color={linkColor}
          fontWeight="semibold"
          _hover={{
            textDecoration: 'underline',
            transform: 'translateY(-1px)',
          }}
        >
          Terms & Conditions
        </Button>
      </Flex>
      <TermsModal
        visible={showTerms}
        requireScroll={false}
        onClose={() => setShowTerms(false)}
        isForced={false}
      />
    </>
  )
}

export default React.memo(AppFooter)
