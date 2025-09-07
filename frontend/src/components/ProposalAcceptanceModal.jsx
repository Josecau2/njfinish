import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CForm,
  CFormInput,
  CFormLabel,
  CFormCheck,
  CAlert,
  CSpinner,
  CRow,
  CCol
} from '@coreui/react';
import { useDispatch } from 'react-redux';
// Correct relative path to store from components/
import { acceptProposal } from '../store/slices/proposalSlice';
import Swal from 'sweetalert2';

const ProposalAcceptanceModal = ({
  show,
  onClose,
  proposal,
  onAcceptanceComplete,
  isContractor = false
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [isExternalAcceptance, setIsExternalAcceptance] = useState(false);
  const [externalSignerName, setExternalSignerName] = useState('');
  const [externalSignerEmail, setExternalSignerEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAccept = async () => {
    console.log('🎯 [DEBUG] ProposalAcceptanceModal handleAccept called:', {
      proposalId: proposal?.id,
      isExternalAcceptance,
      externalSignerName,
      externalSignerEmail,
      timestamp: new Date().toISOString()
    });

    setError('');

    // Validation for external acceptance
  if (isExternalAcceptance) {
      if (!externalSignerName.trim() && !externalSignerEmail.trim()) {
    setError(t('proposalAcceptance.errors.needNameOrEmail'));
        return;
      }

      if (externalSignerEmail && !/\S+@\S+\.\S+/.test(externalSignerEmail)) {
    setError(t('proposalAcceptance.errors.invalidEmail'));
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const acceptanceData = {
        id: proposal.id
      };

      if (isExternalAcceptance) {
        if (externalSignerName.trim()) {
          acceptanceData.externalSignerName = externalSignerName.trim();
        }
        if (externalSignerEmail.trim()) {
          acceptanceData.externalSignerEmail = externalSignerEmail.trim();
        }
      }

      console.log('📤 [DEBUG] Dispatching acceptProposal with data:', acceptanceData);

      const result = await dispatch(acceptProposal(acceptanceData)).unwrap();

      console.log('✅ [DEBUG] acceptProposal succeeded:', result);

      Swal.fire({
        title: t('common.success'),
        text: t('proposals.toast.successAccept'),
        icon: 'success',
        timer: 2000
      });

      console.log('🔄 [DEBUG] Calling onAcceptanceComplete');
      onAcceptanceComplete?.();
      onClose();

    } catch (error) {
  console.error('❌ [DEBUG] Acceptance error:', {
    error: error.message || error,
    proposalId: proposal?.id,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  setError(error.message || t('proposalAcceptance.errors.failedAccept'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setIsExternalAcceptance(false);
      setExternalSignerName('');
      setExternalSignerEmail('');
      setError('');
      onClose();
    }
  };

  return (
    <CModal visible={show} onClose={handleClose} size="lg">
      <CModalHeader>
        <CModalTitle>{t('proposalAcceptance.title')}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        {error && (
          <CAlert color="danger" className="mb-3">
            {error}
          </CAlert>
        )}

        <div className="mb-4">
          <h6>{t('proposalAcceptance.details')}</h6>
          <p className="mb-1"><strong>{t('proposalAcceptance.labels.customer')}:</strong> {proposal?.customer?.name || t('common.na')}</p>
          <p className="mb-1"><strong>{t('proposalAcceptance.labels.total')}:</strong> ${proposal?.manufacturersData?.totalPrice || proposal?.total || 0}</p>
          <p className="mb-1"><strong>{t('proposalAcceptance.labels.status')}:</strong> {proposal?.status || t('common.na')}</p>
          <p className="mb-3"><strong>{t('proposalAcceptance.labels.description')}:</strong> {proposal?.description || t('common.na')}</p>
        </div>

        <CAlert color="warning" className="mb-3">
          <strong>{t('proposalAcceptance.warningTitle')}</strong> {t('proposalAcceptance.warningText')}
        </CAlert>

        <CForm>
          <CFormCheck
            id="externalAcceptance"
            label={t('proposalAcceptance.externalCheck')}
            checked={isExternalAcceptance}
            onChange={(e) => setIsExternalAcceptance(e.target.checked)}
            className="mb-3"
          />

          {isExternalAcceptance && (
            <div className="border rounded p-3 bg-light">
              <h6 className="mb-3">{t('proposalAcceptance.externalInfo')}</h6>
              <CRow>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="signerName">{t('proposalAcceptance.signerName')}</CFormLabel>
                    <CFormInput
                      type="text"
                      id="signerName"
                      value={externalSignerName}
                      onChange={(e) => setExternalSignerName(e.target.value)}
                      placeholder={t('proposalAcceptance.signerNamePlaceholder')}
                      disabled={isSubmitting}
                    />
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="signerEmail">{t('proposalAcceptance.signerEmail')}</CFormLabel>
                    <CFormInput
                      type="email"
                      id="signerEmail"
                      value={externalSignerEmail}
                      onChange={(e) => setExternalSignerEmail(e.target.value)}
                      placeholder={t('proposalAcceptance.signerEmailPlaceholder')}
                      disabled={isSubmitting}
                    />
                  </div>
                </CCol>
              </CRow>
              <small className="text-muted">
                {t('proposalAcceptance.externalHint')}
              </small>
            </div>
          )}
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton
          color="secondary"
          onClick={handleClose}
          disabled={isSubmitting}
        >
          {t('common.cancel')}
        </CButton>
        <CButton
          color="success"
          onClick={handleAccept}
          disabled={isSubmitting}
          className="d-flex align-items-center gap-2"
        >
          {isSubmitting && <CSpinner size="sm" />}
          {t('proposalAcceptance.acceptButton')}
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default ProposalAcceptanceModal;
