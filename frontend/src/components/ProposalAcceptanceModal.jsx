import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Input,
  Alert,
  AlertIcon,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react'
import { motion, useReducedMotion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { acceptProposal } from '../queries/proposalQueries'

const defaultValues = {
  isExternalAcceptance: false,
  externalSignerName: '',
  externalSignerEmail: '',
}

const ProposalAcceptanceModal = ({
  show,
  onClose,
  proposal,
  onAcceptanceComplete,
  isContractor = false,
}) => {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const toast = useToast({ duration: 2500, isClosable: true })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const prefersReducedMotion = useReducedMotion()

  const {
    register,
    handleSubmit,
    watch,
    reset,
  } = useForm({ defaultValues })

  const isExternalAcceptance = watch('isExternalAcceptance')

  useEffect(() => {
    if (!show) {
      reset(defaultValues)
      setFormError('')
    }
  }, [show, reset])

  const handleClose = () => {
    if (isSubmitting) return
    reset(defaultValues)
    setFormError('')
    onClose?.()
  }

  const submitProposal = handleSubmit(async (values) => {
    setFormError('')

    if (values.isExternalAcceptance) {
      const name = values.externalSignerName?.trim() || ''
      const email = values.externalSignerEmail?.trim() || ''
      const hasNameOrEmail = name.length > 0 || email.length > 0

      if (!hasNameOrEmail) {
        setFormError(t('proposalAcceptance.errors.needNameOrEmail'))
        return
      }

      if (email && !/\S+@\S+\.\S+/.test(email)) {
        setFormError(t('proposalAcceptance.errors.invalidEmail'))
        return
      }
    }

    setIsSubmitting(true)

    try {
      const payload = { id: proposal.id }

      if (values.isExternalAcceptance) {
        if (values.externalSignerName?.trim()) {
          payload.externalSignerName = values.externalSignerName.trim()
        }
        if (values.externalSignerEmail?.trim()) {
          payload.externalSignerEmail = values.externalSignerEmail.trim()
        }
      }

      const result = await dispatch(acceptProposal(payload)).unwrap()

      toast({
        status: 'success',
        title: t('common.success'),
        description: t('proposals.toast.successAccept'),
      })

      if (result?.manufacturerEmailStatus === 'failed') {
        toast({
          status: 'warning',
          title: t('proposals.toast.manufacturerEmailFailed'),
          description: result?.manufacturerEmailError || t('proposals.toast.contactSupport'),
          duration: 4000,
        })
      }

      onAcceptanceComplete?.(result)
      handleClose()
    } catch (err) {
      const message = err?.message || t('proposals.toast.errorAccept')
      toast({ status: 'error', title: t('common.error'), description: message })
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  })

  const overlayMotionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 },
      }

  const contentMotionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
        transition: { duration: 0.2 },
      }

  return (
    <Modal isOpen={show} onClose={handleClose} size={{ base: 'full', md: 'md', lg: 'lg' }} scrollBehavior="inside" closeOnOverlayClick={!isSubmitting}>
      <ModalOverlay as={motion.div} {...overlayMotionProps} />
      <ModalContent as={motion.div} {...contentMotionProps}>
        <form onSubmit={submitProposal}>
          <ModalHeader>{t('proposalAcceptance.title')}</ModalHeader>
          <ModalCloseButton disabled={isSubmitting} aria-label="Close modal" />

          <ModalBody>
            <Stack spacing={4}>
              {formError && (
                <Alert status='warning'>
                  <AlertIcon />
                  {formError}
                </Alert>
              )}

              <Text>{t('proposalAcceptance.instructions')}</Text>

              <Checkbox
                {...register('isExternalAcceptance')}
                isDisabled={isSubmitting || isContractor}
              >
                {t('proposalAcceptance.useExternalSigner')}
              </Checkbox>

              {isExternalAcceptance && (
                <Stack spacing={4}>
                  <FormControl>
                    <FormLabel>{t('proposalAcceptance.externalSignerName')}</FormLabel>
                    <Input
                      placeholder={t('proposalAcceptance.externalSignerNamePlaceholder')}
                      {...register('externalSignerName')}
                      isDisabled={isSubmitting}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>{t('proposalAcceptance.externalSignerEmail')}</FormLabel>
                    <Input
                      type='email'
                      placeholder='email@example.com'
                      {...register('externalSignerEmail')}
                      isDisabled={isSubmitting}
                    />
                  </FormControl>
                </Stack>
              )}
            </Stack>
          </ModalBody>

          <ModalFooter gap={4}>
            <Button
              variant='ghost'
              onClick={handleClose}
              isDisabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button colorScheme='brand' type='submit' isLoading={isSubmitting}>
              {t('proposalAcceptance.confirm')}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}

export default ProposalAcceptanceModal
