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
  useColorModeValue,
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
  // Resolve colors and branding
  const headerColor = resolveBackground(customization?.headerBg)
  const headerTextColor = getContrastColor(headerColor)
  const logoText = customization?.logoText || customization?.companyName || 'NJ Cabinets'

  // Helper: Resolve logo URL similar to backend logic
  const resolveLogoUrl = () => {
    const pdfCustomization = customization?.pdfCustomization || customization

    // Check multiple legacy keys for logo
    const logoCandidate =
      pdfCustomization?.headerLogoDataUri ||
      pdfCustomization?.headerLogo ||
      pdfCustomization?.logo ||
      pdfCustomization?.logoImage

    if (!logoCandidate) return null

    // Data URI - return as-is
    if (typeof logoCandidate === 'string' && logoCandidate.startsWith('data:')) {
      return logoCandidate
    }

    // Absolute URL - return as-is
    if (typeof logoCandidate === 'string' && (logoCandidate.startsWith('http://') || logoCandidate.startsWith('https://'))) {
      return logoCandidate
    }

    // Relative path - prepend /public-uploads if needed
    if (typeof logoCandidate === 'string' && logoCandidate.trim()) {
      const path = logoCandidate.trim()
      if (path.startsWith('/uploads/')) {
        return `/public-uploads${path}`
      }
      if (!path.startsWith('/')) {
        return `/public-uploads/uploads/${path}`
      }
      return `/public-uploads${path}`
    }

    return null
  }

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

  // Get company info from customization
  const companyName = customization?.pdfCustomization?.companyName || customization?.companyName || logoText
  const companyPhone = customization?.pdfCustomization?.companyPhone || customization?.companyPhone || ''
  const companyEmail = customization?.pdfCustomization?.companyEmail || customization?.companyEmail || ''
  const companyWebsite = customization?.pdfCustomization?.companyWebsite || customization?.companyWebsite || ''
  const companyAddress = customization?.pdfCustomization?.companyAddress || customization?.companyAddress || ''

  const logoUrl = resolveLogoUrl()

  const rows = [
    {
      label: t('paymentReceipt.receiptNumber', 'Receipt #'),
      value: receiptNumber,
    },
    {
      label: t('paymentReceipt.paymentDate', 'Payment Date'),
      value: formatDate(payment?.paidAt || payment?.createdAt),
    },
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
      label: t('paymentReceipt.modal.paymentMethod', 'Payment Method'),
      value: payment?.paymentMethod || '--',
    },
  ]

  // Transaction ID if available
  if (payment?.transactionId) {
    rows.push({
      label: t('paymentReceipt.transactionId', 'Transaction ID'),
      value: payment.transactionId,
    })
  }

  // Consistent PDF styling matching proposal and order PDFs
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 12px;
        line-height: 1.6;
        color: #1f2937;
        background: white;
      }
      .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 0;
      }

      /* Header with branding - consistent with other PDFs */
      .header {
        background: ${headerColor};
        color: ${headerTextColor};
        padding: 20px 30px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 3px solid rgba(0,0,0,0.1);
      }
      .header .logo-section {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .header .logo {
        max-height: 60px;
        max-width: 200px;
        object-fit: contain;
      }
      .header .company-name {
        font-size: 24px;
        font-weight: 700;
      }
      .header .company-info {
        text-align: right;
        font-size: 11px;
        opacity: 0.95;
        line-height: 1.5;
      }

      .document-title {
        background: #f9fafb;
        padding: 16px 30px;
        border-bottom: 2px solid #e5e7eb;
      }
      .document-title h1 {
        font-size: 20px;
        font-weight: 600;
        color: #111827;
        margin-bottom: 4px;
      }
      .document-title p {
        font-size: 12px;
        color: #6b7280;
      }

      .content {
        padding: 30px;
      }

      .section {
        margin-bottom: 30px;
      }
      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: ${headerColor};
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 2px solid #e5e7eb;
      }

      .info-table {
        width: 100%;
        border-collapse: collapse;
        background: #f9fafb;
        border-radius: 8px;
        overflow: hidden;
      }
      .info-table tr {
        border-bottom: 1px solid #e5e7eb;
      }
      .info-table tr:last-child {
        border-bottom: none;
      }
      .info-table td {
        padding: 12px 16px;
        font-size: 13px;
      }
      .info-table td:first-child {
        font-weight: 600;
        color: #374151;
        width: 40%;
      }
      .info-table td:last-child {
        color: #111827;
        text-align: right;
      }

      .payment-total {
        background: ${headerColor};
        color: ${headerTextColor};
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        margin-top: 24px;
      }
      .payment-total .label {
        font-size: 14px;
        opacity: 0.9;
        margin-bottom: 8px;
      }
      .payment-total .amount {
        font-size: 32px;
        font-weight: 700;
      }

      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
        text-align: center;
        font-size: 11px;
        color: #6b7280;
        line-height: 1.6;
      }
      .footer strong {
        color: #374151;
      }

      @media print {
        .container {
          max-width: none;
          padding: 0;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <!-- Consistent branded header -->
      <div class="header">
        <div class="logo-section">
          ${logoUrl
            ? `<img src="${logoUrl}" alt="${companyName}" class="logo">`
            : `<div class="company-name">${companyName}</div>`
          }
        </div>
        <div class="company-info">
          ${companyName ? `<div><strong>${companyName}</strong></div>` : ''}
          ${companyPhone ? `<div>${companyPhone}</div>` : ''}
          ${companyEmail ? `<div>${companyEmail}</div>` : ''}
          ${companyWebsite ? `<div>${companyWebsite}</div>` : ''}
          ${companyAddress ? `<div>${companyAddress}</div>` : ''}
        </div>
      </div>

      <div class="document-title">
        <h1>${t('paymentReceipt.title', 'Payment Receipt')}</h1>
        <p>${t('paymentReceipt.officialReceipt', 'Official payment receipt for your records', { company: companyName })}</p>
      </div>

      <div class="content">
        <div class="section">
          <h2 class="section-title">${t('paymentReceipt.receiptInformation', 'Receipt Information')}</h2>
          <table class="info-table">
            ${rows.map(row => `
              <tr>
                <td>${row.label}</td>
                <td>${row.value || '--'}</td>
              </tr>
            `).join('')}
          </table>
        </div>

        <div class="payment-total">
          <div class="label">${t('paymentReceipt.totalPayment', 'Total Payment')}</div>
          <div class="amount">${formatCurrency(payment?.amount)}</div>
        </div>

        ${order?.description ? `
          <div class="section">
            <h2 class="section-title">${t('paymentReceipt.orderDetails', 'Order Details')}</h2>
            <p style="padding: 12px; background: #f9fafb; border-radius: 8px;">${order.description}</p>
          </div>
        ` : ''}
      </div>

      <div class="footer">
        <p><strong>${t('paymentReceipt.thankYou', 'Thank you for your business!')}</strong></p>
        <p>${t('paymentReceipt.generatedOn', 'Generated on', { date: formatDate(new Date()) })}</p>
        <p>${t('paymentReceipt.modal.footerNote', 'Please save this receipt for your records.')}</p>
      </div>
    </div>
  </body>
</html>`
}

const PrintPaymentReceiptModal = ({ show, onClose, payment, order }) => {
  const { t } = useTranslation()
  const customization = useSelector((state) => state.customization)
  const headerBgFallback = useColorModeValue('brand.500', 'brand.400')
  const resolvedHeaderBg = customization?.headerBg && customization.headerBg.trim() ? customization.headerBg : headerBgFallback
  const headerTextColor = customization?.headerFontColor || getContrastColor(resolvedHeaderBg)

  // Color mode values
  const bgGray50 = useColorModeValue('gray.50', 'gray.800')
  const bgGray100 = useColorModeValue('gray.100', 'gray.700')
  const borderGray600 = useColorModeValue('gray.600', 'gray.400')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const toast = useToast()

  const downloadReceipt = async () => {
    if (!payment) return
    setIsLoading(true)
    setError(null)

    try {
      const html = generateReceiptHtml({ payment, order, customization, t })
      const isTestReceipt = Boolean(payment?.__isTest)
      const requestPayload = {
        orderId: order?.id,
        html,
      }

      if (!isTestReceipt && payment?.id != null) {
        requestPayload.paymentId = payment.id
      }

      const { data } = await axiosInstance.post('/api/payments/receipt', requestPayload, {
        responseType: 'blob',
      })

      const blob = new Blob([data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const downloadId = payment?.id ?? 'preview'
      link.download = `payment-receipt-${downloadId}.pdf`
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
      <ModalContent borderRadius="12px">
        <ModalHeader bg={resolvedHeaderBg} color={headerTextColor}>
          <Text fontSize="lg" fontWeight="semibold">
            {t('paymentReceipt.modal.title', 'Payment receipt')}
          </Text>
        </ModalHeader>
        <ModalCloseButton aria-label={t('common.ariaLabels.closeModal', 'Close modal')} isDisabled={isLoading} color={headerTextColor} />
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

            <Stack spacing={4} fontSize="sm" bg={bgGray50} borderRadius="md" p={4} borderWidth="1px" borderColor={bgGray100}>
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

            <Text fontSize="sm" color={borderGray600}>
              {t('paymentReceipt.modal.notice', 'The receipt will include branding, payment summary, and signature-ready footer.')}
            </Text>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" mr={3} onClick={onClose} isDisabled={isLoading} minH="44px">
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button colorScheme="brand" onClick={downloadReceipt} isDisabled={isLoading} minH="44px">
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
