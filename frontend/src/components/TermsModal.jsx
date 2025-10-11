import React, { useEffect, useState, useRef } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Alert,
  AlertIcon,
  Box,
  Text,
} from '@chakra-ui/react'
import { useDispatch, useSelector } from 'react-redux'
import { getLatestTerms, acceptTerms } from '../helpers/termsApi'
import { logout } from '../store/slices/authSlice'
import { useTranslation } from 'react-i18next'

const TermsModal = ({ visible, onClose, onReject, requireScroll = true, isForced = false }) => {
  const [content, setContent] = useState('')
  const [canAccept, setCanAccept] = useState(!requireScroll)
  const dispatch = useDispatch()
  const modalBodyRef = useRef(null)
  const customization = useSelector((state) => state.customization)
  const { t } = useTranslation()

  const getContrastColor = (backgroundColor) => {
    if (!backgroundColor) return "white"
    const hex = backgroundColor.replace('#', '')
    if (hex.length !== 6) return "white"
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? "gray.700" : "white"
  }

  const getOptimalColors = (backgroundColor) => {
    const textColor = getContrastColor(backgroundColor)
    const isLight = textColor === '#2d3748'

    return {
      text: textColor,
      subtitle: isLight ? 'rgba(45, 55, 72, 0.6)' : 'rgba(255, 255, 255, 0.6)',
      button: {
        primary: {
          bg: isLight ? "blue.500" : "white",
          color: isLight ? "white" : backgroundColor,
          border: isLight ? "blue.500" : "white",
          hover: {
            bg: isLight ? "blue.600" : 'rgba(255, 255, 255, 0.9)',
            color: isLight ? "white" : backgroundColor,
          },
        },
        danger: {
          bg: isLight ? "red.500" : "red.500",
          color: "white",
          border: isLight ? "red.500" : "red.500",
          hover: {
            bg: isLight ? "red.600" : "red.600",
            color: "white",
          },
        },
      },
    }
  }

  const resolveBackground = (value) => {
    try {
      if (typeof value === 'string') {
        const trimmed = value.trim()
        return trimmed || "white"
      }
      if (value && typeof value === 'object') {
        if (typeof value.hex === 'string' && value.hex.trim()) return value.hex.trim()
        if (typeof value.value === 'string' && value.value.trim()) return value.value.trim()
      }
    } catch (_) {
      /* ignore */
    }
    return "white"
  }

  const backgroundColor = resolveBackground(customization?.headerBg)
  const optimalColors = getOptimalColors(backgroundColor)

  useEffect(() => {
    if (!visible) return

    const fetchTerms = async () => {
      try {
        const res = await getLatestTerms()
        setContent(res?.data?.data?.content || '')
      } catch {
        setContent('')
      }
    }

    fetchTerms()
  }, [visible])

  useEffect(() => {
    if (!requireScroll || !visible || !content) return

    const checkScrollNeeded = () => {
      const element = modalBodyRef.current
      if (element) {
        const isScrollable = element.scrollHeight > element.clientHeight
        if (!isScrollable) {
          setCanAccept(true)
        }
      }
    }

    const timer = setTimeout(checkScrollNeeded, 100)
    return () => clearTimeout(timer)
  }, [content, visible, requireScroll])

  const handleScroll = (event) => {
    if (!requireScroll) return
    const el = event.target
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) {
      setCanAccept(true)
    }
  }

  const onAccept = async () => {
    try {
      await acceptTerms()
      onClose?.()
    } catch (error) {
      console.error('Failed to accept terms:', error)
    }
  }

  const onRejectTerms = () => {
    if (onReject) {
      onReject()
    } else {
      dispatch(logout())
    }
  }

  const disabledPromptLabel = requireScroll
    ? t('termsModal.scrollPrompt')
    : t('termsModal.reviewPrompt')

  const modalCloseHandler = isForced ? () => {} : onClose

  return (
    <Modal
      isOpen={visible}
      onClose={modalCloseHandler}
      isCentered
      size={{ base: 'full', md: 'md', lg: 'lg' }}
      scrollBehavior="inside"
      closeOnOverlayClick={!isForced}
      closeOnEsc={!isForced}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          bg={backgroundColor}
          color={optimalColors.text}
          borderBottom='1px solid rgba(0,0,0,0.125)'
        >
          {t('termsModal.title')}
        </ModalHeader>
        {!isForced ? <ModalCloseButton aria-label={t('common.ariaLabels.closeModal', 'Close modal')} /> : null}
        <ModalBody
          ref={modalBodyRef}
          maxH='400px'
          overflowY='auto'
          whiteSpace='pre-wrap'
          onScroll={handleScroll}
        >
          {content || t('termsModal.empty')}
          {isForced && (
            <Alert status='warning' mt={3} borderRadius='md'>
              <AlertIcon />
              <Box>
                <Text as="span" fontWeight="semibold">{t('termsModal.forced.requiredLabel')}</Text>{' '}
                {t('termsModal.forced.requiredMessage')}
              </Box>
            </Alert>
          )}
        </ModalBody>
        <ModalFooter gap={4} pt={4} pb={{ base: 8, md: 4 }}>
          {!isForced && (
            <Button colorScheme='gray' isDisabled minH='44px'>
              {disabledPromptLabel}
            </Button>
          )}
          {isForced && (
            <Button
              colorScheme='red'
              onClick={onRejectTerms}
              minH='44px'
            >
              {t('termsModal.rejectAndLogout')}
            </Button>
          )}
          <Button
            colorScheme='brand'
            isDisabled={!canAccept}
            onClick={onAccept}
            minH='44px'
          >
            {t('termsModal.accept')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default TermsModal


