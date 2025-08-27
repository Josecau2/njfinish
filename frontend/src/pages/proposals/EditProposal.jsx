import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CButton,
  CCol,
  CForm,
  CFormInput,
  CRow,
  CTabs,
  CNav,
  CNavItem,
  CNavLink,
  CBadge,
  CFormLabel,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CAlert,
  CContainer,
  CCard,
  CCardBody,
} from '@coreui/react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchManufacturerById } from '../../store/slices/manufacturersSlice';
import { setSelectVersionNewEdit } from '../../store/slices/selectVersionNewEditSlice';
import { sendFormDataToBackend } from '../../store/slices/proposalSlice';
import CreatableSelect from 'react-select/creatable';
import { Formik } from 'formik';
import * as Yup from 'yup';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import CIcon from '@coreui/icons-react';
import { cilCopy, cilFile, cilList, cilOptions, cilPencil, cilTrash } from '@coreui/icons';
import { FaCalendarAlt, FaPrint, FaEnvelope, FaFileContract, FaCheckCircle } from 'react-icons/fa';
import Swal from 'sweetalert2';
import ItemSelectionContentEdit from '../../components/ItemSelectionContentEdit';
import FileUploadSection from './CreateProposal/FileUploadSection';
import PrintProposalModal from '../../components/model/PrintProposalModal';
import EmailProposalModal from '../../components/model/EmailProposalModal';
import EmailContractModal from '../../components/model/EmailContractModal';
import Loader from '../../components/Loader';
import axiosInstance from '../../helpers/axiosInstance';


const validationSchema = Yup.object().shape({
  //   customerName: Yup.string().required('Customer name is required'),
  description: Yup.string().required('Description is required'),
  designer: Yup.string().required('Designer is required'),
});

const statusOptions = [
  { label: 'Draft', value: 'Draft' },
  { label: 'Follow up 1', value: 'Follow up 1' },
  { label: 'Follow up 2', value: 'Follow up 2' },
  { label: 'Follow up 3', value: 'Follow up 3' },
  { label: 'Measurement Scheduled', value: 'Measurement Scheduled' },
  { label: 'Measurement done', value: 'Measurement done' },
  { label: 'Design done', value: 'Design done' },
  { label: 'Proposal done', value: 'Proposal done' },
  { label: 'Proposal accepted', value: 'Proposal accepted' },
  { label: 'Proposal rejected', value: 'Proposal rejected' },
];

const EditProposal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  // Get user info from store/localStorage
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = userInfo.role === 'Admin' || userInfo.role === 'admin';
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('item');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentEditIndex, setCurrentEditIndex] = useState(null);
  const [currentDeleteIndex, setCurrentDeleteIndex] = useState(null);
  const [editedVersionName, setEditedVersionName] = useState('');
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [designerOptions, setDesignerOptions] = useState([]);
  // Use manufacturers map from Redux so we can attach full manufacturer data
  const manufacturersByIdMap = useSelector((state) => state.manufacturers.byId);
  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  const loggedInUserId = loggedInUser?.userId;
  const hasSetInitialVersion = useRef(false);
  
  // Check if user is a contractor (should not see manufacturer version names)
  const isContractor = loggedInUser?.group && loggedInUser.group.group_type === 'contractor';

  const defaultFormData = {
    manufacturersData: [],
    designer: '',
    description: '',
    date: null,
    designDate: null,
    measurementDate: null,
    followUp1Date: null,
    followUp2Date: null,
    followUp3Date: null,
    status: 'Draft',
    files: [],
    customerName: '', // Added to match validationSchema
  };

  const [formData, setFormData] = useState(defaultFormData);
  // Determine if form should be disabled (locked proposal OR contractor viewing accepted proposal)
  const isAccepted = formData?.status === 'Proposal accepted' || formData?.status === 'accepted';
  const isFormDisabled = !!formData?.is_locked || (isAccepted && !isAdmin);
  
  // Debug logging to see current state
  console.log('🔍 EditProposal Debug:', {
    'formData.is_locked': formData?.is_locked,
    'formData.status': formData?.status,
    'userRole': userInfo?.role,
    'isAdmin': isAdmin,
    'isFormDisabled': isFormDisabled,
    'proposal_id': formData?.id
  });
  // Fetch initial data
  useEffect(() => {
    axiosInstance
      .get(`/api/proposals/proposalByID/${id}`)
      .then((res) => {
        setInitialData(res.data);
        setFormData(res.data || defaultFormData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching proposal:', err);
        setLoading(false);
      });
  }, [id]);

  // Fetch designers
  useEffect(() => {
    const fetchDesigners = async () => {
      try {
        const response = await axiosInstance.get('/api/designers');
        const designerData = response.data.users.map((designer) => ({
          value: designer.id,
          label: designer.name,
        }));
        setDesignerOptions(designerData);
      } catch (error) {
        console.error('Error fetching designers:', error);
      }
    };
    fetchDesigners();
  }, []);

  // Update formData when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Fetch manufacturers data
  useEffect(() => {
    if (formData?.manufacturersData?.length > 0) {
      // Initialize index; actual selectedVersion will be set when details are ready
      if (selectedVersionIndex === null) setSelectedVersionIndex(0);

      formData.manufacturersData.forEach((item) => {
        if (item.manufacturer && !manufacturersByIdMap[item.manufacturer]) {
          // Don't load full catalog data for proposal editing - only manufacturer info needed
          dispatch(fetchManufacturerById({ id: item.manufacturer, includeCatalog: false }));
        }
      });
    }
  }, [formData?.manufacturersData, dispatch, manufacturersByIdMap, selectedVersionIndex]);

  useEffect(() => {
    if (!Array.isArray(formData.manufacturersData) || formData.manufacturersData.length === 0) return;

    const details = formData.manufacturersData.map((item) => ({
      ...item,
      manufacturerData: manufacturersByIdMap[item.manufacturer],
    }));

    if (details.length === 0) return;

    // First-time init
    if (selectedVersionIndex === null && !hasSetInitialVersion.current) {
      setSelectedVersionIndex(0);
      setSelectedVersion(details[0]);
      hasSetInitialVersion.current = true;
      dispatch(setSelectVersionNewEdit(details[0]));
      return;
    }

    // Keep selectedVersion in sync when manufacturer data loads or index changes
    if (selectedVersionIndex !== null) {
      const next = details[selectedVersionIndex] || details[0];
      if (!selectedVersion || selectedVersion.versionName !== next.versionName || (!selectedVersion.manufacturerData && next.manufacturerData)) {
        setSelectedVersion(next);
        dispatch(setSelectVersionNewEdit(next));
      }
    }
  }, [formData.manufacturersData, manufacturersByIdMap, selectedVersionIndex]);

  // Update selected version in Redux
  useEffect(() => {
    if (selectedVersion) {
      dispatch(setSelectVersionNewEdit(selectedVersion));
    }
  }, [selectedVersion, dispatch]);

  const updateFormData = (updatedFields) => {
    setFormData((prev) => ({
      ...prev,
      ...updatedFields,
    }));
  };

  const handleBadgeClick = (index, version) => {
    setSelectedVersionIndex(index);
    setSelectedVersion(version);
    dispatch(setSelectVersionNewEdit(version));
  };

  const handleTabSelect = (tabName) => {
    setActiveTab(tabName);
  };

  const openEditModal = (index) => {
    setCurrentEditIndex(index);
    setEditedVersionName(versionDetails[index].versionName);
    setEditModalOpen(true);
  };

  const saveEditVersionName = () => {
    const existingEntry = formData.manufacturersData.find(
      (entry, idx) => entry.versionName === editedVersionName && idx !== currentEditIndex
    );
    if (existingEntry) {
      Swal.fire({
        icon: 'error',
        title: 'Duplicate Version Name',
        text: `Manufacturer Version "${editedVersionName}" already exists.`,
      });
      return;
    }
    const updatedManufacturersData = [...formData.manufacturersData];
    updatedManufacturersData[currentEditIndex].versionName = editedVersionName;
    updateFormData({ manufacturersData: updatedManufacturersData });
    setEditModalOpen(false);
  };

  const openDeleteModal = (index) => {
    setCurrentDeleteIndex(index);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    const updatedManufacturersData = formData.manufacturersData.filter(
      (_, i) => i !== currentDeleteIndex
    );
    updateFormData({ manufacturersData: updatedManufacturersData });

    if (currentDeleteIndex === selectedVersionIndex) {
      setSelectedVersionIndex(null);
      setSelectedVersion(null);
    } else if (currentDeleteIndex < selectedVersionIndex) {
      setSelectedVersionIndex(selectedVersionIndex - 1);
    }

    setDeleteModalOpen(false);
  };

  const duplicateVersion = (index) => {
    const copy = { ...formData.manufacturersData[index] };
    copy.versionName = `Copy of ${copy.versionName}`;
    updateFormData({ manufacturersData: [...formData.manufacturersData, copy] });
  };

  const versionDetails = formData?.manufacturersData?.map((item) => ({
    ...item,
    manufacturerData: manufacturersByIdMap[item.manufacturer],
  })) || [];

  const selectVersion = versionDetails[selectedVersionIndex] || null;

  const handleSubmit = (values) => {
    sendToBackend({ ...formData, ...values }, 'update');
  };

  const handleSaveOrder = () => sendToBackend({ ...formData }, 'update');
  const handleAcceptOrder = () => sendToBackend({ ...formData, status: 'Proposal accepted' }, 'accept');
  const handleRejectOrder = () => sendToBackend({ ...formData, status: 'Proposal rejected' }, 'reject');

  const sendToBackend = async (finalData, action = 'update') => {
    try {
      const payload = { action, formData: finalData };
      
      // Add validation checks
      if (!finalData.id) {
        Swal.fire('Error!', 'Proposal ID is missing. Cannot update proposal.', 'error');
        return;
      }
      
      // Check if proposal is already locked
      if (finalData.is_locked && (action === 'accept' || action === 'reject')) {
        Swal.fire('Cannot Modify', 'This proposal is already accepted and locked. It cannot be modified.', 'warning');
        return;
      }
      
      // Check if trying to accept an already accepted proposal
      if (action === 'accept' && (finalData.status === 'Proposal accepted' || finalData.status === 'accepted')) {
        Swal.fire('Already Accepted', 'This proposal has already been accepted.', 'info');
        return;
      }
      
      console.log('🔄 Sending proposal update:', { 
        id: finalData.id, 
        action, 
        currentStatus: finalData.status,
        isLocked: finalData.is_locked,
        newStatus: action === 'accept' ? 'Proposal accepted' : finalData.status
      });
      
      const response = await dispatch(sendFormDataToBackend(payload));
      
      if (response.payload.success === true) {
        Swal.fire('Success!', 'Proposal saved successfully!', 'success');
        navigate('/proposals');
      } else if (response.error) {
        // Handle Redux Toolkit's error format
        const errorMessage = response.error.message || response.payload?.message || 'Failed to save proposal';
        console.error('❌ Update failed:', response.error);
        
        if (errorMessage.includes('locked')) {
          Swal.fire('Cannot Edit', 'This proposal is locked and cannot be edited.', 'warning');
        } else if (errorMessage.includes('permission') || errorMessage.includes('access')) {
          Swal.fire('Access Denied', 'You do not have permission to edit this proposal.', 'error');
        } else if (errorMessage.includes('Invalid status transition')) {
          Swal.fire('Invalid Action', 'This status change is not allowed. The proposal may already be processed.', 'warning');
        } else {
          Swal.fire('Error!', errorMessage, 'error');
        }
      }
    } catch (error) {
      console.error('Error sending data to backend:', error);
      
      // More specific error handling
      if (error.response?.status === 403) {
        const message = error.response.data?.message || 'Access denied';
        if (message.includes('locked')) {
          Swal.fire('Cannot Edit', 'This proposal is locked and cannot be edited.', 'warning');
        } else {
          Swal.fire('Access Denied', message, 'error');
        }
      } else if (error.response?.status === 400) {
        const message = error.response.data?.message || 'Invalid request';
        if (message.includes('Invalid status transition')) {
          Swal.fire('Invalid Action', 'This status change is not allowed. The proposal may already be processed.', 'warning');
        } else {
          Swal.fire('Validation Error', message, 'error');
        }
      } else {
        Swal.fire('Error!', 'Failed to save proposal. Please try again.', 'error');
      }
    }
  };

  if (loading) {
    return <Loader />;
  }



  return (
    <>
  <div className="header py-3 px-4 border-bottom d-flex justify-content-between align-items-center flex-wrap">
        <div className="d-flex align-items-center gap-3">
          <h4 className="text-muted m-0">Edit Proposal</h4>
          {(formData?.status === 'Proposal accepted' || formData?.status === 'accepted') && (
            <CBadge color="success" className="px-2 py-1">{t('proposals.lockedStatus.title')}</CBadge>
          )}
          {formData?.is_locked && (
            <CBadge color="dark" className="px-2 py-1">Locked</CBadge>
          )}
        </div>
  <div className="d-flex gap-2 flex-wrap mobile-action-buttons">
          <div
            className="px-3 py-2 rounded d-flex align-items-center"
            style={{
              backgroundColor: hovered === 'print' ? '#218838' : '#28a745',
              color: '#fff',
              cursor: 'pointer',
              transition: '0.2s',
            }}
            onMouseEnter={() => setHovered('print')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => setShowPrintModal(true)}
          >
            <FaPrint className="me-2" />
            Print Proposal
          </div>
          {!(loggedInUser?.group && loggedInUser.group.group_type === 'contractor') && (
            <>
              <div
                className="px-3 py-2 rounded d-flex align-items-center"
                style={{
                  backgroundColor: hovered === 'email' ? '#138496' : '#17a2b8',
                  color: '#fff',
                  cursor: 'pointer',
                  transition: '0.2s',
                }}
                onMouseEnter={() => setHovered('email')}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setShowEmailModal(true)}
              >
                <FaEnvelope className="me-2" />
                Email Proposal
              </div>
              <div
                className="px-3 py-2 rounded d-flex align-items-center"
                style={{
                  backgroundColor: hovered === 'contract' ? '#e0a800' : '#ffc107',
                  color: '#212529',
                  cursor: 'pointer',
                  transition: '0.2s',
                }}
                onMouseEnter={() => setHovered('contract')}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setShowContractModal(true)}
              >
                <FaFileContract className="me-2" />
                Email Contract
              </div>
            </>
          )}
        </div>
      </div>

      <CContainer fluid className="dashboard-container" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        <Formik
          initialValues={formData}
          enableReinitialize
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit }) => {
            // Sync formData with Formik's values
            useEffect(() => {
              updateFormData(values);
            }, [values]);

            return (
              <CForm onSubmit={handleSubmit}>
                {/* Basic Information Card */}
                <CCard className="mb-4">
                  <CCardBody>
                    <h5 className="mb-4">Basic Information</h5>
                    <CRow>
                      <CCol xs={12} md={6} lg={4} className="mb-3">
                        <CFormLabel htmlFor="designer">Designer *</CFormLabel>
                        <CreatableSelect
                          isClearable
                          id="designer"
                          name="designer"
                          options={designerOptions}
                          value={designerOptions.find((opt) => opt.value === values.designer) || null}
                          onChange={(selectedOption) => {
                            updateFormData({ designer: selectedOption?.value || '' });
                          }}
                          onBlur={handleBlur}
                        />
                        {errors.designer && touched.designer && (
                          <div className="text-danger small mt-1">{errors.designer}</div>
                        )}
                      </CCol>
                      <CCol xs={12} md={6} lg={4} className="mb-3">
                        <CFormLabel htmlFor="description">Description *</CFormLabel>
                        <CFormInput
                          type="text"
                          id="description"
                          name="description"
                          value={values.description}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Description"
                          disabled={isFormDisabled}
                        />
                        {errors.description && touched.description && (
                          <div className="text-danger small mt-1">{errors.description}</div>
                        )}
                      </CCol>
                      <CCol xs={12} md={6} lg={4} className="mb-3">
                        <CFormLabel htmlFor="status">Status</CFormLabel>
                        <CreatableSelect
                          isClearable
                          options={statusOptions}
                          value={statusOptions.find((opt) => opt.value === (values.status || 'Draft'))}
                          onChange={(selectedOption) => {
                            updateFormData({ status: selectedOption?.value || 'Draft' });
                          }}
                          onBlur={handleBlur}
                          inputId="status"
                          isDisabled={isFormDisabled}
                        />
                      </CCol>
                    </CRow>
                  </CCardBody>
                </CCard>

                {/* Dates Card */}
                <CCard className="mb-4">
                  <CCardBody>
                    <h5 className="mb-4">Important Dates</h5>
                    <CRow>
                      <CCol xs={12} md={6} lg={4} className="mb-3">
                        <div style={{ position: 'relative' }}>
                          <CFormLabel htmlFor="date">Date</CFormLabel>
                          <DatePicker
                            id="date"
                            selected={formData.date ? new Date(formData.date) : new Date()}
                            onChange={(date) => updateFormData({ date })}
                            className="form-control"
                            dateFormat="MM/dd/yyyy"
                            wrapperClassName="w-100"
                            disabled={isFormDisabled}
                            placeholderText="Date"
                          />
                          <FaCalendarAlt
                            style={{
                              position: 'absolute',
                              top: '70%',
                              right: '12px',
                              transform: 'translateY(-50%)',
                              color: '#6c757d',
                              pointerEvents: 'none',
                            }}
                          />
                        </div>
                      </CCol>
                      <CCol xs={12} md={6} lg={4} className="mb-3">
                        <div style={{ position: 'relative' }}>
                          <CFormLabel htmlFor="designDate">Design Date</CFormLabel>
                          <DatePicker
                            id="designDate"
                            selected={formData.designDate ? new Date(formData.designDate) : null}
                            onChange={(date) => updateFormData({ designDate: date })}
                            className="form-control"
                            dateFormat="MM/dd/yyyy"
                            wrapperClassName="w-100"
                            disabled={isFormDisabled}
                            placeholderText="Design Date"
                          />
                          <FaCalendarAlt
                            style={{
                              position: 'absolute',
                              top: '70%',
                              right: '12px',
                              transform: 'translateY(-50%)',
                              color: '#6c757d',
                              pointerEvents: 'none',
                            }}
                          />
                        </div>
                      </CCol>
                      <CCol xs={12} md={6} lg={4} className="mb-3">
                        <div style={{ position: 'relative' }}>
                          <CFormLabel htmlFor="measurementDate">Measurement Date</CFormLabel>
                          <DatePicker
                            id="measurementDate"
                            selected={formData.measurementDate ? new Date(formData.measurementDate) : null}
                            onChange={(date) => updateFormData({ measurementDate: date })}
                            className="form-control"
                            dateFormat="MM/dd/yyyy"
                            wrapperClassName="w-100"
                            disabled={isFormDisabled}
                            placeholderText="Measurement Date"
                          />
                          <FaCalendarAlt
                            style={{
                              position: 'absolute',
                              top: '70%',
                              right: '12px',
                              transform: 'translateY(-50%)',
                              color: '#6c757d',
                              pointerEvents: 'none',
                            }}
                          />
                        </div>
                      </CCol>
                    </CRow>
                    <CRow>
                      <CCol xs={12} md={6} lg={4} className="mb-3">
                        <div style={{ position: 'relative' }}>
                          <CFormLabel htmlFor="followUp1Date">Follow up 1 Date</CFormLabel>
                          <DatePicker
                            id="followUp1Date"
                            selected={formData.followUp1Date ? new Date(formData.followUp1Date) : null}
                            onChange={(date) => updateFormData({ followUp1Date: date })}
                            className="form-control"
                            dateFormat="MM/dd/yyyy"
                            wrapperClassName="w-100"
                            disabled={isFormDisabled}
                            placeholderText="Follow up 1 Date"
                          />
                          <FaCalendarAlt
                            style={{
                              position: 'absolute',
                              top: '70%',
                              right: '12px',
                              transform: 'translateY(-50%)',
                              color: '#6c757d',
                              pointerEvents: 'none',
                            }}
                          />
                        </div>
                      </CCol>
                      <CCol xs={12} md={6} lg={4} className="mb-3">
                        <div style={{ position: 'relative' }}>
                          <CFormLabel htmlFor="followUp2Date">Follow up 2 Date</CFormLabel>
                          <DatePicker
                            id="followUp2Date"
                            selected={formData.followUp2Date ? new Date(formData.followUp2Date) : null}
                            onChange={(date) => updateFormData({ followUp2Date: date })}
                            className="form-control"
                            dateFormat="MM/dd/yyyy"
                            wrapperClassName="w-100"
                            disabled={isFormDisabled}
                            placeholderText="Follow up 2 Date"
                          />
                          <FaCalendarAlt
                            style={{
                              position: 'absolute',
                              top: '70%',
                              right: '12px',
                              transform: 'translateY(-50%)',
                              color: '#6c757d',
                              pointerEvents: 'none',
                            }}
                          />
                        </div>
                      </CCol>
                      <CCol xs={12} md={6} lg={4} className="mb-3">
                        <div style={{ position: 'relative' }}>
                          <CFormLabel htmlFor="followUp3Date">Follow up 3 Date</CFormLabel>
                          <DatePicker
                            id="followUp3Date"
                            selected={formData.followUp3Date ? new Date(formData.followUp3Date) : null}
                            onChange={(date) => updateFormData({ followUp3Date: date })}
                            className="form-control"
                            dateFormat="MM/dd/yyyy"
                            wrapperClassName="w-100"
                            disabled={isFormDisabled}
                            placeholderText="Follow up 3 Date"
                          />
                          <FaCalendarAlt
                            style={{
                              position: 'absolute',
                              top: '70%',
                              right: '12px',
                              transform: 'translateY(-50%)',
                              color: '#6c757d',
                              pointerEvents: 'none',
                            }}
                          />
                        </div>
                      </CCol>
                    </CRow>
                  </CCardBody>
                </CCard>

                {/* Tabs section for manufacturers */}

                {/* Version badges - reuse create mobile styles */}
                <div className="proposal-version-badges">
                  {versionDetails.map((version, index) => {
                    const isSelected = index === selectedVersionIndex;
                    return (
                      <CBadge
                        key={index}
                        className={`proposal-version-badge p-2 d-flex ${isSelected ? 'selected' : ''}`}
                        style={{
                          fontSize: '0.8rem',
                          backgroundColor: isSelected ? '#084298' : '#d0e7ff',
                          color: isSelected ? '#d0e7ff' : '#084298',
                          borderRadius: '5px',
                          transition: 'all 0.3s ease',
                        }}
                        onClick={() => handleBadgeClick(index, version)}
                      >
                        <div>
                          {!isContractor && (
                            <strong style={{ display: 'block' }}>{version.versionName}</strong>
                          )}
                          <small
                            style={{
                              fontSize: '0.7rem',
                              color: isSelected ? '#a9c7ff' : '#4a6fa5',
                            }}
                          >
                            $ {version.manufacturerData?.costMultiplier || 'N/A'}
                          </small>
                        </div>
                        {!isContractor && (
                          <CDropdown onClick={(e) => e.stopPropagation()}>
                            <CDropdownToggle
                              color="transparent"
                              size="sm"
                              style={{
                                padding: '0 4px',
                                color: isSelected ? '#d0e7ff' : '#084298',
                                backgroundColor: 'transparent',
                                borderWidth: 0,
                                borderStyle: 'none',
                                outline: 'none',
                                boxShadow: 'none',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <CIcon icon={cilOptions} />
                            </CDropdownToggle>
                            <CDropdownMenu
                              style={{
                                minWidth: '120px',
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: '#e0e0e0',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                borderRadius: '4px',
                                padding: '4px 0',
                              }}
                            >
                              <CDropdownItem
                                onClick={() => openEditModal(index)}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.875rem',
                                  color: '#333',
                                  transition: 'all 0.2s ease',
                                }}
                              >
                                <CIcon icon={cilPencil} className="me-2" /> Edit
                              </CDropdownItem>
                              <CDropdownItem
                                onClick={() => openDeleteModal(index)}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.875rem',
                                  color: '#dc3545',
                                  transition: 'all 0.2s ease',
                                }}
                              >
                                <CIcon icon={cilTrash} className="me-2" /> Delete
                              </CDropdownItem>
                              <CDropdownItem
                                onClick={() => duplicateVersion(index)}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.875rem',
                                  color: '#333',
                                  transition: 'all 0.2s ease',
                                }}
                              >
                                <CIcon icon={cilCopy} className="me-2" /> Duplicate
                              </CDropdownItem>
                            </CDropdownMenu>
                          </CDropdown>
                        )}
                      </CBadge>
                    );
                  })}
                </div>

                <hr />

                <CTabs className="proposal-tabs">
                  <CNav variant="tabs" className="proposal-tabs border-0">
                    <CNavItem>
                      <CNavLink
                        active={activeTab === 'item'}
                        onClick={() => handleTabSelect('item')}
                        style={{
                          cursor: 'pointer',
                          border: 'none',
                          padding: '10px 20px',
                          fontWeight: 600,
                          color: activeTab === 'item' ? '#084298' : '#6c757d',
                          backgroundColor: activeTab === 'item' ? 'rgba(8, 66, 152, 0.1)' : 'transparent',
                          borderBottom: activeTab === 'item' ? '3px solid #084298' : 'none',
                          transition: 'all 0.3s ease',
                          borderRadius: '4px 4px 0 0',
                          marginRight: '4px',
                        }}
                      >
                        <span className="d-flex align-items-center">
                          <CIcon icon={cilList} className="me-2" />
                          Items
                        </span>
                      </CNavLink>
                    </CNavItem>
                    <CNavItem>
                      <CNavLink
                        active={activeTab === 'file'}
                        onClick={() => handleTabSelect('file')}
                        style={{
                          cursor: 'pointer',
                          border: 'none',
                          padding: '10px 20px',
                          fontWeight: 600,
                          color: activeTab === 'file' ? '#084298' : '#6c757d',
                          backgroundColor: activeTab === 'file' ? 'rgba(8, 66, 152, 0.1)' : 'transparent',
                          borderBottom: activeTab === 'file' ? '3px solid #084298' : 'none',
                          transition: 'all 0.3s ease',
                          borderRadius: '4px 4px 0 0',
                        }}
                      >
                        <span className="d-flex align-items-center">
                          <CIcon icon={cilFile} className="me-2" />
                          Files
                        </span>
                      </CNavLink>
                    </CNavItem>
                  </CNav>
                </CTabs>

                {activeTab === 'item' && (
                  <div className="tab-content mt-5">
                    <ItemSelectionContentEdit
                      selectedVersion={selectedVersion}
                      formData={formData}
                      setFormData={setFormData}
                      setSelectedVersion={setSelectedVersion}
                      selectVersion={selectVersion}
                      readOnly={isFormDisabled}
                    />
                  </div>
                )}

                {activeTab === 'file' && (
                  <div className="tab-content mt-5">
                    <h5>File Upload Section</h5>
                    <p>This section allows users to upload or manage files.</p>
                    <FileUploadSection
                      proposalId={formData.id}
                      onFilesChange={(files) => updateFormData({ files })}
                    />
                  </div>
                )}

                <hr />
                <div
                  className="d-flex justify-content-center align-items-center flex-wrap gap-3 p-3"
                  style={{ maxWidth: '600px', margin: '0 auto' }}
                >
                  {(isFormDisabled) ? (
                    // Show status message instead of buttons when proposal is locked OR when contractor views accepted proposal
                    <div className="w-100">
                      <CAlert color="success" className="text-center">
                        <h5 className="alert-heading mb-3">
                          <FaCheckCircle className="me-2" />
                          {t('proposals.lockedStatus.title')}
                        </h5>
                        <p className="mb-2">
                          {t('proposals.lockedStatus.description')}
                        </p>
                        <small className="text-muted">
                          {t('proposals.lockedStatus.processingNote')}
                        </small>
                      </CAlert>
                    </div>
                  ) : (
                    // Show action buttons only when proposal is not locked
                    <>
                      <CButton
                        color="secondary"
                        variant="outline"
                        onClick={handleSaveOrder}
                        style={{ minWidth: '140px' }}
                      >
                        Save
                      </CButton>
                      {formData.status !== 'Proposal accepted' && formData.status !== 'accepted' && (
                        <>
                          <CButton
                            color="success"
                            onClick={handleAcceptOrder}
                            style={{ minWidth: '140px' }}
                          >
                            Accept and Order
                          </CButton>
                          <CButton
                            color="danger"
                            variant="outline"
                            onClick={handleRejectOrder}
                            style={{ minWidth: '140px' }}
                          >
                            Reject and Archive
                          </CButton>
                        </>
                      )}
                    </>
                  )}
                </div>
              </CForm>
            );
          }}
        </Formik>
      </CContainer>

      <PrintProposalModal show={showPrintModal} onClose={() => setShowPrintModal(false)} formData={formData} />
      <EmailProposalModal show={showEmailModal} onClose={() => setShowEmailModal(false)} formData={formData} />
      <EmailContractModal show={showContractModal} onClose={() => setShowContractModal(false)} />

      <CModal
        visible={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        alignment="center"
        backdrop="static"
        className="modal-lg"
      >
        <CModalHeader closeButton>
          <CModalTitle>Edit Version Name</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CFormInput
            className="mb-3"
            value={editedVersionName}
            onChange={(e) => setEditedVersionName(e.target.value)}
            placeholder="Version Name"
          />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setEditModalOpen(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={saveEditVersionName}>
            Save
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal
        visible={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        alignment="center"
        backdrop="static"
        className="modal-sm"
      >
        <CModalHeader closeButton>
          <CModalTitle>Confirm Delete</CModalTitle>
        </CModalHeader>
        <CModalBody>Are you sure you want to delete this version?</CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </CButton>
          <CButton color="danger" onClick={confirmDelete}>
            Delete
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default EditProposal;