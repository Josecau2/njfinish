import { useEffect, useState } from 'react';
import CustomerInfoStep from './CreateProposal/CustomerInfo';
import ManufacturerStep from './CreateProposal/ManufacturerSelect';
import DesignImportStep from './CreateProposal/DesignUpload';
import ItemSelectionStep from './CreateProposal/ProposalSummary';
import { useDispatch, useSelector } from 'react-redux';
import { fetchManufacturerById } from '../../store/slices/manufacturersSlice';
import { FaPrint, FaEnvelope, FaFileContract, FaClipboardList, FaCog } from 'react-icons/fa';
import PrintProposalModal from '../../components/model/PrintProposalModal';
import EmailProposalModal from '../../components/model/EmailProposalModal';
import EmailContractModal from '../../components/model/EmailContractModal';
import { sendFormDataToBackend } from '../../store/slices/proposalSlice';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import withContractorScope from '../../components/withContractorScope';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../components/PageHeader';
import {
  CContainer,
  CCard,
  CCardBody,
  CRow,
  CCol,
  CButton,
  CBadge,
  CSpinner
} from '@coreui/react';

const ProposalForm = ({ isContractor, contractorGroupId, contractorModules, contractorGroupName }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const queryParams = new URLSearchParams(location.search);
  const isQuick = queryParams.get('quick') === 'yes';
  const [currentStep, setCurrentStep] = useState(isQuick ? 2 : 1);
  const [backStep, setBackStep] = useState(false);
  const [formData, setFormData] = useState({
    customerId: "",
    customerName: '',
    customerEmail: '',
    designer: '',
    description: '',
    measurementDone: false,
    designDone: false,
    measurementDate: null,
    designDate: null,
    location: '',
    salesRep: '',
    leadSource: '',
    type: '',
    manufacturerId: '',
    versionName: '',
    assembled: true,
    totalPrice: 0,
    status: '',
    // followUp1Date: '',
    // followUp2Date: '',
    // followUp3Date: '',
    manufacturersData: [],
  });
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const dispatch = useDispatch();
  const manufacturerData = useSelector((state) => state.manufacturers.selected);
  const [hovered, setHovered] = useState(null);
  const navigate = useNavigate();

  const [isFormDirty, setIsFormDirty] = useState(true);

  useEffect(() => {
    if (!isFormDirty) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const handlePopState = (e) => {
  const confirmLeave = window.confirm(t('common.unsavedConfirm','You have unsaved changes. Are you sure you want to leave?'));
      if (!confirmLeave) {
        window.history.pushState(null, '', window.location.pathname);
      } else {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
    };

    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isFormDirty]);

  useEffect(() => {
    if (formData.manufacturerId) {
      // Don't load full catalog data for proposal creation - only manufacturer info needed
      dispatch(fetchManufacturerById({ id: formData.manufacturerId, includeCatalog: false }));
    }
  }, [formData.manufacturerId, dispatch]);

  const updateFormData = (newData) => {
    setFormData({ ...formData, ...newData });
  };

  const handleStyleSelect = (styleId) => {
    const updatedData = [...formData.manufacturersData];
    const lastEntry = updatedData[updatedData.length - 1];

    if (lastEntry) {
      lastEntry.selectedStyle = styleId;
      updatedData[updatedData.length - 1] = lastEntry;

      updateFormData({
        ...formData,
        manufacturersData: updatedData,
      });
    }

    nextStep();
  };

  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    // From step 1, go back to quotes list
    if (currentStep <= 1) {
      navigate('/quotes');
      return;
    }
    let step = backStep ? 4 : currentStep - 1;
    if (step < 1) step = 1;
    setCurrentStep(step);
  };

  const sendToBackend = async (actionType) => {
    try {
      console.log('🚀 [DEBUG] sendToBackend called from CreateProposalForm.jsx:', {
        actionType,
        customerId: formData.customerId,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        manufacturersDataLength: formData.manufacturersData?.length || 0,
        isContractor,
        contractorGroupId,
        timestamp: new Date().toISOString()
      });

      const payload = {
        action: actionType,
        formData: { ...formData, type: actionType },
      };

      console.log('📤 [DEBUG] Dispatching sendFormDataToBackend with payload:', {
        action: payload.action,
        customerId: payload.formData.customerId,
        customerName: payload.formData.customerName,
        payloadSize: JSON.stringify(payload).length,
        hasManufacturersData: !!payload.formData.manufacturersData?.length
      });

      const response = await dispatch(sendFormDataToBackend(payload));

      console.log('📥 [DEBUG] Response received from backend:', {
        success: response.payload?.success,
        message: response.payload?.message,
        hasData: !!response.payload?.data,
        proposalId: response.payload?.data?.id,
        timestamp: new Date().toISOString()
      });

      if (response.payload.success == true) {
        console.log('✅ [DEBUG] Proposal creation/update successful');
  Swal.fire(t('common.success','Success'), t('proposals.toast.successSend','Quote sent successfully'), 'success');
        setIsFormDirty(false);

        console.log('🔀 [DEBUG] Navigating back to quotes list');
        navigate('/quotes');
      } else {
        console.error('❌ [DEBUG] Backend operation failed:', response.payload);
  Swal.fire(t('common.error','Error'), response.payload?.message || t('proposals.errors.operationFailed','Operation failed. Please try again.'), 'error');
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error in sendToBackend from CreateProposalForm:', {
        error: error.message,
        stack: error.stack,
        actionType,
        customerId: formData.customerId,
        timestamp: new Date().toISOString()
      });

      if (error.response?.status === 403) {
  Swal.fire(t('common.error','Error'), t('settings.customization.ui.alerts.saveFailed','Failed to save customization. Please try again.'), 'error');
      } else if (error.response?.status === 400) {
  const message = error.response?.data?.message || t('proposals.errors.operationFailed','Operation failed. Please try again.');
  Swal.fire(t('common.error','Error'), message, 'error');
      } else {
  Swal.fire(t('common.error','Error'), error.message || t('proposals.toast.errorGeneric','An error occurred'), 'error');
      }
    }
  };

  const getStepInfo = () => {
    const steps = [
      { number: 1, title: t('proposals.create.steps.1'), icon: FaClipboardList },
      { number: 2, title: t('proposals.create.steps.2'), icon: FaCog },
      { number: 3, title: t('proposals.create.steps.3'), icon: FaFileContract },
      { number: 4, title: t('proposals.create.steps.4'), icon: FaPrint },
    ];
    return steps.find(step => step.number === currentStep) || steps[0];
  };

  const currentStepInfo = getStepInfo();

  const renderActionButtons = () => {
    if (currentStep !== 4) return null;

    return (
      <div className="d-flex gap-2 flex-wrap">
        <CButton
          className="shadow-sm px-4 fw-semibold d-flex align-items-center"
          style={{
            backgroundColor: hovered === 'print' ? '#218838' : '#28a745',
            color: '#fff',
            borderRadius: '8px',
            border: 'none',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={() => setHovered('print')}
          onMouseLeave={() => setHovered(null)}
          onClick={() => setShowPrintModal(true)}
        >
          <FaPrint className="me-2" />
          {t('proposals.create.actions.print')}
        </CButton>
        {!isContractor && (
          <>
            <CButton
              className="shadow-sm px-4 fw-semibold d-flex align-items-center"
              style={{
                backgroundColor: hovered === 'email' ? '#138496' : '#17a2b8',
                color: '#fff',
                borderRadius: '8px',
                border: 'none',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={() => setHovered('email')}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setShowEmailModal(true)}
            >
              <FaEnvelope className="me-2" />
              {t('proposals.create.actions.email')}
            </CButton>

            <CButton
              className="shadow-sm px-4 fw-semibold d-flex align-items-center"
              style={{
                backgroundColor: hovered === 'contract' ? '#e0a800' : '#ffc107',
                color: '#212529',
                borderRadius: '8px',
                border: 'none',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={() => setHovered('contract')}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setShowContractModal(true)}
            >
              <FaFileContract className="me-2" />
              {t('proposals.create.actions.contract')}
            </CButton>
          </>
        )}
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CustomerInfoStep
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            hideBack={false}
            isContractor={isContractor}
            contractorGroupId={contractorGroupId}
          />
        );
  case 2:
        return (
          <ManufacturerStep
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
    hideBack={false}
          />
        );
  case 3:
        if (!manufacturerData || Object.keys(manufacturerData).length === 0) {
          return (
            <CCard className="border-0 shadow-sm">
              <CCardBody className="text-center py-5">
                <CSpinner color="primary" size="lg" />
                <p className="text-muted mt-3 mb-0">{t('proposals.create.loadingManufacturer')}</p>
              </CCardBody>
            </CCard>
          );
        }
        return (
          <DesignImportStep
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            manufacturerData={manufacturerData}
            onStyleSelect={handleStyleSelect}
            hideBack={false}
          />
        );
  case 4:
        return (
          <ItemSelectionStep
            setFormData={setFormData}
            formData={formData}
            updateFormData={updateFormData}
            prevStep={prevStep}
            manufacturerData={manufacturerData}
            setCurrentStep={setCurrentStep}
            setBackStep={setBackStep}
            sendToBackend={sendToBackend}
    hideBack={false}
          />
        );
      default:
        return null;
    }
  };

  return (
    <CContainer fluid className="dashboard-container" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <PageHeader
        title={currentStepInfo.title}
        icon={currentStepInfo.icon}
        subtitle={t('proposals.create.stepOf', { current: currentStep, total: 4 })}
        badge={{
          text: isQuick ? t('proposals.create.quickMode') : t('proposals.create.standardMode'),
          variant: 'secondary'
        }}
        rightContent={renderActionButtons()}
      />

      {/* Progress Bar */}
      <CCard className="proposal-progress-bar">
        <CCardBody className="py-3">
          <div className="d-flex align-items-center justify-content-between position-relative w-100">
            {/* Progress line - full width background */}
            <div
              className="position-absolute w-100"
              style={{
                height: '2px',
                backgroundColor: '#e9ecef',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1
              }}
            />

            {/* Active progress line */}
            <div
              className="position-absolute"
              style={{
                height: '2px',
                backgroundColor: '#212529',
                top: '50%',
                transform: 'translateY(-50%)',
                width: `${((currentStep - 1) / 3) * 100}%`,
                transition: 'all 0.3s ease',
                zIndex: 2
              }}
            />

            {/* Step numbers - equally distributed */}
            {[1, 2, 3, 4].map((step, index) => (
              <div
                key={step}
                className="d-flex align-items-center justify-content-center fw-bold proposal-step-number position-relative"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: step <= currentStep ? '#212529' : '#ffffff',
                  color: step <= currentStep ? '#ffffff' : '#495057',
                  fontSize: '14px',
                  fontWeight: step <= currentStep ? '800' : '600',
                  transition: 'all 0.3s ease',
                  border: step <= currentStep ? '2px solid #343a40' : '2px solid #dee2e6',
                  boxShadow: step <= currentStep ? '0 3px 6px rgba(0,0,0,0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
                  zIndex: 3,
                  flexShrink: 0,
                  textShadow: step <= currentStep ? '0 2px 4px rgba(0, 0, 0, 0.9)' : 'none'
                }}
              >
                {step}
              </div>
            ))}
          </div>
        </CCardBody>
      </CCard>

      {/* Main Content */}
      <div className="mb-4">
        {renderStep()}
      </div>

      {/* Modals */}
      <PrintProposalModal show={showPrintModal} onClose={() => setShowPrintModal(false)} formData={formData} />
      <EmailProposalModal show={showEmailModal} onClose={() => setShowEmailModal(false)} formData={formData} />
      <EmailContractModal show={showContractModal} onClose={() => setShowContractModal(false)} />
    </CContainer>
  );
};

export default withContractorScope(ProposalForm, 'proposals', ['proposals:create']);