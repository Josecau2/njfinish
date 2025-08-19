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

const ProposalForm = () => {
  const location = useLocation();
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
      { number: 1, title: 'Customer Information', icon: FaClipboardList },
      { number: 2, title: 'Manufacturer Selection', icon: FaCog },
      { number: 3, title: 'Design & Style', icon: FaFileContract },
      { number: 4, title: 'Proposal Summary', icon: FaPrint },
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
          Print Proposal
        </CButton>

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
          Email Proposal
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
          Email Contract
        </CButton>
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
                <p className="text-muted mt-3 mb-0">Loading manufacturer data...</p>
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
    <CContainer fluid className="p-2 m-2" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <CCard className="border-0 shadow-sm mb-2" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CCardBody className="py-4">
          <CRow className="align-items-center">
            <CCol>
              <div className="d-flex align-items-center gap-3">
                <div 
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <currentStepInfo.icon 
                    style={{ 
                      color: 'white', 
                      fontSize: '20px' 
                    }} 
                  />
                </div>
                <div>
                  <h3 className="text-white mb-1 fw-bold">{currentStepInfo.title}</h3>
                  <div className="d-flex align-items-center gap-3">
                    <p className="text-white-50 mb-0">Step {currentStep} of 4</p>
                    <CBadge 
                      color="light" 
                      className="px-3 py-2"
                      style={{ 
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        color: '#667eea'
                      }}
                    >
                      {isQuick ? 'Quick Mode' : 'Standard Mode'}
                    </CBadge>
                  </div>
                </div>
              </div>
            </CCol>
            <CCol xs="auto">
              {renderActionButtons()}
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Progress Bar */}
      <CCard className="border-0 shadow-sm mb-2">
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
                    backgroundColor: step <= currentStep ? '#667eea' : '#e9ecef',
                    color: step <= currentStep ? 'white' : '#6c757d',
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
                      backgroundColor: step < currentStep ? '#667eea' : '#e9ecef',
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

export default ProposalForm;