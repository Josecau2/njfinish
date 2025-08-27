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
    followUp1Date: '',
    followUp2Date: '',
    followUp3Date: '',
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
      const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave?');
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
      dispatch(fetchManufacturerById(formData.manufacturerId));
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
    let step = backStep ? 4 : currentStep - 1;
    if (step < 1) step = 1;
    setCurrentStep(step);
  };

  const sendToBackend = async (actionType) => {
    try {
      const payload = {
        action: actionType,
        formData: { ...formData, type: actionType },
      };

      const response = await dispatch(sendFormDataToBackend(payload));
      if (response.payload.success == true) {
        Swal.fire('Success!', 'Proposal saved successfully!', 'success');
        setIsFormDirty(false);
        navigate('/proposals');
      }
    } catch (error) {
      console.error('Error sending data to backend:', error);
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
            borderColor: hovered === 'print' ? '#218838' : '#28a745',
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
                borderColor: hovered === 'email' ? '#138496' : '#17a2b8',
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
                borderColor: hovered === 'contract' ? '#e0a800' : '#ffc107',
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
            hideBack={isQuick}
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
            hideBack={isQuick}
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
            hideBack={isQuick}
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
          variant: 'light'
        }}
        rightContent={renderActionButtons()}
      />

      {/* Progress Bar */}
      <CCard className="proposal-progress-bar">
        <CCardBody className="py-3">
          <div className="d-flex align-items-center justify-content-between">
            {[1, 2, 3, 4].map((step, index) => (
              <div key={step} className="d-flex align-items-center" style={{ flex: 1 }}>
                <div
                  className={`d-flex align-items-center justify-content-center fw-bold`}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: step <= currentStep ? 'var(--app-header-bg)' : '#e9ecef',
                    color: step <= currentStep ? 'var(--header-text-primary, #fff)' : '#6c757d',
                    fontSize: '14px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {step}
                </div>
                {index < 3 && (
                  <div
                    className="flex-grow-1 mx-2"
                    style={{
                      height: '2px',
                      backgroundColor: step < currentStep ? 'var(--app-header-bg)' : '#e9ecef',
                      transition: 'all 0.3s ease'
                    }}
                  />
                )}
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