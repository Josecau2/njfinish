import React, { useState } from 'react'
import { Flex, Text, Button } from '@chakra-ui/react'
import { useSelector } from 'react-redux'
import TermsModal from './TermsModal'

const AppFooter = () => {
  const currentYear = new Date().getFullYear()
  const customization = useSelector((state) => state.customization)

  const [showTerms, setShowTerms] = useState(false)

  return (
    <>
      <Flex
        as="footer"
        py={{ base: 2, md: 2 }}
        px={{ base: 3, md: 4 }}
        fontSize={{ base: 'sm', md: 'md' }}
        justify="space-between"
        align="center"
        wrap="wrap"
        gap={2}
      >
        <Text fontSize="inherit">
          &copy; {currentYear} {customization.logoText || 'NJ Cabinets'}. All rights reserved.
        </Text>
        <Button
          variant="link"
          size="sm"
          minH="36px"
          onClick={() => setShowTerms(true)}
          fontSize="inherit"
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
