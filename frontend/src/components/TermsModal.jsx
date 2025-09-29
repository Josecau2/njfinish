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
    if (!backgroundColor) return '#ffffff'
    const hex = backgroundColor.replace('#', '')
    if (hex.length !== 6) return '#ffffff'
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#2d3748' : '#ffffff'
  }

  const getOptimalColors = (backgroundColor) => {
    const textColor = getContrastColor(backgroundColor)
    const isLight = textColor === '#2d3748'

    return {
      text: textColor,
      subtitle: isLight ? 'rgba(45, 55, 72, 0.6)' : 'rgba(255, 255, 255, 0.6)',
      button: {
        primary: {
          bg: isLight ? '#0d6efd' : '#ffffff',
          color: isLight ? '#ffffff' : backgroundColor,
          border: isLight ? '#0d6efd' : '#ffffff',
          hover: {
            bg: isLight ? '#0b5ed7' : 'rgba(255, 255, 255, 0.9)',
            color: isLight ? '#ffffff' : backgroundColor,
          },
        },
        danger: {
          bg: isLight ? '#dc3545' : '#ef4444',
          color: '#ffffff',
          border: isLight ? '#dc3545' : '#ef4444',
          hover: {
            bg: isLight ? '#bb2d3b' : '#dc2626',
            color: '#ffffff',
          },
        },
      },
    }
  }

  const resolveBackground = (value) => {
    try {
      if (typeof value === 'string') {
        const trimmed = value.trim()
        return trimmed || '#ffffff'
      }
      if (value && typeof value === 'object') {
        if (typeof value.hex === 'string' && value.hex.trim()) return value.hex.trim()
        if (typeof value.value === 'string' && value.value.trim()) return value.value.trim()
      }
    } catch (_) {
      /* ignore */
    }
    return '#ffffff'
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
      size='lg'
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
        {!isForced ? <ModalCloseButton /> : null}
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
                <strong>{t('termsModal.forced.requiredLabel')}</strong>{' '}
                {t('termsModal.forced.requiredMessage')}
              </Box>
            </Alert>
          )}
        </ModalBody>
        <ModalFooter gap={3}>
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
