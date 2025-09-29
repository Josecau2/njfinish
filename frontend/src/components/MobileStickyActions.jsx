import React from 'react'
import { Box, Button, HStack, Portal, useColorModeValue } from '@chakra-ui/react'
import { motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

const MotionBox = motion(Box)
const MotionButton = motion(Button)

const MobileStickyActions = ({
  primaryAction,
  secondaryAction,
  show = true,
  isLoading = false,
}) => {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const shadowColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.3)')

  if (!show || (!primaryAction && !secondaryAction)) {
    return null
  }

  const tapAnimation = prefersReducedMotion ? {} : { scale: 0.98 }
  const entranceAnimation = prefersReducedMotion
    ? {}
    : { y: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } }

  return (
    <Portal>
      <MotionBox
        position='fixed'
        bottom={0}
        left={0}
        right={0}
        display={{ base: 'block', md: 'none' }}
        bg={bgColor}
        borderTop='1px solid'
        borderColor={borderColor}
        boxShadow={`0 -4px 12px ${shadowColor}`}
        p={4}
        pb={`calc(1rem + env(safe-area-inset-bottom))`}
        zIndex='sticky'
        initial={prefersReducedMotion ? false : { y: 100, opacity: 0 }}
        animate={entranceAnimation}
        exit={prefersReducedMotion ? false : { y: 100, opacity: 0 }}
      >
        <HStack spacing={3} justify='stretch'>
          {secondaryAction && (
            <MotionButton
              flex='1'
              variant='outline'
              colorScheme='gray'
              size='lg'
              isDisabled={isLoading}
              onClick={secondaryAction.onClick}
              whileTap={tapAnimation}
            >
              {secondaryAction.label || t('common.cancel')}
            </MotionButton>
          )}
          {primaryAction && (
            <MotionButton
              flex={secondaryAction ? '1' : undefined}
              minW={secondaryAction ? undefined : '200px'}
              colorScheme='brand'
              size='lg'
              isLoading={isLoading}
              loadingText={primaryAction.loadingText || t('common.processing')}
              onClick={primaryAction.onClick}
              leftIcon={primaryAction.icon}
              whileTap={tapAnimation}
            >
              {primaryAction.label}
            </MotionButton>
          )}
        </HStack>
      </MotionBox>
    </Portal>
  )
}

export default MobileStickyActions
