import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  Switch,
  Checkbox,
  Button,
  Stack,
  HStack,
  Text,
  Spinner,
} from '@chakra-ui/react'
import { Controller, useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import axiosInstance from '../../helpers/axiosInstance'
import {
  buildProposalPdfHtml,
  DEFAULT_PROPOSAL_PDF_COLUMNS,
} from '../../helpers/proposalPdfBuilder'

const MotionButton = motion(Button)

const EmailProposalModal = ({ show, onClose, formData, onSend }) => {
  const { t, i18n } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [pdfCustomization, setPdfCustomization] = useState(null)
  const [styleData, setStyleData] = useState(null)
  const [manufacturerNameData, setManufacturerNameData] = useState(null)

  const defaultValues = useMemo(
    () => ({
      email: formData?.customerEmail || '',
      body: formData?.emailBody || '',
      sendCopy: true,
      updateCustomerEmail: false,
      selectedColumns: DEFAULT_PROPOSAL_PDF_COLUMNS.slice(),
    }),
    [formData?.customerEmail, formData?.emailBody],
  )

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    mode: 'onBlur',
    defaultValues,
  })

  useEffect(() => {
    if (show) {
      reset(defaultValues)
    }
  }, [show, defaultValues, reset])

  const shortLabel = useCallback(
    (code) => {
      switch (code) {
        case 'L':
          return t('common.short.left', { defaultValue: 'L' })
        case 'R':
          return t('common.short.right', { defaultValue: 'R' })
        case 'B':
          return t('common.short.both', { defaultValue: 'B' })
        default:
          return code ?? t('common.na', 'N/A')
      }
    },
    [t],
  )

  const fetchPdfCustomization = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/api/settings/customization/pdf')
      setPdfCustomization(res.data || {})
    } catch (error) {
      console.error('Error fetching PDF customization:', error)
    }
  }, [])

  const fetchStyleData = useCallback(async (manufacturerId, styleId) => {
    if (!manufacturerId || !styleId) return
    try {
      const response = await axiosInstance.get(`/api/manufacturers/${manufacturerId}/styles-meta`)
      const styles = response.data?.styles || []
      const matchedStyle = styles.find((style) => style.id === styleId)
      setStyleData(matchedStyle || null)
    } catch (error) {
      console.error('Error fetching style data:', error)
    }
  }, [])

  const fetchManufacturerName = useCallback(async (manufacturerId) => {
    if (!manufacturerId) return
    try {
      const response = await axiosInstance.get(`/api/manufacturers/${manufacturerId}`)
      setManufacturerNameData(response.data || null)
    } catch (error) {
      console.error('Error fetching manufacturer data:', error)
    }
  }, [])

  useEffect(() => {
    if (!show) return
    fetchPdfCustomization()
  }, [show, fetchPdfCustomization])

  useEffect(() => {
    if (!show) return
    const manufacturerData = Array.isArray(formData?.manufacturersData)
      ? formData.manufacturersData[0]
      : null
    const manufacturerId = manufacturerData?.manufacturer || manufacturerData?.manufacturerId
    const styleId = manufacturerData?.selectedStyle || manufacturerData?.styleId
    fetchStyleData(manufacturerId, styleId)
    fetchManufacturerName(manufacturerId)
  }, [show, formData?.manufacturersData, fetchStyleData, fetchManufacturerName])

  const buildHtml = useCallback(
    (values) =>
      buildProposalPdfHtml({
        formData,
        options: {
          selectedColumns: values.selectedColumns,
          showProposalItems: true,
          showPriceSummary: true,
          selectedVersions: [],
          includeCatalog: true,
        },
        pdfCustomization,
        t,
        i18n,
        shortLabel,
        styleData,
        manufacturerNameData,
      }),
    [formData, pdfCustomization, t, i18n, shortLabel, styleData, manufacturerNameData],
  )

  const catalogCount = useMemo(() => {
    const catalog = formData?.selectedCatalog
    if (!catalog) return 0
    if (Array.isArray(catalog)) return catalog.length
    try {
      const parsed = JSON.parse(catalog)
      return Array.isArray(parsed) ? parsed.length : 0
    } catch (error) {
      return 0
    }
  }, [formData?.selectedCatalog])

  const handleCancel = () => {
    if (loading) return
    onClose?.()
    reset(defaultValues)
  }

  const onSubmit = async (values) => {
    try {
      setLoading(true)
      const htmlContent = buildHtml(values)
      const htmlBody = (values.body || '')
        .split(/\r?\n/)
        .map((line) => (line.length ? line : '&nbsp;'))
        .join('<br />')
      const proposalNum = formData?.proposal_number
      const subject = proposalNum ? `Your Quote ${proposalNum}` : 'Your Proposal'
      const attachmentFilename = proposalNum ? `Quote-${proposalNum}.pdf` : 'Proposal.pdf'

      await axiosInstance.post('/api/proposals/send-email', {
        email: values.email,
        body: htmlBody,
        sendCopy: values.sendCopy,
        updateCustomerEmail: values.updateCustomerEmail,
        htmlContent,
        subject,
        attachmentFilename,
      })

      onSend?.()
      onClose?.()
      reset(defaultValues)
    } catch (error) {
      console.error('Send email failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={show} onClose={handleCancel} size='xl' isCentered scrollBehavior='inside'>
      <ModalOverlay />
      <ModalContent as='form' onSubmit={handleSubmit(onSubmit)} className='email-proposal-modal'>
        <ModalHeader>
          <Text fontSize='lg' fontWeight='semibold'>
            {t('proposalCommon.emailTitle')}
          </Text>
        </ModalHeader>
        <ModalCloseButton disabled={loading} />

        <ModalBody>
          <Stack spacing={5}>
            <FormControl isInvalid={!!errors.email} isRequired>
              <FormLabel htmlFor='email' fontWeight='semibold'>
                {t('proposalCommon.emailAddress')}
              </FormLabel>
              <Input
                id='email'
                type='email'
                placeholder={t('proposalCommon.emailPlaceholder')}
                isDisabled={loading}
                {...register('email', {
                  required: t('proposalCommon.validation.emailRequired'),
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: t('proposalCommon.validation.invalidEmail'),
                  },
                })}
              />
              <FormErrorMessage>{errors.email && errors.email.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.body} isRequired>
              <FormLabel htmlFor='body' fontWeight='semibold'>
                {t('proposalCommon.emailBody')}
              </FormLabel>
              <Textarea
                id='body'
                rows={6}
                placeholder={t('proposalCommon.emailBodyPlaceholder', 'Write your message...')}
                isDisabled={loading}
                {...register('body', {
                  required: t('proposalCommon.validation.bodyRequired'),
                })}
              />
              <FormErrorMessage>{errors.body && errors.body.message}</FormErrorMessage>
            </FormControl>

            <HStack spacing={3} align='center'>
              <Controller
                control={control}
                name='sendCopy'
                render={({ field }) => (
                  <Switch
                    id='sendCopy'
                    colorScheme='brand'
                    size='lg'
                    isChecked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                    isDisabled={loading}
                  />
                )}
              />
              <Text fontWeight='medium'>{t('proposalCommon.includeItems')}</Text>
            </HStack>

            {catalogCount > 0 && (
              <Text fontSize='sm' color='gray.500'>
                {t('proposalCommon.catalogItemsIncluded', {
                  count: catalogCount,
                  defaultValue: '{{count}} catalog items will be included in the PDF.',
                })}
              </Text>
            )}

            <HStack spacing={3} align='center'>
              <Controller
                control={control}
                name='updateCustomerEmail'
                render={({ field }) => (
                  <Checkbox
                    id='updateCustomerEmail'
                    size='lg'
                    isChecked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                    isDisabled={loading}
                  />
                )}
              />
              <Text fontWeight='semibold'>
                {t('proposalCommon.updateCustomerEmail')}
              </Text>
            </HStack>
          </Stack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <MotionButton
              variant='outline'
              colorScheme='gray'
              onClick={handleCancel}
              isDisabled={loading}
              whileTap={{ scale: 0.98 }}
            >
              {t('common.cancel')}
            </MotionButton>
            <MotionButton
              type='submit'
              colorScheme='brand'
              isDisabled={loading}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <HStack spacing={2}>
                  <Spinner size='sm' />
                  <Text>{t('proposalCommon.sending')}</Text>
                </HStack>
              ) : (
                t('proposalCommon.sendEmail')
              )}
            </MotionButton>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default EmailProposalModal
