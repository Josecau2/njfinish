import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  CModal,
  CModalBody,
  CModalFooter,
  CButton,
  CSpinner,
  CAlert
} from '@coreui/react';
import PageHeader from '../PageHeader';
import axiosInstance from '../../helpers/axiosInstance';

const PrintPaymentReceiptModal = ({ show, onClose, payment, order }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const customization = useSelector((state) => state.customization);
  const { t } = useTranslation();

  // Enhanced contrast calculation function (same as PageHeader)
  const getContrastColor = (backgroundColor) => {
    if (!backgroundColor) return '#ffffff';

    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate luminance using WCAG formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return high contrast colors
    return luminance > 0.5 ? '#2d3748' : '#ffffff';
  };

  // Resolve background color (same as PageHeader)
  const resolveBackground = (value) => {
    try {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed || '#007bff';
      }
      if (value && typeof value === 'object') {
        if (typeof value.hex === 'string' && value.hex.trim()) return value.hex.trim();
        if (typeof value.value === 'string' && value.value.trim()) return value.value.trim();
      }
    } catch (_) { /* ignore and fallback */ }
    return '#007bff';
  };

  // Get customization colors
  const backgroundColor = resolveBackground(customization?.headerBg);
  const textColor = getContrastColor(backgroundColor);

  // Get optimal colors for different elements (same as PageHeader)
  const getOptimalColors = (backgroundColor) => {
    const textColor = getContrastColor(backgroundColor);
    const isLight = textColor === '#2d3748';

    return {
      text: textColor,
      subtitle: isLight ? 'rgba(45, 55, 72, 0.6)' : 'rgba(255, 255, 255, 0.6)',
      button: {
        primary: {
          bg: backgroundColor,
          color: textColor,
          border: backgroundColor,
          hover: {
            bg: backgroundColor,
            color: textColor
          }
        }
      }
    };
  };

  const optimalColors = getOptimalColors(backgroundColor);

  // Minimal dynamic styles (PageHeader supplies global button/header overrides)
  const dynamicStyles = `
    .receipt-modal-customized .modal-content { border: 1px solid ${backgroundColor}20 !important; }
    .receipt-modal-customized .modal-body strong { color: ${backgroundColor} !important; }
  `;

  const generateHTMLTemplate = (paymentData, orderData, customizationColors) => {
    const primaryColor = resolveBackground(customizationColors?.headerBg);
    const textColor = getContrastColor(primaryColor);
    const logoText = customizationColors?.logoText || 'NJ Cabinets';
    const formatCurrency = (amount) => {
      const numAmount = Number(amount) || 0;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(numAmount);
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Generate displayable order number (normalized if available)
    const generateOrderNumber = (orderData) => {
      if (!orderData) return '';
      // Prefer persisted normalized field
      if (orderData.order_number) return orderData.order_number;
      // Try snapshot.info.orderNumber
      try {
        const snap = typeof orderData.snapshot === 'string' ? JSON.parse(orderData.snapshot) : orderData.snapshot;
        const num = snap?.info?.orderNumber;
        if (num) return num;
      } catch (_) { /* ignore */ }
      // Legacy fallback (company initials + date + id)
      const companyInitials = logoText
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .slice(0, 2);
      const orderDate = new Date(orderData.createdAt);
      const dateStr = orderDate.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
      return `${companyInitials}${dateStr}${orderData.id}`;
    };

    // Generate receipt number
    const generateReceiptNumber = (paymentData) => {
      const paymentDate = new Date(paymentData.paidAt || paymentData.createdAt);
      const dateStr = paymentDate.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
      return `RCP${dateStr}${paymentData.id}`;
    };

    const formatPaymentMethod = (method) => {
      if (!method) return t('paymentReceipt.paymentMethod.notSpecified');

      // Handle different payment method formats
      if (method.startsWith('check #')) {
        return `${t('paymentReceipt.paymentMethod.check')} #${method.replace('check #', '')}`;
      }

      switch (method.toLowerCase()) {
        case 'cash':
          return t('paymentReceipt.paymentMethod.cash');
        case 'debit_card':
          return t('paymentReceipt.paymentMethod.debitCard');
        case 'credit_card':
          return t('paymentReceipt.paymentMethod.creditCard');
        case 'check':
          return t('paymentReceipt.paymentMethod.check');
        case 'other':
          return t('paymentReceipt.paymentMethod.other');
        default:
          return method;
      }
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t('paymentReceipt.title')}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #333;
            background: white;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            background: white;
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid ${primaryColor};
            padding-bottom: 20px;
        }

        .header h1 {
            color: ${primaryColor};
            font-size: 28px;
            margin-bottom: 10px;
        }

        .header h2 {
            color: #666;
            font-size: 18px;
            font-weight: normal;
        }

        .receipt-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
        }

        .receipt-info div {
            flex: 1;
        }

        .receipt-info h3 {
            color: ${primaryColor};
            margin-bottom: 10px;
            font-size: 16px;
        }

        .receipt-info p {
            margin-bottom: 5px;
        }

        .payment-details {
            background: white;
            border: 2px solid ${primaryColor};
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 30px;
        }

        .payment-details h3 {
            color: ${primaryColor};
            margin-bottom: 20px;
            font-size: 18px;
            text-align: center;
        }

        .payment-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        .payment-table th,
        .payment-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }

        .payment-table th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: ${primaryColor};
        }

        .payment-table .amount {
            text-align: right;
            font-weight: bold;
            font-size: 16px;
        }

        .total-section {
            background: ${primaryColor};
            color: ${textColor};
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }

        .total-section h3 {
            margin-bottom: 10px;
            font-size: 18px;
        }

        .total-section .amount {
            font-size: 24px;
            font-weight: bold;
        }

        .order-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }

        .order-info h3 {
            color: ${primaryColor};
            margin-bottom: 15px;
            font-size: 16px;
        }

        .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
        }

        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .status-completed {
            background-color: #28a745;
            color: white;
        }

        .status-pending {
            background-color: #ffc107;
            color: #212529;
        }

        @media print {
            .container {
                max-width: none;
                margin: 0;
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${logoText}</h1>
            <h2>${t('paymentReceipt.title')}</h2>
        </div>

        <div class="receipt-info">
            <div>
                <h3>${t('paymentReceipt.receiptInformation')}</h3>
                <p><strong>${t('paymentReceipt.receiptNumber')}:</strong> ${generateReceiptNumber(paymentData)}</p>
                <p><strong>${t('paymentReceipt.paymentDate')}:</strong> ${formatDate(paymentData.paidAt || paymentData.createdAt)}</p>
                <p><strong>${t('paymentReceipt.paymentMethod.label')}:</strong> ${formatPaymentMethod(paymentData.paymentMethod)}</p>
                ${paymentData.transactionId ? `<p><strong>${t('paymentReceipt.transactionId')}:</strong> ${paymentData.transactionId}</p>` : ''}
            </div>
            <div>
                <h3>${t('paymentReceipt.orderInformation')}</h3>
                <p><strong>${t('paymentReceipt.orderNumber')}:</strong> ${generateOrderNumber(orderData)}</p>
                <p><strong>${t('paymentReceipt.orderDate')}:</strong> ${formatDate(orderData.createdAt)}</p>
                <p><strong>${t('paymentReceipt.customer')}:</strong> ${orderData.User?.firstName || ''} ${orderData.User?.lastName || ''}</p>
                ${orderData.User?.email ? `<p><strong>${t('paymentReceipt.email')}:</strong> ${orderData.User.email}</p>` : ''}
            </div>
        </div>

        <div class="payment-details">
            <h3>${t('paymentReceipt.paymentDetails')}</h3>
            <table class="payment-table">
                <thead>
                    <tr>
                        <th>${t('paymentReceipt.description')}</th>
                        <th>${t('paymentReceipt.status')}</th>
                        <th class="amount">${t('paymentReceipt.amount')}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${t('paymentReceipt.paymentForOrder')} #${generateOrderNumber(orderData)}</td>
                        <td>
                            <span class="status-badge ${paymentData.status === 'completed' ? 'status-completed' : 'status-pending'}">
                                ${t(`paymentReceipt.statusValues.${paymentData.status}`, { defaultValue: paymentData.status })}
                            </span>
                        </td>
                        <td class="amount">${formatCurrency(paymentData.amount)}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="total-section">
            <h3>${t('paymentReceipt.totalPayment')}</h3>
            <div class="amount">${formatCurrency(paymentData.amount)}</div>
        </div>

        ${orderData.description ? `
        <div class="order-info">
            <h3>${t('paymentReceipt.orderDetails')}</h3>
            <p>${orderData.description}</p>
        </div>
        ` : ''}

        <div class="footer">
            <p>${t('paymentReceipt.officialReceipt', { company: logoText })}</p>
            <p>${t('paymentReceipt.generatedOn', { date: formatDate(new Date()) })}</p>
            <p>${t('paymentReceipt.thankYou')}</p>
        </div>
    </div>
</body>
</html>`;
  };

  const downloadReceipt = async () => {
    try {
      setError(null);
      setIsLoading(true);

      const htmlContent = generateHTMLTemplate(payment, order, customization);

      const response = await axiosInstance.post('/api/generate-pdf', {
        html: htmlContent,
        options: {
          format: 'A4',
          margin: {
            top: '20mm',
            right: '20mm',
            bottom: '20mm',
            left: '20mm'
          },
          printBackground: true
        }
      }, {
        responseType: 'blob',
        timeout: 30000
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename using normalized order number when available
      const orderNumber = order?.order_number || (order?.snapshot?.info && order.snapshot.info.orderNumber) || null;
      if (orderNumber) {
        link.download = `Payment-Receipt-${orderNumber}.pdf`;
      } else {
        // Fallback to prior receipt code format
        const receiptDate = new Date(payment.paidAt || payment.createdAt);
        const dateStr = receiptDate.toISOString().slice(0, 10).replace(/-/g, '');
        const receiptNumber = `RCP${dateStr}${payment.id}`;
        link.download = `payment-receipt-${receiptNumber}.pdf`;
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error('Error generating payment receipt:', error);
      setError(t('paymentReceipt.errors.generateFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{dynamicStyles}</style>
      <CModal visible={show} onClose={onClose} size="lg" className="receipt-modal-customized">
        <CModalBody>
          <PageHeader
            title={t('paymentReceipt.modal.title')}
            subtitle={t('paymentReceipt.modal.confirmGenerate', { paymentId: payment?.id })}
            mobileLayout="compact"
            badges={[
              payment?.status ? {
                text: t(`paymentReceipt.statusValues.${payment.status}`, { defaultValue: payment.status }),
                variant: payment.status === 'completed' ? 'success' : 'secondary'
              } : null
            ]}
            cardClassName="mb-3"
          />
          {error && (
            <CAlert color="danger" className="mb-3">
              {error}
            </CAlert>
          )}
          <div className="mt-3">
            <strong>{t('paymentReceipt.modal.paymentAmount')}:</strong> ${payment?.amount ? Number(payment.amount).toFixed(2) : '0.00'}
            <br />
            <strong>{t('paymentReceipt.modal.order')}:</strong> #{order?.id}
            <br />
            <strong>{t('paymentReceipt.modal.status')}:</strong> {t(`paymentReceipt.statusValues.${payment?.status}`, { defaultValue: payment?.status })}
            <br />
            {payment?.paymentMethod && (
              <>
                <strong>{t('paymentReceipt.modal.paymentMethod')}:</strong> {(() => {
                  const method = payment.paymentMethod;
                  if (method.startsWith('check #')) {
                    return `${t('paymentReceipt.paymentMethod.check')} #${method.replace('check #', '')}`;
                  }
                  switch (method.toLowerCase()) {
                    case 'cash': return t('paymentReceipt.paymentMethod.cash');
                    case 'debit_card': return t('paymentReceipt.paymentMethod.debitCard');
                    case 'credit_card': return t('paymentReceipt.paymentMethod.creditCard');
                    case 'check': return t('paymentReceipt.paymentMethod.check');
                    case 'other': return t('paymentReceipt.paymentMethod.other');
                    default: return method;
                  }
                })()}
                <br />
              </>
            )}
            {payment?.paidAt && (
              <>
                <strong>{t('paymentReceipt.modal.paidDate')}:</strong> {new Date(payment.paidAt).toLocaleDateString()}
              </>
            )}
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={onClose} disabled={isLoading}>
            {t('common.cancel')}
          </CButton>
          <CButton color="primary" onClick={downloadReceipt} disabled={isLoading}>
            {isLoading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                {t('paymentReceipt.modal.generating')}
              </>
            ) : (
              t('paymentReceipt.modal.downloadReceipt')
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default PrintPaymentReceiptModal;
