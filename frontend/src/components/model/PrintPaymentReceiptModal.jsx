import React, { useState } from 'react'
import { useSelector } from 'react-redux'
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
  Spinner,
  Alert,
  AlertIcon,
  Stack,
  HStack,
  Text,
  useToast,
} from '@chakra-ui/react'
import PageHeader from '../PageHeader'
import axiosInstance from '../../helpers/axiosInstance'

const resolveBackground = (value) => {
  if (!value) return "gray.900"
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || "gray.900"
  }
  if (value && typeof value === 'object') {
    if (typeof value.hex === 'string' && value.hex.trim()) return value.hex.trim()
    if (typeof value.value === 'string' && value.value.trim()) return value.value.trim()
  }
  return "gray.900"
}

const getContrastColor = (color) => {
  if (!color) return "white"
  const hex = color.replace('#', '')
  if (hex.length !== 6) return "white"
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? "gray.700" : "white"
}

const formatCurrency = (value) => {
  const amount = Number(value) || 0
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

const generateReceiptHtml = ({ payment, order, customization, t }) => {
  const headerColor = resolveBackground(customization?.headerBg)
  const headerTextColor = getContrastColor(headerColor)
  const logoText = customization?.logoText || 'NJ Cabinets'

  const formatDate = (dateString) => {
    if (!dateString) return '--'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const buildOrderNumber = () => {
    if (!order) return ''
    if (order.order_number) return order.order_number
    try {
      const snapshot = typeof order.snapshot === 'string' ? JSON.parse(order.snapshot) : order.snapshot
      const snapNumber = snapshot?.info?.orderNumber
      if (snapNumber) return snapNumber
    } catch (_) {
      /* ignore */
    }

    const initials = logoText
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2)
    const datePart = new Date(order.createdAt || Date.now()).toISOString().slice(0, 10).replace(/-/g, '')
    return `${initials}${datePart}${order.id}`
  }

  const receiptNumber = (() => {
    if (!payment) return 'RCP-UNKNOWN'
    if (payment.details && typeof payment.details === 'object' && payment.details.receiptNumber) {
      return payment.details.receiptNumber
    }
    const stamp = new Date(payment.paidAt || payment.createdAt || Date.now()).toISOString().slice(0, 10).replace(/-/g, '')
    return `RCP${stamp}${payment.id}`
  })()

  const rows = [
    {
      label: t('paymentReceipt.modal.paymentAmount', 'Amount'),
      value: formatCurrency(payment?.amount),
    },
    {
      label: t('paymentReceipt.modal.order', 'Order'),
      value: buildOrderNumber(),
    },
    {
      label: t('paymentReceipt.modal.status', 'Status'),
      value: payment?.status || '--',
    },
    {
      label: t('paymentReceipt.modal.paidDate', 'Paid Date'),
      value: formatDate(payment?.paidAt || payment?.createdAt),
    },
    {
      label: t('paymentReceipt.modal.paymentMethod', 'Payment Method'),
      value: payment?.paymentMethod || '--',
    },
  ]

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; color: #1f2933; }
      .header { background: ${headerColor}; color: ${headerTextColor}; padding: 24px; }
      .container { padding: 24px; }
      .section { margin-bottom: 24px; }
      .info { display: flex; flex-direction: column; gap: 12px; }
      .info-row { display: flex; justify-content: space-between; font-size: 14px; }
      .info-row strong { color: #111827; }
      .footer { margin-top: 32px; font-size: 12px; color: #6b7280; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1 style="margin: 0; font-size: 22px;">${t('paymentReceipt.modal.title', 'Payment receipt')}</h1>
      <p style="margin: 4px 0 0;">${logoText}</p>
    </div>
    <div class="container">
      <div class="section">
        <h2 style="margin-bottom: 12px; font-size: 18px;">${t('paymentReceipt.modal.summary', 'Receipt summary')}</h2>
        <div class="info">
          ${rows
            .map(
              (row) => `
            <div class="info-row">
              <strong>${row.label}</strong>
              <span>${row.value || '--'}</span>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
      <div class="footer">
        ${t('paymentReceipt.modal.footerNote', 'Save this receipt for your records.')}
      </div>
    </div>
  </body>
</html>`
}

const PrintPaymentReceiptModal = ({ show, onClose, payment, order }) => {
  const { t } = useTranslation()
  const customization = useSelector((state) => state.customization)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const toast = useToast()

  const downloadReceipt = async () => {
    if (!payment) return
    setIsLoading(true)
    setError(null)

    try {
      const html = generateReceiptHtml({ payment, order, customization, t })
      const { data } = await axiosInstance.post(
        '/api/payments/receipt',
        {
          paymentId: payment.id,
          orderId: order?.id,
          html,
        },
        { responseType: 'blob' },
      )

      const blob = new Blob([data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `payment-receipt-${payment.id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        status: 'success',
        title: t('common.success', 'Success'),
        description: t('paymentReceipt.toast.generated', 'Receipt generated successfully.'),
      })
      onClose?.()
    } catch (err) {
      console.error('Error generating payment receipt:', err)
      setError(t('paymentReceipt.errors.generateFailed', 'Unable to generate receipt. Please try again.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={show} onClose={onClose} size={{ base: "full", lg: "lg" }} scrollBehavior="inside" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('paymentReceipt.modal.title', 'Payment receipt')}</ModalHeader>
        <ModalCloseButton aria-label="Close modal" isDisabled={isLoading} />
        <ModalBody>
          <Stack spacing={6}>
            <PageHeader
              title={t('paymentReceipt.modal.summaryTitle', 'Preview receipt details')}
              subtitle={t('paymentReceipt.modal.summarySubtitle', 'Download a branded PDF receipt for this payment.')}
            />

            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">{error}</Text>
              </Alert>
            )}

            <Stack spacing={4} fontSize="sm" bg="gray.50" borderRadius="md" p={4} borderWidth="1px" borderColor="gray.100">
              <Text>
                <Text as="span" fontWeight="semibold">
                  {t('paymentReceipt.modal.paymentAmount', 'Amount')}:
                </Text>{' '}
                {formatCurrency(payment?.amount)}
              </Text>
              <Text>
                <Text as="span" fontWeight="semibold">
                  {t('paymentReceipt.modal.order', 'Order')}:
                </Text>{' '}
                {order?.id ? `#${order.id}` : t('common.na', 'N/A')}
              </Text>
              <Text>
                <Text as="span" fontWeight="semibold">
                  {t('paymentReceipt.modal.status', 'Status')}:
                </Text>{' '}
                {payment?.status || t('common.na', 'N/A')}
              </Text>
              {payment?.paymentMethod && (
                <Text>
                  <Text as="span" fontWeight="semibold">
                    {t('paymentReceipt.modal.paymentMethod', 'Payment Method')}:
                  </Text>{' '}
                  {payment.paymentMethod}
                </Text>
              )}
              {payment?.paidAt && (
                <Text>
                  <Text as="span" fontWeight="semibold">
                    {t('paymentReceipt.modal.paidDate', 'Paid Date')}:
                  </Text>{' '}
                  {new Date(payment.paidAt).toLocaleDateString()}
                </Text>
              )}
            </Stack>

            <Text fontSize="sm" color="gray.600">
              {t('paymentReceipt.modal.notice', 'The receipt will include branding, payment summary, and signature-ready footer.')}
            </Text>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" mr={3} onClick={onClose} isDisabled={isLoading}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button colorScheme="brand" onClick={downloadReceipt} isDisabled={isLoading}>
            {isLoading ? (
              <HStack spacing={4}>
                <Spinner size="sm" />
                <Text>{t('paymentReceipt.modal.generating', 'Generating...')}</Text>
              </HStack>
            ) : (
              t('paymentReceipt.modal.downloadReceipt', 'Download receipt')
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default PrintPaymentReceiptModal
