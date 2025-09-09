import React, { useState, useEffect } from 'react';
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CSpinner,
  CAlert,
  CFormSelect,
  CFormLabel,
  CRow,
  CCol,
} from '@coreui/react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import axiosInstance from '../../helpers/axiosInstance';
import { generateProposalPdfTemplate } from '../../helpers/pdfTemplateGenerator';

const PrintPaymentReceiptModal = ({ show, onClose, payment, order }) => {
  const { t } = useTranslation();
  const user = useSelector((state) => state.auth.user);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(payment?.paymentMethod || '');

  // Check if user is admin
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  // Payment method options for admin selection
  const paymentMethods = [
    { value: '', label: 'Select Payment Method' },
    { value: 'cash', label: 'Cash' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'check', label: 'Check' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    if (payment?.paymentMethod) {
      setPaymentMethod(payment.paymentMethod);
    }
  }, [payment]);

  const generateOrderNumber = () => {
    // Get company first two letters (fallback to 'NJ' if not available)
    const companyName = order?.proposal?.companyName || payment?.order?.proposal?.companyName || 'NJ Cabinets';
    const companyPrefix = companyName.substring(0, 2).toUpperCase();
    
    // Get date in YYYYMMDD format
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    // Get order number
    const orderNum = order?.id || payment?.orderId || '000';
    
    return `${companyPrefix}${date}${orderNum}`;
  };

  const getPaymentMethodLabel = (method) => {
    const found = paymentMethods.find(pm => pm.value === method);
    return found ? found.label : method || 'Not specified';
  };

  const handleDownloadPDF = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Update payment method if admin changed it
      if (isAdmin && paymentMethod && paymentMethod !== payment?.paymentMethod) {
        await axiosInstance.put(`/api/payments/${payment.id}`, {
          paymentMethod,
        });
      }

      // Generate order number format: company first two letters + date + order number
      const orderNumber = generateOrderNumber();
      const receiptNumber = `REC-${payment?.id || Math.random().toString(36).substr(2, 9)}`;

      // Use the existing PDF template system from PrintProposalModal
      const proposalData = {
        // Basic proposal info for the PDF template
        customerName: payment?.order?.customer?.name || order?.customer?.name || 'N/A',
        customerAddress: payment?.order?.customer?.address || order?.customer?.address || '',
        customerPhone: payment?.order?.customer?.phone || order?.customer?.phone || '',
        customerEmail: payment?.order?.customer?.email || order?.customer?.email || '',
        
        // Additional fields that might be needed by the template
        id: payment?.orderId || order?.id,
        total: payment?.amount || 0,
        items: [], // Empty for payment receipt
      };

      const orderData = order || payment?.order || {};

      // Create payment-specific data to add to the PDF
      const paymentData = {
        orderNumber,
        receiptNumber,
        paymentMethod: getPaymentMethodLabel(paymentMethod),
        amount: payment?.amount ? Number(payment.amount).toFixed(2) : '0.00',
        paymentDate: payment?.paidAt ? new Date(payment.paidAt).toLocaleDateString() : new Date().toLocaleDateString(),
        status: payment?.status || 'Completed',
        transactionId: payment?.transactionId || '',
      };

      // Generate HTML using the same system as PrintProposalModal
      const htmlTemplate = generateProposalPdfTemplate({
        proposal: proposalData,
        order: orderData,
        isPaymentReceipt: true,
        paymentData: paymentData,
        pdfCustomization: {
          showProposalItems: false, // Don't show proposal items for payment receipt
          showGroupItems: false,
          showImages: false,
          showPricing: false, // Only show payment amount
        },
      });

      // Send to backend for PDF generation using the same endpoint as proposals
      const response = await axiosInstance.post('/api/generate-pdf', {
        htmlContent: htmlTemplate,
        filename: `payment-receipt-${receiptNumber}.pdf`,
        options: {
          format: 'A4',
          printBackground: true,
          margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' },
        },
      });

      if (response.data.success && response.data.url) {
        // Create download link
        const link = document.createElement('a');
        link.href = response.data.url;
        link.download = `payment-receipt-${receiptNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Close modal after successful download
        onClose();
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (err) {
      console.error('Error generating payment receipt PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateHTMLTemplate = (paymentData, orderData) => {
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

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Receipt</title>
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
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
        }

        .header h1 {
            color: #007bff;
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
            color: #007bff;
            margin-bottom: 10px;
            font-size: 16px;
        }

        .receipt-info p {
            margin-bottom: 5px;
        }

        .payment-details {
            background: white;
            border: 2px solid #007bff;
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 30px;
        }

        .payment-details h3 {
            color: #007bff;
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
            color: #007bff;
        }

        .payment-table .amount {
            text-align: right;
            font-weight: bold;
            font-size: 16px;
        }

        .total-section {
            background: #007bff;
            color: white;
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
            color: #007bff;
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
            <h1>NJ Cabinets</h1>
            <h2>Payment Receipt</h2>
        </div>

        <div class="receipt-info">
            <div>
                <h3>Receipt Information</h3>
                <p><strong>Receipt #:</strong> ${paymentData.id}</p>
                <p><strong>Payment Date:</strong> ${formatDate(paymentData.paidAt || paymentData.createdAt)}</p>
                <p><strong>Payment Method:</strong> ${paymentData.paymentMethod || 'Not specified'}</p>
                ${paymentData.transactionId ? `<p><strong>Transaction ID:</strong> ${paymentData.transactionId}</p>` : ''}
            </div>
            <div>
                <h3>Order Information</h3>
                <p><strong>Order #:</strong> ${orderData.id}</p>
                <p><strong>Order Date:</strong> ${formatDate(orderData.createdAt)}</p>
                <p><strong>Customer:</strong> ${orderData.User?.firstName || ''} ${orderData.User?.lastName || ''}</p>
                ${orderData.User?.email ? `<p><strong>Email:</strong> ${orderData.User.email}</p>` : ''}
            </div>
        </div>

        <div class="payment-details">
            <h3>Payment Details</h3>
            <table class="payment-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Status</th>
                        <th class="amount">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Payment for Order #${orderData.id}</td>
                        <td>
                            <span class="status-badge ${paymentData.status === 'completed' ? 'status-completed' : 'status-pending'}">
                                ${paymentData.status}
                            </span>
                        </td>
                        <td class="amount">${formatCurrency(paymentData.amount)}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="total-section">
            <h3>Total Payment</h3>
            <div class="amount">${formatCurrency(paymentData.amount)}</div>
        </div>

        ${orderData.description ? `
        <div class="order-info">
            <h3>Order Details</h3>
            <p>${orderData.description}</p>
        </div>
        ` : ''}

        <div class="footer">
            <p>This is an official payment receipt from NJ Cabinets.</p>
            <p>Generated on ${formatDate(new Date())}</p>
            <p>Thank you for your business!</p>
        </div>
    </div>
</body>
</html>`;
  };

  const downloadReceipt = async () => {
    try {
      setError(null);
      setIsLoading(true);

      const htmlContent = generateHTMLTemplate(payment, order);

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
      link.download = `payment-receipt-${payment.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error('Error generating payment receipt:', error);
      setError('Failed to generate payment receipt. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CModal visible={show} onClose={onClose} size="lg">
      <CModalHeader>
        <CModalTitle>Print Payment Receipt</CModalTitle>
      </CModalHeader>
      <CModalBody>
        {error && (
          <CAlert color="danger" className="mb-3">
            {error}
          </CAlert>
        )}
        <p>Generate a PDF receipt for payment #{payment?.id}?</p>
        <div className="mt-3">
          <strong>Payment Amount:</strong> ${payment?.amount ? Number(payment.amount).toFixed(2) : '0.00'}
          <br />
          <strong>Order:</strong> #{order?.id}
          <br />
          <strong>Status:</strong> {payment?.status}
          <br />
          {payment?.paidAt && (
            <>
              <strong>Paid Date:</strong> {new Date(payment.paidAt).toLocaleDateString()}
            </>
          )}
        </div>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose} disabled={isLoading}>
          Cancel
        </CButton>
        <CButton color="primary" onClick={downloadReceipt} disabled={isLoading}>
          {isLoading ? (
            <>
              <CSpinner size="sm" className="me-2" />
              Generating...
            </>
          ) : (
            'Download Receipt'
          )}
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default PrintPaymentReceiptModal;
